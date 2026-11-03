import hashlib
import os
import re
import sqlite3
import time
from datetime import datetime, timedelta, timezone
from functools import wraps
from pathlib import Path

import jwt
from dotenv import load_dotenv
from flask import Flask, current_app, g, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit


load_dotenv(Path(__file__).with_name(".env"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    boardId INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "order" REAL NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listId INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    dueDate TEXT NOT NULL,
    priority REAL NOT NULL,
    isCompleted INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS boards_user_created ON boards(userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS lists_user_board ON lists(userId, boardId);
CREATE INDEX IF NOT EXISTS cards_user_list ON cards(userId, listId);
"""


class ApiError(Exception):
    def __init__(self, status, message, field="body"):
        super().__init__(message)
        self.status = status
        self.message = message
        self.field = field


def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace(
        "+00:00", "Z"
    )


def public_document(row):
    document = dict(row)
    document["id"] = str(document.pop("id"))
    document.pop("password", None)
    if "isCompleted" in document:
        document["isCompleted"] = bool(document["isCompleted"])
    return document


def body_json():
    body = request.get_json(silent=True)
    return body if isinstance(body, dict) else {}


def error_response(error):
    return (
        jsonify(
            success=False,
            errors=[{"message": error.message, "field": error.field}],
        ),
        error.status,
    )


def fail(status, message, field="body"):
    raise ApiError(status, message, field)


def valid_id(value):
    return isinstance(value, str) and re.fullmatch(r"[1-9]\d*", value) is not None


def parse_expiry(value):
    if isinstance(value, int):
        return value
    match = re.fullmatch(r"\s*(\d+)\s*([smhd])\s*", str(value), re.IGNORECASE)
    if not match:
        raise ValueError("JWT_EXPIRES_IN must be seconds or a value such as 6h or 15m")
    amount = int(match.group(1))
    unit = match.group(2).lower()
    return amount * {"s": 1, "m": 60, "h": 3600, "d": 86400}[unit]


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE_PATH"])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def create_app(config=None):
    app = Flask(__name__)
    default_db = Path(__file__).with_name("instance") / "utask.sqlite3"
    app.config.update(
        DATABASE_PATH=os.getenv("DATABASE_PATH", str(default_db)),
        JWT_SECRET=os.getenv("JWT_SECRET", "secret"),
        JWT_EXPIRES_IN=os.getenv("JWT_EXPIRES_IN", "6h"),
        CORS_ORIGINS=os.getenv("CORS_ORIGINS", "http://localhost:5173"),
    )
    if config:
        app.config.update(config)

    database_path = Path(app.config["DATABASE_PATH"])
    if str(database_path) == ":memory:":
        raise ValueError(
            "DATABASE_PATH must be a file path so connections share the same database."
        )
    if not database_path.is_absolute():
        database_path = Path(__file__).parent / database_path
        app.config["DATABASE_PATH"] = str(database_path)
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(database_path))
    try:
        connection.executescript(SCHEMA)
    finally:
        connection.close()

    origins = [
        origin.strip()
        for origin in app.config["CORS_ORIGINS"].split(",")
        if origin.strip()
    ]
    CORS(app, origins=origins)
    socketio = SocketIO(app, cors_allowed_origins=origins, async_mode="threading")
    app.extensions["socketio"] = socketio
    app.teardown_appcontext(close_db)
    revoked_tokens = set()
    socket_users = {}

    def sign_in(user):
        now = datetime.now(timezone.utc)
        token = jwt.encode(
            {
                "userId": str(user["id"]),
                "iat": now,
                "exp": now + timedelta(seconds=parse_expiry(app.config["JWT_EXPIRES_IN"])),
            },
            app.config["JWT_SECRET"],
            algorithm="HS256",
        )
        return {"token": token, "user": public_document(user)}

    def token_user_id(token):
        if not token or token in revoked_tokens:
            return None
        try:
            payload = jwt.decode(token, app.config["JWT_SECRET"], algorithms=["HS256"])
        except jwt.InvalidTokenError:
            return None
        user_id = payload.get("userId")
        return user_id if valid_id(user_id) else None

    def current_user_id():
        scheme, _, token = request.headers.get("Authorization", "").partition(" ")
        return token_user_id(token.strip()) if scheme.lower() == "bearer" else None

    def authorized(handler):
        @wraps(handler)
        def wrapper(*args, **kwargs):
            user_id = current_user_id()
            if not user_id:
                return error_response(ApiError(401, "Unauthorized", "authorization"))
            request.user_id = int(user_id)
            return handler(*args, **kwargs)

        return wrapper

    def require_id(value, entity):
        if not valid_id(value):
            fail(400, f"Invalid {entity} ID", f"{entity}Id")
        return int(value)

    def require_user_id(user_id):
        return require_id(user_id, "user")

    def validation_error(name, message):
        fields = {
            "board": "name",
            "list": "name",
            "order": "order",
            "card": "title",
            "dueDate": "dueDate",
            "listId": "listId",
            "priority": "priority",
        }
        fail(400, message, fields.get(name, "body"))

    def validate_list_order(value, mode):
        if value is None:
            message = (
                "Order is required parameter."
                if mode == "create"
                else "Order is required parameter in the body."
            )
            validation_error("order", message)
        try:
            number = float(value)
        except (TypeError, ValueError):
            validation_error("order", "Order must be a number.")
        if number != number or number in (float("inf"), float("-inf")):
            validation_error("order", "Order must be a number.")
        if number < 0:
            validation_error("order", "Order must be a positive number.")
        return number

    def validate_card(body):
        title = body.get("title")
        description = body.get("description")
        list_id = body.get("listId")
        due_date = body.get("dueDate")
        priority = body.get("priority")

        if not title:
            validation_error("card", "title is required parameters.")
        if not list_id:
            validation_error("listId", "list Id is required parameters.")
        if description is None or not isinstance(description, (str, list, dict)):
            validation_error("body", "description is a required parameter.")
        if len(description) < 1:
            validation_error("body", "description is a required parameter.")
        if not valid_id(list_id):
            validation_error("listId", "listId must be a valid ID.")
        if not isinstance(title, str) or len(title) <= 2:
            validation_error("card", "title must be at least 3 characters long.")
        if not isinstance(due_date, str) or not due_date:
            validation_error("dueDate", "dueDate must be a valid date string.")
        try:
            parsed_date = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
        except ValueError:
            validation_error("dueDate", "dueDate must be a valid date string.")
        if priority is None:
            validation_error("priority", "priority is a required parameter.")
        try:
            priority_number = float(priority)
        except (TypeError, ValueError):
            validation_error("priority", "priority must be a number.")
        if priority_number != priority_number or priority_number in (
            float("inf"),
            float("-inf"),
        ):
            validation_error("priority", "priority must be a number.")
        if not 1 <= priority_number <= 3:
            validation_error("priority", "priority must be a number between 1 and 3.")
        if parsed_date.tzinfo is None:
            parsed_date = parsed_date.replace(tzinfo=timezone.utc)
        return parsed_date.isoformat(timespec="milliseconds").replace("+00:00", "Z"), priority_number

    def query_one(sql, params=()):
        return get_db().execute(sql, params).fetchone()

    def query_all(sql, params=()):
        return get_db().execute(sql, params).fetchall()

    def db_error_field(message, entity):
        if entity == "board":
            field = "boardId" if "board ID" in message or "Board not found" in message else "name" if "Board name" in message else "body"
        elif entity == "list":
            field = "listId" if "list ID" in message or "List not found" in message else "boardId" if "boardId" in message else "order" if "Order" in message or "order" in message else "name" if "name" in message else "body"
        else:
            field = "cardId" if "card ID" in message or "Card not found" in message else "title" if "title" in message else "dueDate" if "dueDate" in message else "listId" if "listId" in message else "priority" if "priority" in message else "body"
        return ApiError(400, message, field)

    @app.errorhandler(ApiError)
    def handle_api_error(error):
        return error_response(error)

    @app.get("/")
    def hello():
        return "Hello World", 200, {"Content-Type": "text/plain; charset=utf-8"}

    @app.get("/health")
    def health():
        return jsonify(ok=True)

    @app.post("/api/users/register")
    def register():
        body = body_json()
        username = body.get("username")
        password = body.get("password")
        username = username.strip() if isinstance(username, str) else ""
        if not username or not isinstance(password, str) or not password:
            fail(400, "Username and password are required", "username, password")
        now = utc_now()
        try:
            cursor = get_db().execute(
                "INSERT INTO users (username, password, createdAt, updatedAt) VALUES (?, ?, ?, ?)",
                (username, hashlib.sha256(password.encode("utf-8")).hexdigest(), now, now),
            )
        except sqlite3.IntegrityError:
            fail(409, "User already exists", "username")
        get_db().commit()
        user = query_one("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,))
        return jsonify(success=True, data=public_document(user))

    @app.post("/api/users/login")
    def login():
        body = body_json()
        password = body.get("password")
        password = password if isinstance(password, str) else ""
        user = query_one(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            (body.get("username"), hashlib.sha256(password.encode("utf-8")).hexdigest()),
        )
        if not user:
            fail(401, "Invalid credentials", "username or password")
        return jsonify(success=True, data=sign_in(user))

    @app.post("/api/users/logout")
    def logout():
        scheme, _, token = request.headers.get("Authorization", "").partition(" ")
        if scheme.lower() == "bearer" and token.strip():
            revoked_tokens.add(token.strip())
        return jsonify(success=True, data={"message": "Logged out"})

    @app.get("/api/users/profile")
    @authorized
    def profile():
        user = query_one("SELECT * FROM users WHERE id = ?", (request.user_id,))
        if not user:
            fail(404, "User not found", "userId")
        return jsonify(success=True, data=public_document(user))

    @app.get("/api/boards")
    @authorized
    def list_boards():
        rows = query_all(
            "SELECT * FROM boards WHERE userId = ? ORDER BY createdAt DESC",
            (require_user_id(str(request.user_id)),),
        )
        return jsonify(success=True, data=[public_document(row) for row in rows])

    @app.get("/api/boards/<board_id>")
    @authorized
    def get_board(board_id):
        if not valid_id(board_id):
            fail(404, "Board not found or unauthorized", "boardId")
        board = query_one(
            "SELECT * FROM boards WHERE id = ? AND userId = ?",
            (int(board_id), request.user_id),
        )
        if not board:
            fail(404, "Board not found or unauthorized", "boardId")
        return jsonify(success=True, data=public_document(board))

    @app.post("/api/boards")
    @authorized
    def create_board():
        body = body_json()
        name = body.get("name")
        if not name:
            validation_error("board", "Board name is a required parameter in the body.")
        if not isinstance(name, str) or len(name) <= 2:
            validation_error("board", "Board name must be at least 3 characters long.")
        now = utc_now()
        cursor = get_db().execute(
            """INSERT INTO boards (userId, name, description, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?)""",
            (request.user_id, name, body.get("description") or "", now, now),
        )
        get_db().commit()
        board = query_one("SELECT * FROM boards WHERE id = ?", (cursor.lastrowid,))
        return jsonify(success=True, data=public_document(board)), 201

    @app.put("/api/boards/<board_id>")
    @authorized
    def update_board(board_id):
        try:
            item_id = require_id(board_id, "board")
            body = body_json()
            name = body.get("name")
            if not name:
                validation_error("board", "Board name is a required parameter in the body.")
            if not isinstance(name, str) or len(name) <= 2:
                validation_error("board", "Board name must be at least 3 characters long.")
            board = query_one(
                "SELECT * FROM boards WHERE id = ? AND userId = ?",
                (item_id, request.user_id),
            )
            if not board:
                fail(404, "Board not found or unauthorized", "boardId")
            fields = {"name": name, "updatedAt": utc_now()}
            if "description" in body:
                fields["description"] = body["description"]
            get_db().execute(
                "UPDATE boards SET name = ?, description = ?, updatedAt = ? WHERE id = ?",
                (fields["name"], fields.get("description", board["description"]), fields["updatedAt"], item_id),
            )
            get_db().commit()
            return jsonify(
                success=True,
                data=public_document(query_one("SELECT * FROM boards WHERE id = ?", (item_id,))),
            )
        except ApiError as error:
            if error.status == 400:
                error = db_error_field(error.message, "board")
            raise error

    @app.delete("/api/boards/<board_id>")
    @authorized
    def delete_board(board_id):
        try:
            item_id = require_id(board_id, "board")
            board = query_one(
                "SELECT id FROM boards WHERE id = ? AND userId = ?",
                (item_id, request.user_id),
            )
            if not board:
                fail(404, "Board not found or unauthorized", "boardId")
            get_db().execute("DELETE FROM boards WHERE id = ?", (item_id,))
            get_db().commit()
            return "", 204
        except ApiError as error:
            if error.status == 400:
                error = db_error_field(error.message, "board")
            raise error

    @app.get("/api/lists/board/<board_id>")
    @authorized
    def list_lists(board_id):
        rows = query_all(
            "SELECT * FROM lists WHERE boardId = ? AND userId = ?",
            (int(board_id) if valid_id(board_id) else -1, request.user_id),
        )
        return jsonify(success=True, data=[public_document(row) for row in rows])

    @app.get("/api/lists/<list_id>")
    @authorized
    def get_list(list_id):
        if not valid_id(list_id):
            fail(404, "List not found or unauthorized", "listId")
        item = query_one(
            "SELECT * FROM lists WHERE id = ? AND userId = ?",
            (int(list_id), request.user_id),
        )
        if not item:
            fail(404, "List not found or unauthorized", "listId")
        return jsonify(success=True, data=public_document(item))

    @app.post("/api/lists")
    @authorized
    def create_list():
        try:
            body = body_json()
            name = body.get("name")
            if not name:
                validation_error("list", "List name (at least 1 character) is required parameter.")
            board_id = body.get("boardId")
            if not board_id:
                validation_error("boardId", "boardId is required parameter.")
            if not valid_id(board_id):
                validation_error("boardId", "boardId must be a valid ID.")
            order = validate_list_order(body.get("order"), "create")
            board = query_one(
                "SELECT id FROM boards WHERE id = ? AND userId = ?",
                (int(board_id), request.user_id),
            )
            if not board:
                fail(404, "boardId is not found", "boardId")
            now = utc_now()
            cursor = get_db().execute(
                """INSERT INTO lists (userId, boardId, name, "order", createdAt, updatedAt)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (request.user_id, int(board_id), name, order, now, now),
            )
            get_db().commit()
            item = query_one("SELECT * FROM lists WHERE id = ?", (cursor.lastrowid,))
            return jsonify(success=True, data=public_document(item)), 201
        except ApiError as error:
            if error.status == 400:
                error = db_error_field(error.message, "list")
            raise error

    @app.put("/api/lists/<list_id>")
    @authorized
    def update_list(list_id):
        try:
            item_id = require_id(list_id, "list")
            body = body_json()
            name = body.get("name")
            if not name:
                validation_error("list", "List name (at least 1 character) is a required parameter in the body.")
            order = validate_list_order(body.get("order"), "update")
            item = query_one(
                "SELECT id FROM lists WHERE id = ? AND userId = ?",
                (item_id, request.user_id),
            )
            if not item:
                fail(404, "List not found or unauthorized", "listId")
            get_db().execute(
                'UPDATE lists SET name = ?, "order" = ?, updatedAt = ? WHERE id = ?',
                (name, order, utc_now(), item_id),
            )
            get_db().commit()
            return jsonify(
                success=True,
                data=public_document(query_one("SELECT * FROM lists WHERE id = ?", (item_id,))),
            )
        except ApiError as error:
            if error.status == 400:
                error = db_error_field(error.message, "list")
            raise error

    @app.delete("/api/lists/<list_id>")
    @authorized
    def delete_list(list_id):
        try:
            item_id = require_id(list_id, "list")
            item = query_one(
                "SELECT id FROM lists WHERE id = ? AND userId = ?",
                (item_id, request.user_id),
            )
            if not item:
                fail(404, "List not found or unauthorized", "listId")
            get_db().execute("DELETE FROM lists WHERE id = ?", (item_id,))
            get_db().commit()
            return "", 204
        except ApiError as error:
            if error.status == 400:
                error = db_error_field(error.message, "list")
            raise error

    @app.get("/api/cards/list/<list_id>")
    @authorized
    def list_cards(list_id):
        rows = query_all(
            "SELECT * FROM cards WHERE listId = ? AND userId = ?",
            (int(list_id) if valid_id(list_id) else -1, request.user_id),
        )
        return jsonify(success=True, data=[public_document(row) for row in rows])

    @app.get("/api/cards/<card_id>")
    @authorized
    def get_card(card_id):
        if not valid_id(card_id):
            fail(404, "Card not found or unauthorized", "cardId")
        item = query_one(
            "SELECT * FROM cards WHERE id = ? AND userId = ?",
            (int(card_id), request.user_id),
        )
        if not item:
            fail(404, "Card not found or unauthorized", "cardId")
        return jsonify(success=True, data=public_document(item))

    @app.post("/api/cards")
    @authorized
    def create_card():
        try:
            body = body_json()
            due_date, priority = validate_card(body)
            list_id = int(body["listId"])
            task_list = query_one(
                "SELECT id FROM lists WHERE id = ? AND userId = ?",
                (list_id, request.user_id),
            )
            if not task_list:
                fail(404, "listId is not found", "listId")
            now = utc_now()
            description = body["description"]
            if not isinstance(description, str):
                description = str(description)
            cursor = get_db().execute(
                """INSERT INTO cards
                   (userId, listId, title, description, dueDate, priority, isCompleted, createdAt, updatedAt)
                   VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)""",
                (request.user_id, list_id, body["title"], description, due_date, priority, now, now),
            )
            get_db().commit()
            item = query_one("SELECT * FROM cards WHERE id = ?", (cursor.lastrowid,))
            return jsonify(success=True, data=public_document(item)), 201
        except ApiError as error:
            if error.status == 400:
                error = db_error_field(error.message, "card")
            raise error

    @app.put("/api/cards/<card_id>")
    @authorized
    def update_card(card_id):
        try:
            item_id = require_id(card_id, "card")
            body = body_json()
            due_date, priority = validate_card(body)
            list_id = int(body["listId"])
            task_list = query_one(
                "SELECT id FROM lists WHERE id = ? AND userId = ?",
                (list_id, request.user_id),
            )
            if not task_list:
                fail(404, "listId is not found", "listId")
            item = query_one(
                "SELECT * FROM cards WHERE id = ? AND userId = ?",
                (item_id, request.user_id),
            )
            if not item:
                fail(404, "Card not found or unauthorized", "cardId")
            description = body["description"]
            if not isinstance(description, str):
                description = str(description)
            completed = int(bool(body["isCompleted"])) if "isCompleted" in body else item["isCompleted"]
            get_db().execute(
                """UPDATE cards SET title = ?, description = ?, listId = ?, dueDate = ?,
                   priority = ?, isCompleted = ?, updatedAt = ? WHERE id = ?""",
                (body["title"], description, list_id, due_date, priority, completed, utc_now(), item_id),
            )
            get_db().commit()
            item = query_one("SELECT * FROM cards WHERE id = ?", (item_id,))
            return jsonify(success=True, data=public_document(item))
        except ApiError as error:
            if error.status == 400:
                error = db_error_field(error.message, "card")
            raise error

    @app.delete("/api/cards/<card_id>")
    @authorized
    def delete_card(card_id):
        try:
            item_id = require_id(card_id, "card")
            item = query_one(
                "SELECT id FROM cards WHERE id = ? AND userId = ?",
                (item_id, request.user_id),
            )
            if not item:
                fail(404, "Card not found or unauthorized", "cardId")
            get_db().execute("DELETE FROM cards WHERE id = ?", (item_id,))
            get_db().commit()
            return "", 204
        except ApiError as error:
            if error.status == 400:
                error = db_error_field(error.message, "card")
            raise error

    @socketio.on("connect")
    def connect_chat(auth=None):
        token = auth.get("token") if isinstance(auth, dict) else None
        user_id = token_user_id(token)
        if not user_id:
            return False
        user = query_one("SELECT id, username FROM users WHERE id = ?", (int(user_id),))
        if not user:
            return False
        from flask import request as socket_request

        socket_users[socket_request.sid] = dict(user)
        return True

    @socketio.on("disconnect")
    def disconnect_chat():
        from flask import request as socket_request

        socket_users.pop(socket_request.sid, None)

    @socketio.on("chat:message")
    def chat_message(payload):
        from flask import request as socket_request

        user = socket_users.get(socket_request.sid)
        if not user or not isinstance(payload, dict):
            return
        text = payload.get("text")
        if not isinstance(text, str) or not text.strip():
            return
        emit(
            "chat:message",
            {"username": user["username"], "text": text.strip(), "ts": int(time.time() * 1000)},
            broadcast=True,
            skip_sid=socket_request.sid,
        )

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", "3001"))
    app.extensions["socketio"].run(
        app, host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG") == "1"
    )

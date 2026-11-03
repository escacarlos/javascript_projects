import os
import sqlite3
import tempfile
import unittest

from app import create_app


class UTaskApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.app = create_app(
            {
                "TESTING": True,
                "JWT_SECRET": "test-secret-that-is-at-least-thirty-two-bytes",
                "CORS_ORIGINS": "http://localhost:5173",
                "DATABASE_PATH": os.path.join(self.temp_dir.name, "test.sqlite3"),
            },
        )
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp_dir.cleanup()

    def register_and_login(self, username="ada"):
        response = self.client.post(
            "/api/users/register",
            json={"username": username, "password": "correct horse"},
        )
        self.assertEqual(response.status_code, 200)
        login = self.client.post(
            "/api/users/login",
            json={"username": username, "password": "correct horse"},
        )
        self.assertEqual(login.status_code, 200)
        token = login.get_json()["data"]["token"]
        return {"Authorization": f"Bearer {token}"}, token

    def test_authentication_and_duplicate_registration(self):
        headers, _ = self.register_and_login()
        profile = self.client.get("/api/users/profile", headers=headers)
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.get_json()["data"]["username"], "ada")
        self.assertNotIn("password", profile.get_json()["data"])
        self.assertEqual(profile.get_json()["data"]["id"], "1")

        duplicate = self.client.post(
            "/api/users/register",
            json={"username": "ada", "password": "another password"},
        )
        self.assertEqual(duplicate.status_code, 409)

        unauthorized = self.client.get("/api/boards")
        self.assertEqual(unauthorized.status_code, 401)

    def test_database_persists_between_app_restarts(self):
        self.client.post(
            "/api/users/register",
            json={"username": "ada", "password": "correct horse"},
        )
        restarted_app = create_app(
            {
                "TESTING": True,
                "JWT_SECRET": "test-secret-that-is-at-least-thirty-two-bytes",
                "DATABASE_PATH": self.app.config["DATABASE_PATH"],
                "CORS_ORIGINS": "http://localhost:5173",
            }
        )
        restarted_client = restarted_app.test_client()
        login = restarted_client.post(
            "/api/users/login",
            json={"username": "ada", "password": "correct horse"},
        )
        self.assertEqual(login.status_code, 200)

    def test_board_list_card_crud_and_cascade(self):
        headers, _ = self.register_and_login()
        board_response = self.client.post(
            "/api/boards",
            json={"name": "University", "description": "Semester work"},
            headers=headers,
        )
        self.assertEqual(board_response.status_code, 201)
        board = board_response.get_json()["data"]
        self.assertIn("id", board)
        self.assertNotIn("_id", board)

        board_update = self.client.put(
            f"/api/boards/{board['id']}",
            json={"name": "University board", "description": "Updated"},
            headers=headers,
        )
        self.assertEqual(board_update.status_code, 200)
        self.assertEqual(board_update.get_json()["data"]["description"], "Updated")
        self.assertEqual(
            len(self.client.get("/api/boards", headers=headers).get_json()["data"]),
            1,
        )

        list_response = self.client.post(
            "/api/lists",
            json={"name": "To do", "boardId": board["id"], "order": 0},
            headers=headers,
        )
        self.assertEqual(list_response.status_code, 201)
        task_list = list_response.get_json()["data"]
        self.assertEqual(
            len(self.client.get(
                f"/api/lists/board/{board['id']}", headers=headers
            ).get_json()["data"]),
            1,
        )

        card_response = self.client.post(
            "/api/cards",
            json={
                "title": "Write tests",
                "description": "Cover the migrated API",
                "listId": task_list["id"],
                "dueDate": "2026-12-01T10:00:00.000Z",
                "priority": 2,
            },
            headers=headers,
        )
        self.assertEqual(card_response.status_code, 201)
        card = card_response.get_json()["data"]
        self.assertEqual(
            len(self.client.get(
                f"/api/cards/list/{task_list['id']}", headers=headers
            ).get_json()["data"]),
            1,
        )
        self.assertEqual(
            self.client.get(f"/api/cards/{card['id']}", headers=headers).status_code,
            200,
        )

        updated = self.client.put(
            f"/api/cards/{card['id']}",
            json={
                "title": "Write API tests",
                "description": "Cover the migrated API",
                "listId": task_list["id"],
                "dueDate": "2026-12-01T10:00:00.000Z",
                "priority": 1,
                "isCompleted": True,
            },
            headers=headers,
        )
        self.assertEqual(updated.status_code, 200)
        self.assertTrue(updated.get_json()["data"]["isCompleted"])

        moved = self.client.put(
            f"/api/lists/{task_list['id']}",
            json={"name": "In progress", "order": 1},
            headers=headers,
        )
        self.assertEqual(moved.status_code, 200)
        self.assertEqual(moved.get_json()["data"]["name"], "In progress")

        deleted = self.client.delete(f"/api/boards/{board['id']}", headers=headers)
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(
            self.client.get(
                f"/api/cards/list/{task_list['id']}", headers=headers
            ).get_json()["data"],
            [],
        )
        conn = sqlite3.connect(self.app.config["DATABASE_PATH"])
        try:
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM lists").fetchone()[0], 0)
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM cards").fetchone()[0], 0)
        finally:
            conn.close()

    def test_users_cannot_access_another_users_records(self):
        headers, _ = self.register_and_login("ada")
        board = self.client.post(
            "/api/boards", json={"name": "Ada board"}, headers=headers
        ).get_json()["data"]
        other_headers, _ = self.register_and_login("grace")

        self.assertEqual(
            self.client.get(f"/api/boards/{board['id']}", headers=other_headers).status_code,
            404,
        )
        self.assertEqual(
            self.client.put(
                f"/api/boards/{board['id']}",
                json={"name": "Stolen board"},
                headers=other_headers,
            ).status_code,
            404,
        )
        self.assertEqual(
            self.client.delete(f"/api/boards/{board['id']}", headers=other_headers).status_code,
            404,
        )

    def test_logout_revokes_http_and_socket_access(self):
        headers, token = self.register_and_login()
        socketio = self.app.extensions["socketio"]
        socket_client = socketio.test_client(
            self.app, auth={"token": token}, flask_test_client=self.client
        )
        self.assertTrue(socket_client.is_connected())

        _, other_token = self.register_and_login("grace")
        other_socket = socketio.test_client(
            self.app, auth={"token": other_token}, flask_test_client=self.client
        )
        self.assertTrue(other_socket.is_connected())
        socket_client.emit("chat:message", {"text": "  Hello chat  "})
        received = other_socket.get_received()
        messages = [
            item["args"][0]
            for item in received
            if item["name"] == "chat:message"
        ]
        self.assertEqual(messages[0]["username"], "ada")
        self.assertEqual(messages[0]["text"], "Hello chat")
        other_socket.disconnect()

        self.client.post("/api/users/logout", headers=headers)
        response = self.client.get("/api/boards", headers=headers)
        self.assertEqual(response.status_code, 401)
        socket_client.disconnect()
        rejected = socketio.test_client(
            self.app, auth={"token": token}, flask_test_client=self.client
        )
        self.assertFalse(rejected.is_connected())


if __name__ == "__main__":
    unittest.main()

# uTask — Vue frontend with Flask backend

This is a separate Python-backed copy of uTask. The Vue application is retained as the browser frontend; the backend is Flask with a local SQLite relational database and Socket.IO. The original `task-app` remains unchanged.

## Requirements

- Python 3.10 or newer
- Node.js and npm

## Backend setup

From `utask-python/backend`, create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

On Windows PowerShell, use:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

Install the Python dependencies and create your local environment file:

```bash
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` as needed. By default, the backend creates `backend/instance/utask.sqlite3` automatically. Set `DATABASE_PATH` to choose another database file. The database is local to the machine running the backend; back it up if you need to preserve user data. Do not commit `.env` or the database file.

Start the Flask and Socket.IO server from `backend` with the virtual environment activated:

```bash
python app.py
```

The API and chat server run at **http://localhost:3001** by default. Check **http://localhost:3001/health** to confirm the API is responding.

## Frontend setup

In another terminal, install and start the Vue app:

```bash
cd utask-python/frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally **http://localhost:5173**). The checked-in frontend `.env` points both REST requests and chat to `http://localhost:3001`. If you change the backend port, update `VITE_API_BASE_URL` and `VITE_CHAT_WS_URL` in `frontend/.env` to match.

## Tests

With the backend virtual environment activated:

```bash
cd utask-python/backend
pip install -r requirements-dev.txt
python -m unittest discover -s tests
```

## API

The Flask backend keeps the frontend's existing REST API routes. SQLite creates related `users`, `boards`, `lists`, and `cards` tables and enforces cascading deletes with foreign keys:

- `/api/users` — registration, login, logout, and profile
- `/api/boards` — board CRUD
- `/api/lists` — list CRUD
- `/api/cards` — card CRUD
- Socket.IO `chat:message` — authenticated live chat

The default server port is `3001`; configure it with `PORT`. Configure allowed frontend origins with comma-separated `CORS_ORIGINS`.

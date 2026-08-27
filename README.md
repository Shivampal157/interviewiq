# InterviewIQ

FAANG-style interview platform: AI mock interviews + live coding with a friend (camera, shared editor, Run).

- Frontend: React (Vite) → http://localhost:5173
- Backend: Go → http://localhost:8000
- Database: MongoDB on Docker port 27018

## Run

1. Start MongoDB

```bash
docker compose up -d
```

2. Backend keys

Copy `server-go/.env.example` to `server-go/.env` and fill OpenRouter / Firebase is in the client.

If `server/.env` already exists, the Go server can read that too.

3. Start API

```bash
cd server-go
.\run.ps1
```

4. Start UI

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Features

- Google login
- AI interview (resume, questions, scoring)
- Live coding room with a friend (video, anti-cheat, JS/Python/Java/C++)

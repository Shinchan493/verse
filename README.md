# Verse

**An open-source workspace for real-time collaboration — shared documents, live coding rooms with video, and a whiteboard, all in one place.**

Verse lets teams create together in the same moment: write documents with live cursors, or spin up a **Live Session** to pair-program, run an interview, or teach — a shared code editor, a collaborative whiteboard, and built-in video.

> Verse began as a fork of [noahskorner/google-docs-clone](https://github.com/noahskorner/google-docs-clone) and has since been substantially reworked — the collaboration engine, the Live Session feature, and the whole product design are new. Credit to the original author for the starting point.

---

## Features

### 📄 Documents
- Real-time collaborative rich-text editing (Quill) with **live cursors and presence**
- **Conflict-free** merging via CRDT — no overwrites, no "reload to sync"
- Share by email or link, with per-document access
- Word count / reading time, autosave

### 🟢 Live Sessions
- Join-by-link rooms for pair programming, interviews, and teaching
- **Collaborative code editor** (CodeMirror 6) with language selection, shared cursors, and starter templates
- **Collaborative whiteboard** (tldraw) to sketch and explain
- **Peer-to-peer video & audio** (WebRTC) with mic/cam controls
- **Dark / light** session theme, participant list, session timer

### 🔧 Under the hood
- Real-time layer built on **Yjs** relayed over authenticated **Socket.IO**
- Self-hostable — your data, your server

---

## Tech stack

**Frontend** — React 18 · TypeScript · Tailwind CSS · Quill + `y-quill` (docs) · CodeMirror 6 + `y-codemirror.next` (code) · tldraw (whiteboard) · `simple-peer` (WebRTC) · Yjs · Socket.IO client

**Backend** — Node · Express · TypeScript · Socket.IO · Yjs · Sequelize · PostgreSQL · JWT auth (access + refresh) · Nodemailer

---

## Getting started (local)

### Prerequisites
- Node.js 18+
- Docker (for Postgres + a local mail catcher)

### 1. Start Postgres and a mail catcher

```bash
docker run -d --name verse-pg \
  -e POSTGRES_USER=verse -e POSTGRES_PASSWORD=verse -e POSTGRES_DB=verse \
  -p 5433:5432 postgres:16

docker run -d --name verse-mail -p 1025:1025 -p 1080:1080 maildev/maildev
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env.development` (see all required keys in `server/src/config/env.config.ts`):

```env
NODE_ENV=development
HOST=localhost
PORT=3001

DATABASE_URL=postgres://verse:verse@localhost:5433/verse
USER=verse
PASSWORD=verse
DB_HOST=localhost
DB_PORT=5433
DATABASE=verse

# Local mail catcher (read messages at http://localhost:1080)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=dev
SMTP_PASSWORD=dev

ACCESS_TOKEN_SECRET=change_me
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_SECRET=change_me
REFRESH_TOKEN_EXPIRATION=7d
VERIFY_EMAIL_SECRET=change_me
PASSWORD_RESET_SECRET=change_me
PASSWORD_RESET_EXPIRATION=1h

FRONT_END_URL=http://localhost:3000

# Optional: skip email verification (users are verified on signup)
AUTO_VERIFY_USERS=true
```

Build and run (tables auto-create on first boot):

```bash
npm run build
npm start           # http://localhost:3001
```

### 3. Frontend

```bash
cd client
npm install
npm start           # http://localhost:3000
```

Open **http://localhost:3000**, register, and start writing — or hit **Start a live session**.

---

## Architecture

- **Documents** and **Live Sessions** both use **Yjs** (CRDT) for state, relayed as binary updates over **Socket.IO**. The server keeps an authoritative doc per document/room and persists documents to Postgres.
- **Live Sessions** run over a dedicated `/room` Socket.IO namespace that relays multiple Yjs docs (code + whiteboard), presence, and **WebRTC signaling** for peer-to-peer video.
- Auth is JWT-based (short-lived access token + refresh token); rooms are authenticated with the same token.

> Note: the real-time doc/room state is held in memory, so the backend currently runs as a **single instance**. Horizontal scaling would use a shared provider (e.g. Hocuspocus + Redis).

---

## Deployment

The repo includes a `render.yaml` blueprint (Postgres + Node API + static frontend). The frontend needs `REACT_APP_API_URL` set to the API URL (with a trailing slash); the API needs `FRONT_END_URL` set to the frontend origin (for CORS). WebRTC video requires HTTPS, which hosts like Render provide.

---

## Credits

- Original project: [noahskorner/google-docs-clone](https://github.com/noahskorner/google-docs-clone)
- Built on the excellent open-source work of Yjs, Quill, CodeMirror, tldraw, and Socket.IO.

## License

See [LICENSE](LICENSE) if present. If you plan to reuse this project, please keep the attribution above.

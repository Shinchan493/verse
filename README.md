## Google Docs Clone

Built with React, Typescript, TailwindCSS, ExpressJS, Postgres, and Socket.IO
[Check it out here!](https://docs.noahgothacked.com)

### API Documentation

[View it here!](https://documenter.getpostman.com/view/12120504/UVyoWHgt)

## Project Screen Shot(s)

- Full Register/Login/Verify Email functionality, with helpful toast notifications to guide you.


  ![Authentication](client/screenshots/authentication.png)

- Basic document dashboard to create new documents, and navigate to your recent or shared documents.


  ![Dashboard](client/screenshots/home.png)

- Real time collaboration. Work on documents at the same time with those you've shared the document with.


  ![Collaboration](client/screenshots/collaboration.png)

## Installation and Setup Instructions

Clone down this repository. You will need node and npm installed globally on your machine.

Client Installation:

`cd client`

Install Dependencies:

`npm install`

To Start Server:

`npm start`

To Visit App:

`localhost:3000`

Server Installation:

`cd server`

Create the .env file in the root directory:

`touch .env.development`

You will need to add all of the neccessary environment variables [listed in this file](server/src/config/env.config.ts)

Install Dependencies:

`npm install`

To Start Server:

`npm start`

To Visit App:

`localhost:3001`

## Reflection

This was a week long project I used to learn web sockets, and sharpen my React skills. While the project still has a ton of functionality that could be added, I accomplished my goals of the project. I used Socket.IO to create and consume web sockets, to provide real-time collaboration between your peers, similar to Google Docs. I learned a lot about React particularly on how to structure and consume Contexts and Hooks.

If I wanted to work more on this project, the next thing I would do is refactor my client service files. I am using the React Context API to provide a global AuthContext which stores my JWT accessToken in memory. However, my service files are plain typescript files, and cannot make use of the Context API. This makes it tedious to provide the accessToken to these services, as I have to pass the token as an argument each time. My first thoughts on how to fix this would be to create custom Hooks for each service, let me know if you can think of a better way!

Overall, I had a lot of fun working on this project. It was nice to not have to worry about designing a front end (and just copying Google's hard work). I am looking forward to trying more 'clone' projects in the future!

---

## Attribution & fork notes

This is a fork/rework of the original project by **[noahskorner/google-docs-clone](https://github.com/noahskorner/google-docs-clone)**. All original authorship and git history are preserved. The original repository does not declare a license; this copy is maintained for personal learning and portfolio purposes with credit to the original author.

### Changes in this fork (local-dev + robustness)

- `server/src/config/db.config.ts` — dev DB config now honors `DB_PORT` (was hardcoded to the default port).
- `server/src/config/smtp.config.ts` — SMTP port and TLS are now env-driven (`SMTP_PORT`, `SMTP_SECURE`), so local dev can use a plaintext mail catcher while production stays on 465/TLS.
- `server/src/services/mail.service.ts` — `sendMail` now catches and logs errors so an SMTP failure no longer crashes the server via an unhandled rejection.

### Local dev quick start

Backend needs Postgres and an SMTP endpoint. Easiest with Docker:

```bash
docker run -d --name gdocs-pg -e POSTGRES_USER=gdocs -e POSTGRES_PASSWORD=gdocs -e POSTGRES_DB=googledocs -p 5433:5432 postgres:16
docker run -d --name gdocs-mail -p 1025:1025 -p 1080:1080 maildev/maildev
```

Create `server/.env.development` (see the variables in `server/src/config/env.config.ts`; point `DB_PORT=5433`, `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_SECURE=false`). Then:

```bash
cd server && npm install && npm run build && npm start   # http://localhost:3001
cd client && npm install && npm start                    # http://localhost:3000
```

Registration sends a verification email — read it at the maildev UI (http://localhost:1080) and click the link.

### Roadmap (rework)

- Replace the naive whole-document Socket.IO broadcast with **Yjs/CRDT** for true conflict-free concurrent editing and live cursors.
- Add AI assist (summarize / rewrite), granular sharing permissions, and export to PDF/DOCX.

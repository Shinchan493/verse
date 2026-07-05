import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import { Server } from 'socket.io';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import http from 'http';
import env from './config/env.config';
import app from './app';
import documentService from './services/document.service';
import SocketEvent from './types/enums/socket-events-enum';
import { getYDoc, applyUpdate, encodeState } from './collab/yjs-collab';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.FRONT_END_URL,
    methods: '*',
  },
});

server.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}...`);
});

io.on('connection', (socket) => {
  const accessToken = socket.handshake.query.accessToken as string | undefined;
  const documentId = socket.handshake.query.documentId as string | undefined;

  if (!accessToken || !documentId) return socket.disconnect();
  else {
    jwt.verify(
      accessToken,
      env.ACCESS_TOKEN_SECRET,
      (err: VerifyErrors | null, decoded: unknown) => {
        const { id, email } = decoded as RequestUser;
        (socket as any).username = email;

        documentService
          .findDocumentById(parseInt(documentId), parseInt(id))
          .then(async (document) => {
            if (document === null) return socket.disconnect();

            socket.join(documentId);
            io.in(documentId)
              .fetchSockets()
              .then((clients) => {
                io.sockets.in(documentId).emit(
                  SocketEvent.CURRENT_USERS_UPDATE,
                  clients.map((client) => (client as any).username)
                );
              });

            // --- Yjs (CRDT) collaboration ---
            // Send the joining peer the authoritative document state, then
            // relay their binary updates to everyone else in the room. Yjs
            // merges concurrent edits on each client, so there is no more
            // whole-document last-write-wins clobbering.
            const ydoc = await getYDoc(documentId);
            socket.emit(SocketEvent.YJS_SYNC, encodeState(ydoc));

            socket.on(SocketEvent.YJS_UPDATE, (update: ArrayBuffer) => {
              const bytes = new Uint8Array(update);
              applyUpdate(documentId, bytes);
              socket.broadcast.to(documentId).emit(SocketEvent.YJS_UPDATE, bytes);
            });

            // Awareness (live cursors / selections) is presence-only, so it is
            // relayed peer-to-peer without touching the persisted doc.
            socket.on(SocketEvent.YJS_AWARENESS, (update: ArrayBuffer) => {
              socket.broadcast
                .to(documentId)
                .emit(SocketEvent.YJS_AWARENESS, new Uint8Array(update));
            });

            socket.on('disconnect', async () => {
              socket.leave(documentId);
              socket.disconnect();
              io.in(documentId)
                .fetchSockets()
                .then((clients) => {
                  io.sockets.in(documentId).emit(
                    SocketEvent.CURRENT_USERS_UPDATE,
                    clients.map((client) => (client as any).username)
                  );
                });
            });
          })
          .catch((error) => {
            console.log(error);
            return socket.disconnect();
          });
      }
    );
  }
});

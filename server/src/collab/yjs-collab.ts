/**
 * Server-side Yjs document store.
 *
 * Holds one authoritative Y.Doc per document id in memory, hydrated from the
 * persisted base64 state in the DB and saved back (debounced) as edits stream
 * in. The Socket.IO layer relays binary Yjs updates between peers; actual
 * conflict resolution happens in Yjs (CRDT) on every client, so concurrent
 * edits merge cleanly instead of the old last-write-wins broadcast.
 */
import * as Y from 'yjs';
import { Document } from '../db/models/document.model';

const docs = new Map<string, Y.Doc>();
const saveTimers = new Map<string, NodeJS.Timeout>();

const SAVE_DEBOUNCE_MS = 2000;

/** Load (or create) the authoritative Y.Doc for a document id. */
export const getYDoc = async (documentId: string): Promise<Y.Doc> => {
  const existing = docs.get(documentId);
  if (existing) return existing;

  const ydoc = new Y.Doc();
  try {
    const row = await Document.unscoped().findByPk(parseInt(documentId));
    const content = row?.getDataValue('content') as unknown as string | null;
    // Persisted Yjs state is base64. Legacy Draft.js JSON will fail to decode
    // into a valid update, so we simply start from an empty doc in that case.
    if (content && typeof content === 'string' && content.length > 0) {
      const update = new Uint8Array(Buffer.from(content, 'base64'));
      if (update.length > 0) Y.applyUpdate(ydoc, update);
    }
  } catch (err) {
    console.error('[yjs] load failed:', (err as Error).message);
  }

  docs.set(documentId, ydoc);
  return ydoc;
};

/** Apply a peer update to the authoritative doc and schedule a save. */
export const applyUpdate = (documentId: string, update: Uint8Array): void => {
  const ydoc = docs.get(documentId);
  if (!ydoc) return;
  Y.applyUpdate(ydoc, update);
  scheduleSave(documentId);
};

/** Encode the full current state so a newly-joined peer can catch up. */
export const encodeState = (ydoc: Y.Doc): Uint8Array =>
  Y.encodeStateAsUpdate(ydoc);

const scheduleSave = (documentId: string): void => {
  const existing = saveTimers.get(documentId);
  if (existing) clearTimeout(existing);

  saveTimers.set(
    documentId,
    setTimeout(async () => {
      saveTimers.delete(documentId);
      const ydoc = docs.get(documentId);
      if (!ydoc) return;
      const state = Buffer.from(Y.encodeStateAsUpdate(ydoc)).toString('base64');
      try {
        await Document.unscoped().update(
          { content: state },
          { where: { id: parseInt(documentId) } }
        );
      } catch (err) {
        console.error('[yjs] persist failed:', (err as Error).message);
      }
    }, SAVE_DEBOUNCE_MS)
  );
};

import * as Y from 'yjs';
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from 'y-protocols/awareness';
import { Socket } from 'socket.io-client';

/**
 * Bind a Y.Doc (and optional Awareness) to a Verse Live room over the shared
 * room socket, scoped by `docKey` (e.g. "code" or "whiteboard"). Multiple docs
 * share one socket; each filters messages by its key.
 *
 * Returns a cleanup function that removes all listeners.
 */
export const bindYDocToRoom = (
  socket: Socket,
  docKey: string,
  ydoc: Y.Doc,
  awareness?: Awareness
): (() => void) => {
  const onLocalUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === 'remote') return;
    socket.emit('room:update', { docKey, update: Array.from(update) });
  };
  ydoc.on('update', onLocalUpdate);

  const applyRemote = ({
    docKey: key,
    update,
  }: {
    docKey: string;
    update: number[];
  }) => {
    if (key !== docKey) return;
    Y.applyUpdate(ydoc, new Uint8Array(update), 'remote');
  };
  socket.on('room:update', applyRemote);
  socket.on('room:sync', applyRemote);

  let onLocalAwareness: ((...args: any[]) => void) | undefined;
  let onRemoteAwareness: ((payload: any) => void) | undefined;

  if (awareness) {
    onLocalAwareness = (
      {
        added,
        updated,
        removed,
      }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      if (origin === 'remote') return;
      const changed = added.concat(updated).concat(removed);
      socket.emit('room:awareness', {
        docKey,
        update: Array.from(encodeAwarenessUpdate(awareness, changed)),
      });
    };
    awareness.on('update', onLocalAwareness);

    onRemoteAwareness = ({
      docKey: key,
      update,
    }: {
      docKey: string;
      update: number[];
    }) => {
      if (key !== docKey) return;
      applyAwarenessUpdate(awareness, new Uint8Array(update), 'remote');
    };
    socket.on('room:awareness', onRemoteAwareness);
  }

  // Ask the server for the current state of this doc.
  socket.emit('room:subscribe', docKey);

  return () => {
    ydoc.off('update', onLocalUpdate);
    socket.off('room:update', applyRemote);
    socket.off('room:sync', applyRemote);
    if (onLocalAwareness) awareness?.off('update', onLocalAwareness);
    if (onRemoteAwareness) socket.off('room:awareness', onRemoteAwareness);
  };
};

const COLORS = [
  '#b45309',
  '#2563eb',
  '#059669',
  '#db2777',
  '#7c3aed',
  '#0891b2',
  '#dc2626',
  '#ca8a04',
];

export const colorForName = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
};

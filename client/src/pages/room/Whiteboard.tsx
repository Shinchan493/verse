import { useEffect, useState } from 'react';
import {
  Tldraw,
  createTLStore,
  defaultShapeUtils,
  TLRecord,
  TLStoreWithStatus,
} from 'tldraw';
import 'tldraw/tldraw.css';
import * as Y from 'yjs';
import { Socket } from 'socket.io-client';
import { bindYDocToRoom } from './room-yjs';

interface WhiteboardProps {
  socket: Socket;
}

/**
 * A tldraw canvas whose store is mirrored into a Yjs Y.Map and relayed over the
 * room socket, so every participant draws on the same board in real time.
 */
const Whiteboard = ({ socket }: WhiteboardProps) => {
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: 'loading',
  });

  useEffect(() => {
    const ydoc = new Y.Doc();
    const yStore = ydoc.getMap<TLRecord>('tldraw');
    const store = createTLStore({ shapeUtils: defaultShapeUtils });

    const unbind = bindYDocToRoom(socket, 'whiteboard', ydoc);

    // Local tldraw edits -> Yjs.
    const unlisten = store.listen(
      (entry) => {
        const { added, updated, removed } = entry.changes;
        ydoc.transact(() => {
          Object.values(added).forEach((record) =>
            yStore.set(record.id, record)
          );
          Object.values(updated).forEach(([, record]) =>
            yStore.set(record.id, record)
          );
          Object.values(removed).forEach((record) => yStore.delete(record.id));
        });
      },
      { source: 'user', scope: 'document' }
    );

    // Remote Yjs changes -> tldraw store.
    const observer = (_events: Y.YEvent<any>[], transaction: Y.Transaction) => {
      if (transaction.local) return;
      const records = Array.from(yStore.values());
      store.mergeRemoteChanges(() => {
        const incomingIds = new Set(records.map((r) => r.id));
        const toRemove = store
          .allRecords()
          .map((r) => r.id)
          .filter((id) => !incomingIds.has(id));
        if (toRemove.length) store.remove(toRemove as any);
        if (records.length) store.put(records);
      });
    };
    yStore.observeDeep(observer);

    // Apply any state already present (e.g. arriving from the server sync).
    if (yStore.size > 0) {
      store.mergeRemoteChanges(() => {
        store.put(Array.from(yStore.values()));
      });
    }

    setStoreWithStatus({
      status: 'synced-remote',
      connectionStatus: 'online',
      store,
    });

    return () => {
      unlisten();
      yStore.unobserveDeep(observer);
      unbind();
      ydoc.destroy();
    };
  }, [socket]);

  if (storeWithStatus.status !== 'synced-remote') {
    return (
      <div className="h-full grid place-items-center text-ink-faint text-sm bg-paper">
        Loading whiteboard…
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Tldraw store={storeWithStatus.store} />
    </div>
  );
};

export default Whiteboard;

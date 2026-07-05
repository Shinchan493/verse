import { useCallback } from 'react';
import { Tldraw, Editor, TLRecord } from 'tldraw';
import 'tldraw/tldraw.css';
import * as Y from 'yjs';
import { Socket } from 'socket.io-client';
import { bindYDocToRoom } from './room-yjs';

interface WhiteboardProps {
  socket: Socket;
}

/**
 * A tldraw canvas shared over the room. We let tldraw create and own its store
 * (so all base records exist) and wire the Yjs sync in onMount:
 *   - local document edits are pushed to a Yjs Y.Map (relayed to the room)
 *   - remote Yjs changes are applied granularly back into the store
 * Only document-scoped records (shapes/pages) are shared; per-user UI state
 * (camera, selection) stays local.
 */
const Whiteboard = ({ socket }: WhiteboardProps) => {
  const handleMount = useCallback(
    (editor: Editor) => {
      const store = editor.store;
      const ydoc = new Y.Doc();
      const yStore = ydoc.getMap<TLRecord>('tldraw');

      const unbind = bindYDocToRoom(socket, 'whiteboard', ydoc);

      // Local edits -> Yjs.
      const unlisten = store.listen(
        (entry) => {
          const { added, updated, removed } = entry.changes;
          ydoc.transact(() => {
            Object.values(added).forEach((r) => yStore.set(r.id, r));
            Object.values(updated).forEach(([, r]) => yStore.set(r.id, r));
            Object.values(removed).forEach((r) => yStore.delete(r.id));
          });
        },
        { source: 'user', scope: 'document' }
      );

      // Remote Yjs changes -> store (apply only the keys that changed).
      const observer = (events: Y.YEvent<any>[], txn: Y.Transaction) => {
        if (txn.local) return;
        store.mergeRemoteChanges(() => {
          events.forEach((event) => {
            event.changes.keys.forEach((change, id) => {
              if (change.action === 'delete') {
                store.remove([id as any]);
              } else {
                const record = yStore.get(id);
                if (record) store.put([record]);
              }
            });
          });
        });
      };
      yStore.observeDeep(observer);

      // Initial reconciliation.
      if (yStore.size > 0) {
        // Load an existing board from a participant who is already here.
        store.mergeRemoteChanges(() => {
          store.put(Array.from(yStore.values()));
        });
      } else {
        // Seed the shared doc with our document-scoped records.
        const docRecords = store.serialize('document');
        ydoc.transact(() => {
          Object.entries(docRecords).forEach(([id, record]) =>
            yStore.set(id, record as TLRecord)
          );
        });
      }

      return () => {
        unlisten();
        yStore.unobserveDeep(observer);
        unbind();
        ydoc.destroy();
      };
    },
    [socket]
  );

  return (
    <div className="h-full w-full">
      <Tldraw onMount={handleMount} />
    </div>
  );
};

export default Whiteboard;

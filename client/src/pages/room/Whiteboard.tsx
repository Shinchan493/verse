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
      // Match the dark code editor.
      editor.user.updateUserPreferences({ colorScheme: 'dark' });

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

      // Reconcile only AFTER the server's initial sync arrives, so two clients
      // don't both seed an empty board and diverge onto different pages.
      // bindYDocToRoom already applied the sync into yStore (and the observer
      // loaded it into the store); we only seed if the room is still empty
      // afterwards — i.e. we're genuinely the first participant.
      let reconciled = false;
      const reconcile = ({ docKey }: { docKey: string }) => {
        if (docKey !== 'whiteboard' || reconciled) return;
        reconciled = true;
        if (yStore.size === 0) {
          const docRecords = store.serialize('document');
          ydoc.transact(() => {
            Object.entries(docRecords).forEach(([id, record]) =>
              yStore.set(id, record as TLRecord)
            );
          });
        }
      };
      socket.on('room:sync', reconcile);

      return () => {
        socket.off('room:sync', reconcile);
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

import { useContext, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import { QuillBinding } from 'y-quill';
import { io, Socket } from 'socket.io-client';
import 'quill/dist/quill.snow.css';
import { BASE_URL } from '../../../services/api';
import { DocumentContext } from '../../../contexts/document-context';
import useAuth from '../../../hooks/use-auth';
import SocketEvent from '../../../types/enums/socket-events-enum';

Quill.register('modules/cursors', QuillCursors);

// Deterministic per-user cursor colour so the same person keeps one colour.
const CURSOR_COLORS = [
  '#f43f5e',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#ef4444',
];
const pickColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
};

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['blockquote', 'code-block', 'link'],
  ['clean'],
];

/**
 * Collaborative document editor.
 *
 * A Quill editor bound to a Yjs document (CRDT). Local edits become Yjs
 * updates that are relayed to peers over the authenticated Socket.IO channel;
 * remote updates are merged conflict-free by Yjs. Awareness carries each
 * peer's live cursor/selection.
 */
const DocumentEditor = () => {
  const { document: doc } = useContext(DocumentContext);
  const { accessToken, email } = useAuth();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const documentId = doc?.id;
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (wrapperRef.current === null || documentId == null || !accessToken) {
      return;
    }

    const wrapper = wrapperRef.current;
    wrapper.innerHTML = '';
    const editorContainer = window.document.createElement('div');
    wrapper.append(editorContainer);

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('quill');
    const awareness = new Awareness(ydoc);

    const quill = new Quill(editorContainer, {
      theme: 'snow',
      placeholder: 'Start writing — changes sync live...',
      modules: {
        cursors: true,
        toolbar: TOOLBAR,
        history: { userOnly: true },
      },
    });
    quill.root.style.minHeight = '1000px';

    const binding = new QuillBinding(ytext, quill, awareness);

    // Live word count / reading time.
    const updateWordCount = () => {
      const text = quill.getText().trim();
      setWordCount(text.length === 0 ? 0 : text.split(/\s+/).length);
    };
    updateWordCount();
    quill.on('text-change', updateWordCount);

    const displayName = email ?? 'Anonymous';
    awareness.setLocalStateField('user', {
      name: displayName,
      color: pickColor(displayName),
    });

    const socket: Socket = io(BASE_URL, {
      query: { documentId, accessToken },
    });

    // Authoritative state pushed by the server on join.
    socket.on(SocketEvent.YJS_SYNC, (update: ArrayBuffer) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote');
    });

    // Relay local document updates to peers (ignore ones that came from a peer).
    const docUpdateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return;
      socket.emit(SocketEvent.YJS_UPDATE, update);
    };
    ydoc.on('update', docUpdateHandler);

    socket.on(SocketEvent.YJS_UPDATE, (update: ArrayBuffer) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote');
    });

    // Awareness (live cursors / selections) — presence only, not persisted.
    const awarenessUpdateHandler = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      if (origin === 'remote') return;
      const changed = added.concat(updated).concat(removed);
      socket.emit(
        SocketEvent.YJS_AWARENESS,
        encodeAwarenessUpdate(awareness, changed)
      );
    };
    awareness.on('update', awarenessUpdateHandler);

    socket.on(SocketEvent.YJS_AWARENESS, (update: ArrayBuffer) => {
      applyAwarenessUpdate(awareness, new Uint8Array(update), 'remote');
    });

    return () => {
      quill.off('text-change', updateWordCount);
      ydoc.off('update', docUpdateHandler);
      awareness.off('update', awarenessUpdateHandler);
      removeAwarenessStates(awareness, [ydoc.clientID], 'unmount');
      binding.destroy();
      awareness.destroy();
      socket.disconnect();
      ydoc.destroy();
      wrapper.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, accessToken, email]);

  return (
    <>
      <div
        style={{ width: '850px' }}
        className="bg-white shadow-md flex-shrink-0 min-h-[1100px]"
      >
        <div ref={wrapperRef} />
      </div>
      {wordCount > 0 && (
        <div className="fixed bottom-5 right-5 z-20 bg-ink text-paper text-xs font-medium px-3.5 py-2 rounded-full shadow-lg">
          {wordCount} {wordCount === 1 ? 'word' : 'words'} ·{' '}
          {Math.max(1, Math.ceil(wordCount / 200))} min read
        </div>
      )}
    </>
  );
};

export default DocumentEditor;

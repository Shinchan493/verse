import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { Socket } from 'socket.io-client';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { yCollab } from 'y-codemirror.next';
import { bindYDocToRoom, colorForName } from './room-yjs';

interface CollabCodeEditorProps {
  socket: Socket;
  me: string;
}

const LANGUAGES: Record<string, () => any> = {
  JavaScript: () => javascript(),
  TypeScript: () => javascript({ typescript: true }),
  Python: () => python(),
  'C / C++': () => cpp(),
  HTML: () => html(),
  CSS: () => css(),
};

const CollabCodeEditor = ({ socket, me }: CollabCodeEditorProps) => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartmentRef = useRef(new Compartment());
  const [language, setLanguage] = useState('JavaScript');

  useEffect(() => {
    if (parentRef.current === null) return;

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codemirror');
    const awareness = new Awareness(ydoc);
    const color = colorForName(me);
    awareness.setLocalStateField('user', {
      name: me,
      color,
      colorLight: color + '33',
    });

    const unbind = bindYDocToRoom(socket, 'code', ydoc, awareness);

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        keymap.of([...defaultKeymap, indentWithTab]),
        langCompartmentRef.current.of(LANGUAGES[language]()),
        oneDark,
        yCollab(ytext, awareness),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-scroller': {
            fontFamily:
              "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
          },
        }),
      ],
    });

    const view = new EditorView({ state, parent: parentRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
      unbind();
      awareness.destroy();
      ydoc.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, me]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    viewRef.current?.dispatch({
      effects: langCompartmentRef.current.reconfigure(LANGUAGES[value]()),
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#282c34]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#21252b] flex-shrink-0">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wide">
          Code
        </span>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="text-xs bg-[#2c313a] text-white/80 border border-white/10 rounded px-2 py-1 focus:outline-none"
        >
          {Object.keys(LANGUAGES).map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
      <div ref={parentRef} className="flex-1 overflow-hidden" />
    </div>
  );
};

export default CollabCodeEditor;

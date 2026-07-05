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

type Theme = 'dark' | 'light';

interface CollabCodeEditorProps {
  socket: Socket;
  me: string;
  theme: Theme;
}

const LANGUAGES: Record<string, () => any> = {
  JavaScript: () => javascript(),
  TypeScript: () => javascript({ typescript: true }),
  Python: () => python(),
  'C / C++': () => cpp(),
  HTML: () => html(),
  CSS: () => css(),
};

// Minimal starter snippets so a fresh room isn't a blank page.
const TEMPLATES: Record<string, string> = {
  JavaScript: `// JavaScript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Verse"));
`,
  TypeScript: `// TypeScript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("Verse"));
`,
  Python: `# Python
def greet(name: str) -> str:
    return f"Hello, {name}!"


print(greet("Verse"))
`,
  'C / C++': `#include <iostream>

int main() {
    std::cout << "Hello, Verse!" << std::endl;
    return 0;
}
`,
  HTML: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Verse</title>
  </head>
  <body>
    <h1>Hello, Verse!</h1>
  </body>
</html>
`,
  CSS: `/* CSS */
body {
  font-family: system-ui, sans-serif;
  color: #1a1a1a;
  background: #faf7f2;
}
`,
};

const TEMPLATE_SET = new Set(Object.values(TEMPLATES).map((t) => t.trim()));
const isReplaceable = (text: string) => {
  const trimmed = text.trim();
  return trimmed.length === 0 || TEMPLATE_SET.has(trimmed);
};

const baseTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px' },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
  },
  '&.cm-focused': { outline: 'none' },
});

// Dark: oneDark with a near-black background to match the session.
const darkExtension = [
  oneDark,
  EditorView.theme(
    {
      '&': { backgroundColor: '#131316' },
      '.cm-gutters': {
        backgroundColor: '#131316',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.25)',
      },
      '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
      '.cm-activeLineGutter': { backgroundColor: 'rgba(255,255,255,0.05)' },
    },
    { dark: true }
  ),
];

// Light: paper canvas with ink text (default highlighting from basicSetup).
const lightExtension = EditorView.theme(
  {
    '&': { backgroundColor: '#ffffff', color: '#1a1a1a' },
    '.cm-gutters': {
      backgroundColor: '#faf7f2',
      borderRight: '1px solid #f2ece1',
      color: '#b8b2a8',
    },
    '.cm-activeLine': { backgroundColor: 'rgba(180,83,9,0.04)' },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(180,83,9,0.06)' },
    '.cm-cursor': { borderLeftColor: '#1a1a1a' },
  },
  { dark: false }
);

const themeExtension = (theme: Theme) =>
  theme === 'dark' ? darkExtension : lightExtension;

const CollabCodeEditor = ({ socket, me, theme }: CollabCodeEditorProps) => {
  const dark = theme === 'dark';
  const parentRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartmentRef = useRef(new Compartment());
  const themeCompartmentRef = useRef(new Compartment());
  const ytextRef = useRef<Y.Text | null>(null);
  const langRef = useRef('JavaScript');
  const [language, setLanguage] = useState('JavaScript');

  const applyTemplate = (lang: string) => {
    const ytext = ytextRef.current;
    const doc = ytext?.doc;
    if (!ytext || !doc) return;
    if (!isReplaceable(ytext.toString())) return;
    const template = TEMPLATES[lang];
    if (!template) return;
    doc.transact(() => {
      if (ytext.length > 0) ytext.delete(0, ytext.length);
      ytext.insert(0, template);
    });
  };

  useEffect(() => {
    if (parentRef.current === null) return;

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codemirror');
    ytextRef.current = ytext;
    const awareness = new Awareness(ydoc);
    const color = colorForName(me);
    awareness.setLocalStateField('user', {
      name: me,
      color,
      colorLight: color + '33',
    });

    const unbind = bindYDocToRoom(socket, 'code', ydoc, awareness);

    let templated = false;
    const onCodeSync = ({ docKey }: { docKey: string }) => {
      if (docKey !== 'code' || templated) return;
      templated = true;
      applyTemplate(langRef.current);
    };
    socket.on('room:sync', onCodeSync);

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        keymap.of([...defaultKeymap, indentWithTab]),
        langCompartmentRef.current.of(LANGUAGES[language]()),
        baseTheme,
        themeCompartmentRef.current.of(themeExtension(theme)),
        yCollab(ytext, awareness),
      ],
    });

    const view = new EditorView({ state, parent: parentRef.current });
    viewRef.current = view;

    return () => {
      socket.off('room:sync', onCodeSync);
      view.destroy();
      viewRef.current = null;
      unbind();
      awareness.destroy();
      ydoc.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, me]);

  // Live-switch the editor theme.
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeCompartmentRef.current.reconfigure(themeExtension(theme)),
    });
  }, [theme]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    langRef.current = value;
    viewRef.current?.dispatch({
      effects: langCompartmentRef.current.reconfigure(LANGUAGES[value]()),
    });
    applyTemplate(value);
  };

  return (
    <div className={`flex flex-col h-full ${dark ? 'bg-[#131316]' : 'bg-white'}`}>
      <div
        className={`flex items-center justify-between px-4 py-2 border-b flex-shrink-0 ${
          dark ? 'bg-[#0f0f0f] border-white/10' : 'bg-paper border-paper-2'
        }`}
      >
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${
            dark ? 'text-white/50' : 'text-ink-soft'
          }`}
        >
          Code
        </span>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className={`text-xs rounded-md px-2 py-1 border focus:outline-none ${
            dark
              ? 'bg-[#1c1c1f] text-white/80 border-white/10'
              : 'bg-white text-ink border-paper-2'
          }`}
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

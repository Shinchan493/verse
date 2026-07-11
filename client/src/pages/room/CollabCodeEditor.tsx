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
import { PlayIcon, TerminalIcon } from '@heroicons/react/outline';
import { bindYDocToRoom, colorForName } from './room-yjs';
import useAuth from '../../hooks/use-auth';
import CodeService from '../../services/code-service';
import CodeConsole, {
  ConsoleTab,
  RunOutput,
  TestCase,
  TestResult,
} from './CodeConsole';

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

// Languages the backend can execute (via Piston); HTML/CSS are markup-only.
const RUNNABLE = new Set(['JavaScript', 'TypeScript', 'Python', 'C / C++']);

const uid = () => Math.random().toString(36).slice(2, 10);

const errorMessage = (err: unknown): string =>
  (err as any)?.response?.data?.errors?.[0]?.msg ??
  'Execution failed — try again.';

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
    '.cm-content': { caretColor: '#1a1a1a' },
    '.cm-gutters': {
      backgroundColor: '#faf7f2',
      borderRight: '1px solid #f2ece1',
      color: '#b8b2a8',
    },
    '.cm-activeLine': { backgroundColor: 'rgba(180,83,9,0.04)' },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(180,83,9,0.06)' },
    '.cm-cursor, .cm-cursor-primary': {
      borderLeftColor: '#1a1a1a',
      borderLeftWidth: '2px',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(180,83,9,0.15)',
    },
  },
  { dark: false }
);

const themeExtension = (theme: Theme) =>
  theme === 'dark' ? darkExtension : lightExtension;

const CollabCodeEditor = ({ socket, me, theme }: CollabCodeEditorProps) => {
  const dark = theme === 'dark';
  const { accessToken } = useAuth();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartmentRef = useRef(new Compartment());
  const themeCompartmentRef = useRef(new Compartment());
  const ytextRef = useRef<Y.Text | null>(null);
  const langRef = useRef('JavaScript');
  // The content is "pristine" while it's still just a template (or empty) —
  // i.e. no user typing and no peer edit has happened. Only then do we swap
  // templates on a language change.
  const pristineRef = useRef(true);
  const [language, setLanguage] = useState('JavaScript');

  // --- Code execution + shared test cases ---
  const ytestsRef = useRef<Y.Array<TestCase> | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<ConsoleTab>('output');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<RunOutput | null>(null);
  const [tests, setTests] = useState<TestCase[]>([]);
  const [testsRunning, setTestsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>(
    {}
  );
  const runnable = RUNNABLE.has(language);

  const applyTemplate = (lang: string) => {
    const ytext = ytextRef.current;
    const doc = ytext?.doc;
    if (!ytext || !doc || !pristineRef.current) return;
    const template = TEMPLATES[lang];
    if (!template) return;
    doc.transact(() => {
      if (ytext.length > 0) ytext.delete(0, ytext.length);
      ytext.insert(0, template);
    }, 'template');
  };

  useEffect(() => {
    if (parentRef.current === null) return;

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codemirror');
    ytextRef.current = ytext;

    // Any change that isn't our own template insertion (user typing, a peer
    // edit, or loading an existing room) marks the content as edited.
    const onYTextChange = (_e: Y.YTextEvent, txn: Y.Transaction) => {
      if (txn.origin !== 'template') pristineRef.current = false;
    };
    ytext.observe(onYTextChange);

    const awareness = new Awareness(ydoc);
    const color = colorForName(me);
    awareness.setLocalStateField('user', {
      name: me,
      color,
      colorLight: color + '33',
    });

    const unbind = bindYDocToRoom(socket, 'code', ydoc, awareness);

    // Shared test cases live in their own Yjs doc so everyone edits one list.
    const testsDoc = new Y.Doc();
    const ytests = testsDoc.getArray<TestCase>('tests');
    ytestsRef.current = ytests;
    const onTestsChange = () => setTests(ytests.toArray());
    ytests.observe(onTestsChange);
    const unbindTests = bindYDocToRoom(socket, 'tests', testsDoc);

    // Run results are broadcast so the whole room sees the same console.
    const onCodeResult = (payload: {
      kind: 'run' | 'tests';
      output?: RunOutput;
      results?: TestResult[];
    }) => {
      if (payload?.kind === 'run' && payload.output) {
        setOutput(payload.output);
        setRunning(false);
        setPanelOpen(true);
        setTab('output');
      } else if (payload?.kind === 'tests' && payload.results) {
        setTestResults(
          Object.fromEntries(payload.results.map((r) => [r.id, r]))
        );
        setPanelOpen(true);
        setTab('tests');
      }
    };
    socket.on('code:result', onCodeResult);

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
      socket.off('code:result', onCodeResult);
      ytext.unobserve(onYTextChange);
      ytests.unobserve(onTestsChange);
      view.destroy();
      viewRef.current = null;
      unbind();
      unbindTests();
      ytestsRef.current = null;
      testsDoc.destroy();
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

  // --- Execution ---

  const runCode = async () => {
    if (!runnable || running || !accessToken) return;
    setPanelOpen(true);
    setTab('output');
    setRunning(true);
    const result: RunOutput = { by: me, language };
    try {
      const res = await CodeService.execute(accessToken, {
        language,
        code: ytextRef.current?.toString() ?? '',
      });
      Object.assign(result, res.data);
    } catch (err) {
      result.error = errorMessage(err);
    }
    setOutput(result);
    setRunning(false);
    socket.emit('code:result', { kind: 'run', output: result });
  };

  const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();

  const runTests = async () => {
    const list = ytestsRef.current?.toArray() ?? [];
    if (!runnable || testsRunning || !accessToken || list.length === 0) return;
    setPanelOpen(true);
    setTab('tests');
    setTestsRunning(true);
    const code = ytextRef.current?.toString() ?? '';
    const results: Record<string, TestResult> = {};
    list.forEach((tc) => {
      results[tc.id] = { id: tc.id, status: 'running' };
    });
    setTestResults({ ...results });

    for (const tc of list) {
      try {
        const res = await CodeService.execute(accessToken, {
          language,
          code,
          stdin: tc.input,
        });
        const d = res.data;
        if (d.exitCode !== 0) {
          results[tc.id] = {
            id: tc.id,
            status: 'error',
            actual: (d.compileOutput || d.stderr || 'Runtime error').trim(),
          };
        } else {
          results[tc.id] = {
            id: tc.id,
            status:
              normalize(d.stdout ?? '') === normalize(tc.expected)
                ? 'pass'
                : 'fail',
            actual: (d.stdout ?? '').trim(),
          };
        }
      } catch (err) {
        results[tc.id] = { id: tc.id, status: 'error', actual: errorMessage(err) };
      }
      setTestResults({ ...results });
      // Space out requests: the server enforces a per-user cooldown.
      await new Promise((resolve) => setTimeout(resolve, 650));
    }

    setTestsRunning(false);
    socket.emit('code:result', { kind: 'tests', results: Object.values(results) });
  };

  // --- Shared test-case CRUD (mutate the Yjs array so peers stay in sync) ---

  const addTest = () =>
    ytestsRef.current?.push([{ id: uid(), input: '', expected: '' }]);

  const updateTest = (index: number, patch: Partial<TestCase>) => {
    const ytests = ytestsRef.current;
    const doc = ytests?.doc;
    if (!ytests || !doc || index >= ytests.length) return;
    const current = ytests.get(index);
    doc.transact(() => {
      ytests.delete(index, 1);
      ytests.insert(index, [{ ...current, ...patch }]);
    });
  };

  const removeTest = (index: number) => {
    const ytests = ytestsRef.current;
    if (!ytests || index >= ytests.length) return;
    ytests.delete(index, 1);
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
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setPanelOpen((v) => !v)}
            title={panelOpen ? 'Hide console' : 'Show console'}
            className={`p-1.5 rounded-md transition-colors ${
              dark
                ? 'text-white/60 hover:bg-white/10'
                : 'text-ink-soft hover:bg-paper-2'
            } ${panelOpen ? (dark ? 'bg-white/10' : 'bg-paper-2') : ''}`}
          >
            <TerminalIcon className="w-4 h-4" />
          </button>
          <button
            onClick={runCode}
            disabled={!runnable || running}
            title={
              runnable
                ? 'Run the code (everyone sees the output)'
                : `${language} cannot be executed`
            }
            className="flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md pl-2 pr-2.5 py-1 transition-colors"
          >
            {running ? (
              <span className="w-3 h-3 inline-block rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <PlayIcon className="w-3.5 h-3.5" />
            )}
            Run
          </button>
        </div>
      </div>
      <div ref={parentRef} className="flex-1 overflow-hidden" />
      {panelOpen && (
        <CodeConsole
          theme={theme}
          tab={tab}
          setTab={setTab}
          running={running}
          output={output}
          tests={tests}
          testResults={testResults}
          testsRunning={testsRunning}
          runnable={runnable}
          onRunTests={runTests}
          onAddTest={addTest}
          onUpdateTest={updateTest}
          onRemoveTest={removeTest}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default CollabCodeEditor;

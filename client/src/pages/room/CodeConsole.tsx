import {
  PlayIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
  BeakerIcon,
  TerminalIcon,
  BookOpenIcon,
  ExternalLinkIcon,
} from '@heroicons/react/outline';
import { ProblemData } from '../../services/leetcode-service';

type Theme = 'dark' | 'light';

export interface TestCase {
  id: string;
  input: string;
  expected: string;
}

export type TestStatus = 'running' | 'pass' | 'fail' | 'error';

export interface TestResult {
  id: string;
  status: TestStatus;
  actual?: string;
}

export interface RunOutput {
  by: string;
  language: string;
  version?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  compileOutput?: string;
  error?: string;
}

export type ConsoleTab = 'output' | 'tests' | 'problem';

interface CodeConsoleProps {
  theme: Theme;
  tab: ConsoleTab;
  setTab: (tab: ConsoleTab) => void;
  running: boolean;
  output: RunOutput | null;
  tests: TestCase[];
  testResults: Record<string, TestResult>;
  testsRunning: boolean;
  runnable: boolean;
  problem: ProblemData | null;
  onRunTests: () => void;
  onAddTest: () => void;
  onUpdateTest: (index: number, patch: Partial<TestCase>) => void;
  onRemoveTest: (index: number) => void;
  onClose: () => void;
}

const DIFFICULTY_CLS: Record<string, string> = {
  Easy: 'bg-emerald-500/15 text-emerald-500',
  Medium: 'bg-amber-500/15 text-amber-500',
  Hard: 'bg-red-500/15 text-red-500',
};

const STATUS_BADGE: Record<TestStatus, { label: string; cls: string }> = {
  running: { label: 'Running…', cls: 'bg-gray-500/15 text-gray-400' },
  pass: { label: 'Pass', cls: 'bg-emerald-500/15 text-emerald-500' },
  fail: { label: 'Fail', cls: 'bg-red-500/15 text-red-500' },
  error: { label: 'Error', cls: 'bg-amber-500/15 text-amber-500' },
};

const Spinner = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <span
    className={`${className} inline-block rounded-full border-2 border-current border-t-transparent animate-spin`}
  />
);

const CodeConsole = ({
  theme,
  tab,
  setTab,
  running,
  output,
  tests,
  testResults,
  testsRunning,
  runnable,
  problem,
  onRunTests,
  onAddTest,
  onUpdateTest,
  onRemoveTest,
  onClose,
}: CodeConsoleProps) => {
  const dark = theme === 'dark';

  const t = dark
    ? {
        root: 'bg-[#0f0f0f] border-white/10',
        tabBar: 'border-white/10',
        tabActive: 'text-white border-accent',
        tabIdle: 'text-white/40 border-transparent hover:text-white/70',
        subtle: 'text-white/40',
        text: 'text-white/80',
        mono: 'bg-[#131316] text-white/80 border-white/10',
        input: 'bg-[#131316] text-white/80 border-white/10 placeholder-white/25',
        btn: 'text-white/60 hover:bg-white/10',
        card: 'border-white/10',
      }
    : {
        root: 'bg-paper border-paper-2',
        tabBar: 'border-paper-2',
        tabActive: 'text-ink border-accent',
        tabIdle: 'text-ink-faint border-transparent hover:text-ink-soft',
        subtle: 'text-ink-faint',
        text: 'text-ink',
        mono: 'bg-white text-ink border-paper-2',
        input: 'bg-white text-ink border-paper-2 placeholder-ink-faint/60',
        btn: 'text-ink-soft hover:bg-paper-2',
        card: 'border-paper-2',
      };

  const passed = tests.filter((tc) => testResults[tc.id]?.status === 'pass').length;
  const hasResults = tests.some((tc) => testResults[tc.id]);

  const monoBlock = (label: string, value: string, tone?: 'error' | 'warn') => (
    <div key={label}>
      <p className={`text-[10px] uppercase tracking-wide mb-1 ${t.subtle}`}>
        {label}
      </p>
      <pre
        className={`text-xs font-mono whitespace-pre-wrap break-words border rounded-md px-3 py-2 ${t.mono} ${
          tone === 'error' ? '!text-red-500' : tone === 'warn' ? '!text-amber-500' : ''
        }`}
      >
        {value}
      </pre>
    </div>
  );

  return (
    <div className={`h-2/5 min-h-[190px] border-t flex flex-col flex-shrink-0 ${t.root}`}>
      {/* Tab bar */}
      <div
        className={`flex items-center gap-1 px-3 border-b flex-shrink-0 ${t.tabBar}`}
      >
        {(
          [
            ...(problem
              ? ([{ key: 'problem', label: 'Problem', Icon: BookOpenIcon }] as const)
              : []),
            { key: 'output', label: 'Output', Icon: TerminalIcon },
            { key: 'tests', label: `Tests (${tests.length})`, Icon: BeakerIcon },
          ] as { key: ConsoleTab; label: string; Icon: typeof TerminalIcon }[]
        ).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 border-b-2 -mb-px transition-colors ${
              tab === key ? t.tabActive : t.tabIdle
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}

        <div className="flex-1" />

        {tab === 'tests' && hasResults && !testsRunning && (
          <span
            className={`text-[11px] font-mono mr-2 ${
              passed === tests.length ? 'text-emerald-500' : t.subtle
            }`}
          >
            {passed}/{tests.length} passed
          </span>
        )}

        <button
          onClick={onClose}
          title="Close console"
          className={`p-1.5 rounded-md transition-colors ${t.btn}`}
        >
          <XIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tab === 'problem' && problem ? (
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <a
                href={problem.url}
                target="_blank"
                rel="noreferrer"
                title="Open on LeetCode"
                className={`flex items-center gap-1.5 text-sm font-semibold hover:text-accent ${t.text}`}
              >
                {problem.title}
                <ExternalLinkIcon className="w-3.5 h-3.5 opacity-60" />
              </a>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                  DIFFICULTY_CLS[problem.difficulty] ??
                  'bg-gray-500/15 text-gray-400'
                }`}
              >
                {problem.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-[10px] border rounded-full px-2 py-0.5 ${t.card} ${t.subtle}`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div
              className={`lc-problem ${
                dark ? 'lc-problem-dark text-white/80' : 'lc-problem-light text-ink'
              }`}
              dangerouslySetInnerHTML={{ __html: problem.contentHTML }}
            />
          </div>
        ) : tab === 'output' ? (
          running ? (
            <div className={`flex items-center gap-2 text-xs ${t.subtle}`}>
              <Spinner /> Running…
            </div>
          ) : !output ? (
            <p className={`text-xs ${t.subtle}`}>
              Hit <span className="font-semibold">Run</span> to execute the code —
              everyone in the session sees the result.
            </p>
          ) : (
            <div className="space-y-3">
              <p className={`text-[11px] ${t.subtle}`}>
                Run by <span className="font-semibold">{output.by}</span>
                {output.version && ` · ${output.language} ${output.version}`}
                {output.exitCode !== undefined &&
                  output.exitCode !== null &&
                  ` · exit ${output.exitCode}`}
              </p>
              {output.error && monoBlock('Error', output.error, 'error')}
              {output.compileOutput &&
                monoBlock('Compiler', output.compileOutput, 'warn')}
              {output.stdout && monoBlock('stdout', output.stdout)}
              {output.stderr && monoBlock('stderr', output.stderr, 'error')}
              {!output.error &&
                !output.compileOutput &&
                !output.stdout &&
                !output.stderr && (
                  <p className={`text-xs font-mono ${t.subtle}`}>(no output)</p>
                )}
            </div>
          )
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onAddTest}
                className={`flex items-center gap-1 text-xs font-medium border rounded-md px-2 py-1 transition-colors ${t.card} ${t.btn}`}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add test case
              </button>
              <button
                onClick={onRunTests}
                disabled={!runnable || testsRunning || tests.length === 0}
                title={
                  !runnable
                    ? 'This language cannot be executed'
                    : tests.length === 0
                    ? 'Add a test case first'
                    : 'Run all test cases'
                }
                className="flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md px-2.5 py-1 transition-colors"
              >
                {testsRunning ? <Spinner className="w-3 h-3" /> : <PlayIcon className="w-3.5 h-3.5" />}
                Run tests
              </button>
            </div>

            {tests.length === 0 && (
              <p className={`text-xs ${t.subtle}`}>
                Add test cases — each one runs the code with its input (stdin) and
                compares stdout against the expected output. Test cases are shared
                with everyone in the session.
              </p>
            )}

            {tests.map((tc, i) => {
              const result = testResults[tc.id];
              return (
                <div key={tc.id} className={`border rounded-lg p-3 ${t.card}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold ${t.text}`}>
                      Case {i + 1}
                    </span>
                    {result && (
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                          STATUS_BADGE[result.status].cls
                        }`}
                      >
                        {STATUS_BADGE[result.status].label}
                      </span>
                    )}
                    <div className="flex-1" />
                    <button
                      onClick={() => onRemoveTest(i)}
                      title="Delete test case"
                      className={`p-1 rounded-md transition-colors ${t.btn}`}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="block">
                      <span className={`text-[10px] uppercase tracking-wide ${t.subtle}`}>
                        Input (stdin)
                      </span>
                      <textarea
                        rows={2}
                        value={tc.input}
                        onChange={(e) => onUpdateTest(i, { input: e.target.value })}
                        placeholder="(empty)"
                        spellCheck={false}
                        className={`mt-1 w-full text-xs font-mono border rounded-md px-2 py-1.5 resize-y focus:outline-none focus:border-accent ${t.input}`}
                      />
                    </label>
                    <label className="block">
                      <span className={`text-[10px] uppercase tracking-wide ${t.subtle}`}>
                        Expected output
                      </span>
                      <textarea
                        rows={2}
                        value={tc.expected}
                        onChange={(e) =>
                          onUpdateTest(i, { expected: e.target.value })
                        }
                        placeholder="(empty)"
                        spellCheck={false}
                        className={`mt-1 w-full text-xs font-mono border rounded-md px-2 py-1.5 resize-y focus:outline-none focus:border-accent ${t.input}`}
                      />
                    </label>
                  </div>
                  {result &&
                    (result.status === 'fail' || result.status === 'error') &&
                    result.actual !== undefined && (
                      <div className="mt-2">
                        {monoBlock(
                          result.status === 'fail' ? 'Actual output' : 'Error',
                          result.actual || '(no output)',
                          result.status === 'error' ? 'error' : undefined
                        )}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeConsole;

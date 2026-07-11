/**
 * Code execution via the paiza.io API (https://api.paiza.io).
 *
 * (The public Piston API went whitelist-only in Feb 2026; paiza.io still
 * offers a keyless "guest" API key, and PAIZA_API_KEY can override it.)
 *
 * The client never talks to paiza directly — this keeps execution behind our
 * auth, lets us rate-limit per user, and normalizes the response shape.
 */

const PAIZA_URL = process.env.PAIZA_URL ?? 'https://api.paiza.io';
const PAIZA_API_KEY = process.env.PAIZA_API_KEY ?? 'guest';

// Editor language name -> paiza.io language id.
const RUNTIMES: Record<string, string> = {
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  Python: 'python3',
  'C / C++': 'cpp',
};

export const RUNNABLE_LANGUAGES = Object.keys(RUNTIMES);

export interface ExecutionResult {
  language: string;
  version: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  // Compiler diagnostics (C/C++, TypeScript), present only when the build failed.
  compileOutput?: string;
}

interface PaizaRunner {
  id: string;
  status: 'running' | 'completed';
  language: string;
  build_stdout: string | null;
  build_stderr: string | null;
  build_exit_code: string | null;
  build_result: 'success' | 'failure' | null;
  stdout: string | null;
  stderr: string | null;
  exit_code: string | null;
  result: string | null;
  error?: string; // error shape (e.g. unsupported language)
}

// Node 20 ships global fetch; @types/node 17 doesn't know about it.
const fetchFn = (globalThis as any).fetch as (
  url: string,
  init?: unknown
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const paizaError = (message: string, status = 502) =>
  Object.assign(new Error(message), { status });

const executeCode = async (
  editorLanguage: string,
  code: string,
  stdin = ''
): Promise<ExecutionResult> => {
  const language = RUNTIMES[editorLanguage];
  if (!language) {
    throw paizaError(`Language "${editorLanguage}" cannot be executed.`, 400);
  }

  // Create the runner; long-poll so most runs come back in one round trip.
  const createParams = new URLSearchParams({
    source_code: code,
    language,
    input: stdin,
    longpoll: 'true',
    longpoll_timeout: '16',
    api_key: PAIZA_API_KEY,
  });
  const createRes = await fetchFn(`${PAIZA_URL}/runners/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: createParams.toString(),
  });
  let runner = (await createRes.json()) as PaizaRunner;

  if (!createRes.ok || runner.error) {
    throw paizaError(
      runner.error ?? `Execution service error (${createRes.status})`,
      createRes.status === 429 ? 429 : 502
    );
  }

  // Slow builds (e.g. TypeScript) can outlive the long-poll — keep polling.
  for (let attempt = 0; runner.status !== 'completed' && attempt < 20; attempt++) {
    await sleep(1000);
    const detailParams = new URLSearchParams({
      id: runner.id,
      api_key: PAIZA_API_KEY,
    });
    const detailRes = await fetchFn(
      `${PAIZA_URL}/runners/get_details?${detailParams.toString()}`
    );
    runner = (await detailRes.json()) as PaizaRunner;
    if (runner.error) throw paizaError(runner.error);
  }

  if (runner.status !== 'completed') {
    throw paizaError('Execution timed out — try again.', 504);
  }

  const buildFailed =
    runner.build_result !== null && runner.build_result !== 'success';

  return {
    language: editorLanguage,
    version: '',
    stdout: runner.stdout ?? '',
    stderr: runner.stderr ?? '',
    exitCode: buildFailed
      ? Number(runner.build_exit_code ?? 1)
      : runner.exit_code !== null
      ? Number(runner.exit_code)
      : null,
    ...(buildFailed
      ? { compileOutput: runner.build_stderr || runner.build_stdout || 'Build failed.' }
      : {}),
  };
};

export { executeCode };

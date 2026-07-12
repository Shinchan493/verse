/**
 * Fetch problem data from LeetCode's (unofficial) GraphQL API.
 *
 * Used by the live-session "import problem" feature: statement, per-language
 * starter code, and example test cases (inputs from `exampleTestcases`,
 * expected outputs best-effort parsed from the statement's Output: blocks).
 *
 * The API is unofficial — this module is deliberately self-contained and
 * fails gracefully so a LeetCode schema change can't break anything else.
 */

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h — problems rarely change

// LeetCode langSlug -> Verse editor language name.
const LANG_MAP: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python3: 'Python',
  cpp: 'C / C++',
};

export interface ProblemExample {
  input: string;
  expected: string;
}

export interface ProblemData {
  slug: string;
  title: string;
  difficulty: string;
  contentHTML: string;
  tags: string[];
  /** Verse editor language name -> starter code */
  snippets: Record<string, string>;
  examples: ProblemExample[];
  url: string;
}

interface LCQuestion {
  questionId: string;
  title: string;
  difficulty: string;
  content: string | null;
  exampleTestcases: string | null;
  metaData: string | null;
  isPaidOnly: boolean;
  topicTags: { name: string }[];
  codeSnippets: { lang: string; langSlug: string; code: string }[] | null;
}

const cache = new Map<string, { data: ProblemData; at: number }>();

// Node 20 ships global fetch; @types/node 17 doesn't know about it.
const fetchFn = (globalThis as any).fetch as (
  url: string,
  init?: unknown
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const lcError = (message: string, status = 502) =>
  Object.assign(new Error(message), { status });

/** Accepts a bare slug or a full problem URL and returns the slug. */
export const extractSlug = (input: string): string | null => {
  const urlMatch = input.match(/leetcode\.(?:com|cn)\/problems\/([a-z0-9-]+)/i);
  const candidate = (urlMatch ? urlMatch[1] : input).trim().toLowerCase();
  return /^[a-z0-9-]{1,120}$/.test(candidate) ? candidate : null;
};

// Strip anything active from LeetCode's statement HTML before it reaches
// dangerouslySetInnerHTML on the client.
const sanitizeHTML = (html: string): string =>
  html
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(?:"|')?\s*javascript:[^"'\s>]*("|')?/gi, '');

const decodeEntities = (s: string): string =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

/**
 * Best-effort expected outputs: the statement's examples are
 * `<pre>...Output: X...</pre>` (or heading + separate pre) blocks.
 */
const parseExpectedOutputs = (contentHTML: string): string[] => {
  const text = decodeEntities(contentHTML.replace(/<[^>]+>/g, ''));
  const outputs: string[] = [];
  const re = /Output:?\s*([^\n]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    outputs.push(m[1].trim());
  }
  return outputs;
};

/**
 * `exampleTestcases` is one flat list of lines: every example contributes
 * one line per function parameter. Chunk it using the param count from
 * `metaData` so each test case gets its full stdin.
 */
const chunkExampleInputs = (
  exampleTestcases: string | null,
  metaData: string | null,
  exampleCount: number
): string[] => {
  if (!exampleTestcases) return [];
  const lines = exampleTestcases.split('\n');
  let paramCount = 1;
  try {
    const meta = JSON.parse(metaData ?? '{}');
    if (Array.isArray(meta.params) && meta.params.length > 0) {
      paramCount = meta.params.length;
    }
  } catch {
    // fall back to dividing evenly across the parsed examples
    if (exampleCount > 0 && lines.length % exampleCount === 0) {
      paramCount = lines.length / exampleCount;
    }
  }
  const chunks: string[] = [];
  for (let i = 0; i + paramCount <= lines.length; i += paramCount) {
    chunks.push(lines.slice(i, i + paramCount).join('\n'));
  }
  return chunks;
};

const fetchProblem = async (slug: string): Promise<ProblemData> => {
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const response = await fetchFn(LEETCODE_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // LeetCode rejects requests without a browser-ish referer.
      Referer: `https://leetcode.com/problems/${slug}/`,
    },
    body: JSON.stringify({
      query: `query q($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId title difficulty content exampleTestcases metaData
          isPaidOnly topicTags { name }
          codeSnippets { lang langSlug code }
        }
      }`,
      variables: { titleSlug: slug },
    }),
  });

  if (!response.ok) {
    throw lcError(`LeetCode responded with ${response.status} — try again.`);
  }

  const body = (await response.json()) as {
    data?: { question: LCQuestion | null };
  };
  const q = body?.data?.question;
  if (!q) throw lcError('Problem not found — check the URL or slug.', 404);
  if (q.isPaidOnly) {
    throw lcError('That problem is LeetCode Premium-only and cannot be imported.', 403);
  }
  if (!q.content) throw lcError('LeetCode returned no content for this problem.');

  const snippets: Record<string, string> = {};
  (q.codeSnippets ?? []).forEach((s) => {
    const editorLang = LANG_MAP[s.langSlug];
    if (editorLang) snippets[editorLang] = s.code;
  });

  const expected = parseExpectedOutputs(q.content);
  const inputs = chunkExampleInputs(q.exampleTestcases, q.metaData, expected.length);
  const examples: ProblemExample[] = inputs.map((input, i) => ({
    input,
    expected: expected[i] ?? '',
  }));

  const data: ProblemData = {
    slug,
    title: q.title,
    difficulty: q.difficulty,
    contentHTML: sanitizeHTML(q.content),
    tags: q.topicTags.map((t) => t.name),
    snippets,
    examples,
    url: `https://leetcode.com/problems/${slug}/`,
  };

  cache.set(slug, { data, at: Date.now() });
  return data;
};

export { fetchProblem };

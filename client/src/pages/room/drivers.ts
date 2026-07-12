import { ProblemData } from '../../services/leetcode-service';

/**
 * Auto-generated run drivers for imported LeetCode problems.
 *
 * LeetCode starters define a function/method that RETURNS its answer; our
 * executor judges stdout. These drivers bridge the gap: they read the test
 * case's stdin (one JSON value per line, exactly how LeetCode's
 * exampleTestcases are shaped), call the solution, and print the result as
 * compact JSON — which matches the `Output:` format we parse into the
 * expected fields.
 *
 * Validated end-to-end against paiza.io for all three languages.
 * C/C++ is not supported (typed parsing needs per-problem codegen) — those
 * users write their own main().
 */

const pythonDriver = (fn: string) => `

# --- Verse auto-driver (imported problem) — do not edit ---
if __name__ == "__main__":
    import sys, json
    _lines = [l for l in sys.stdin.read().split("\\n") if l.strip() != ""]
    _args = [json.loads(_l) for _l in _lines]
    _res = Solution().${fn}(*_args)
    if _res is None and _args:
        _res = _args[0]  # in-place problems: show the mutated first argument
    print(json.dumps(_res, separators=(",", ":")))
`;

const javascriptDriver = (fn: string) => `

// --- Verse auto-driver (imported problem) — do not edit ---
;(function () {
  const _fs = require("fs");
  const _lines = _fs.readFileSync(0, "utf8").split("\\n").filter((l) => l.trim() !== "");
  const _args = _lines.map((l) => JSON.parse(l));
  let _res;
  if (typeof ${fn} === "function") _res = ${fn}(..._args);
  else if (typeof Solution === "function") _res = new Solution().${fn}(..._args);
  if (_res === undefined && _args.length) _res = _args[0];
  console.log(JSON.stringify(_res === undefined ? null : _res));
})();
`;

// paiza's TypeScript env ships @types/node, so `require` is already typed.
const typescriptDriver = (fn: string) => `

// --- Verse auto-driver (imported problem) — do not edit ---
const _fs = require("fs");
const _lines: string[] = _fs.readFileSync(0, "utf8").split("\\n").filter((l: string) => l.trim() !== "");
const _args: any[] = _lines.map((l: string) => JSON.parse(l));
let _res: any = (${fn} as any)(..._args);
if (_res === undefined && _args.length) _res = _args[0];
console.log(JSON.stringify(_res === undefined ? null : _res));
`;

const DRIVERS: Record<string, (fn: string) => string> = {
  Python: pythonDriver,
  JavaScript: javascriptDriver,
  TypeScript: typescriptDriver,
};

export const driverSupported = (language: string): boolean =>
  language in DRIVERS;

/**
 * Append the auto-driver for an imported problem. Returns the code untouched
 * when there's no problem, no function metadata, an unsupported language, or
 * the user already wrote their own entrypoint.
 */
export const buildRunnableCode = (
  code: string,
  language: string,
  problem: ProblemData | null
): string => {
  const fn = problem?.functionName;
  const driver = DRIVERS[language];
  if (!fn || !driver) return code;
  // User already reads stdin / prints themselves? Don't double up.
  if (/Verse auto-driver|__main__|readFileSync\s*\(/.test(code)) return code;
  return code + driver(fn);
};

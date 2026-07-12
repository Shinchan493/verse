import API from './api';

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
  /** Editor language name -> starter code */
  snippets: Record<string, string>;
  examples: ProblemExample[];
  url: string;
  /** Solution method name — used to auto-generate run drivers. */
  functionName: string | null;
}

const LeetcodeService = {
  get: (accessToken: string, slugOrUrl: string) => {
    return API.get<ProblemData>(
      `leetcode/${encodeURIComponent(slugOrUrl)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  },
};

export default LeetcodeService;

import { Request, Response } from 'express';
import catchAsync from '../../middleware/catch-async';
import { extractSlug, fetchProblem } from '../../services/leetcode.service';

class LeetcodeController {
  public getProblem = catchAsync(async (req: Request, res: Response) => {
    const slug = extractSlug(req.params.slug ?? '');
    if (!slug) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Invalid problem URL or slug.' }] });
    }

    try {
      const problem = await fetchProblem(slug);
      return res.status(200).json(problem);
    } catch (error) {
      const status = (error as { status?: number }).status ?? 502;
      const msg =
        (error as Error).message || 'Could not fetch the problem — try again.';
      return res.status(status).json({ errors: [{ msg }] });
    }
  });
}

const leetcodeController = new LeetcodeController();

export { leetcodeController };

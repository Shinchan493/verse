import { Request, Response } from 'express';
import catchAsync from '../../middleware/catch-async';
import { executeCode, RUNNABLE_LANGUAGES } from '../../services/code.service';

const MAX_CODE_LENGTH = 100_000;
const MAX_STDIN_LENGTH = 10_000;
const COOLDOWN_MS = 500;

// Per-user cooldown so one session can't hammer the public Piston API.
const lastRunByUser = new Map<string, number>();

class CodeController {
  public execute = catchAsync(async (req: Request, res: Response) => {
    const { language, code, stdin } = req.body as {
      language?: string;
      code?: string;
      stdin?: string;
    };

    if (!language || !RUNNABLE_LANGUAGES.includes(language)) {
      return res.status(400).json({
        errors: [{ msg: `Language must be one of: ${RUNNABLE_LANGUAGES.join(', ')}` }],
      });
    }
    if (typeof code !== 'string' || code.length === 0) {
      return res.status(400).json({ errors: [{ msg: 'Code is required.' }] });
    }
    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({ errors: [{ msg: 'Code is too long.' }] });
    }
    if (stdin !== undefined && typeof stdin !== 'string') {
      return res.status(400).json({ errors: [{ msg: 'stdin must be a string.' }] });
    }
    if (stdin && stdin.length > MAX_STDIN_LENGTH) {
      return res.status(400).json({ errors: [{ msg: 'stdin is too long.' }] });
    }

    const userId = req.user!.id;
    const now = Date.now();
    const last = lastRunByUser.get(userId) ?? 0;
    if (now - last < COOLDOWN_MS) {
      return res
        .status(429)
        .json({ errors: [{ msg: 'Running too fast — try again in a moment.' }] });
    }
    lastRunByUser.set(userId, now);

    try {
      const result = await executeCode(language, code, stdin ?? '');
      return res.status(200).json(result);
    } catch (error) {
      const status = (error as { status?: number }).status ?? 502;
      const msg =
        (error as Error).message || 'Code execution failed — try again.';
      return res.status(status).json({ errors: [{ msg }] });
    }
  });
}

const codeController = new CodeController();

export { codeController };

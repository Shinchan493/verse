import { Request, Response, Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import user from './user.route';
import auth from './auth.route';
import document from './document.route';
import code from './code.route';
import leetcode from './leetcode.route';
import RoleEnum from '../types/enums/role-enum';

const router = Router();

// Unauthenticated liveness probe — used by the keep-alive pinger and the
// client's boot-time warm-up so Render's free tier doesn't cold-start on
// real users. Deliberately touches nothing (no DB).
router.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({ ok: true, uptime: process.uptime() });
});

router.get(
  '/',
  authenticate,
  authorize([RoleEnum.SUPERADMIN]),
  async (req: Request, res: Response) => {
    return res.sendStatus(200);
  }
);
router.use('/user', user);
router.use('/auth', auth);
router.use('/document', document);
router.use('/code', code);
router.use('/leetcode', leetcode);

export default router;

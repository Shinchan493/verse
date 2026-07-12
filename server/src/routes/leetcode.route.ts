import { Router } from 'express';
import { leetcodeController } from '../controllers/leetcode/leetcode.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/:slug', authenticate, leetcodeController.getProblem);

export default router;

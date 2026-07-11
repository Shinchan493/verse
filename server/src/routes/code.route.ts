import { Router } from 'express';
import { codeController } from '../controllers/code/code.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.post('/execute', authenticate, codeController.execute);

export default router;

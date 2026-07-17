import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { reportController } from './report.controller';

const router = Router();

router.use(authenticate);

router.get('/reports/:taskId', (req, res, next) => reportController.getReport(req, res, next));

export default router;

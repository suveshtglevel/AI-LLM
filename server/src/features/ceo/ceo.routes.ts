import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { CEO } from './ceo.model';
import { delegateSchema, projectStatusSchema } from './ceo.validation';

const router = Router();
router.use(authenticate);

router.post('/delegate', validate(delegateSchema), async (req, res, next) => {
  try {
    const { title, goal, description, workflowType } = req.body;
    const result = await CEO.delegateGoal(req.user!.userId, title, goal, description, workflowType);
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/status/:projectId', validate(projectStatusSchema), async (req, res, next) => {
  try {
    const status = await CEO.getProjectStatus(req.params.projectId as string, req.user!.userId);
    res.json({ success: true, data: status });
  } catch (error) { next(error); }
});

export default router;

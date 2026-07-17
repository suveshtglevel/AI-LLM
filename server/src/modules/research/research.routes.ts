import { Router } from 'express';
import { researchController } from './research.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth.middleware';
import { createTaskSchema, getTasksSchema, getTaskSchema } from './research.validation';

const router = Router();

// All research routes require authentication
router.use(authenticate);

router.post('/tasks', validate(createTaskSchema), (req, res, next) => researchController.createTask(req, res, next));
router.get('/tasks', validate(getTasksSchema), (req, res, next) => researchController.getTasks(req, res, next));
router.get('/tasks/:id', validate(getTaskSchema), (req, res, next) => researchController.getTask(req, res, next));
router.delete('/tasks/:id', validate(getTaskSchema), (req, res, next) => researchController.deleteTask(req, res, next));

export default router;

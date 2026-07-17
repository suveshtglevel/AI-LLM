import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { Approval } from './approval.model';
import { WorkflowEngine } from '../../workflows/workflow.engine';
import { approvalActionSchema, getPendingApprovalsSchema } from './approval.validation';

const router = Router();
router.use(authenticate);

/**
 * GET /api/approvals/pending
 * List pending approvals for the current user
 */
router.get('/pending', validate(getPendingApprovalsSchema), async (req, res, next) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const limit = Number(req.query.limit) || 20;

    const filter: any = { userId: req.user!.userId, status: 'pending' };
    if (projectId) filter.projectId = projectId;

    const [approvals, total] = await Promise.all([
      Approval.find(filter).sort({ requestedAt: -1 }).limit(limit).exec(),
      Approval.countDocuments(filter).exec(),
    ]);

    res.json({ success: true, data: { approvals, total, limit } });
  } catch (error) { next(error); }
});

/**
 * POST /api/approvals/:id/decide
 * Approve or reject a pending approval request
 */
router.post('/:id/decide', validate(approvalActionSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved, comment } = req.body;

    const approval = await Approval.findOne({ _id: id, userId: req.user!.userId });
    if (!approval) {
      res.status(404).json({ success: false, error: { message: 'Approval request not found' } });
      return;
    }

    if (approval.status !== 'pending') {
      res.status(400).json({ success: false, error: { message: `Approval already ${approval.status}` } });
      return;
    }

    await WorkflowEngine.handleApproval(approval.taskId, approval.projectId, approved, comment);

    res.json({
      success: true,
      data: {
        id: approval._id,
        taskId: approval.taskId,
        status: approved ? 'approved' : 'rejected',
        comment: comment || null,
      },
    });
  } catch (error) { next(error); }
});

/**
 * GET /api/approvals/count
 * Get count of pending approvals
 */
router.get('/count', async (req, res, next) => {
  try {
    const count = await Approval.countDocuments({ userId: req.user!.userId, status: 'pending' }).exec();
    res.json({ success: true, data: { pendingCount: count } });
  } catch (error) { next(error); }
});

export default router;

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { AnalyticsService } from '../../services/analytics.service';

const router = Router();
router.use(authenticate);

/**
 * GET /api/analytics
 * List available analytics endpoints
 */
router.get('/', async (_req, res) => {
  res.json({
    success: true,
    data: {
      endpoints: {
        summary: 'GET /api/analytics/summary — Full analytics summary',
        employees: 'GET /api/analytics/employees — Performance by employee type',
        costs: 'GET /api/analytics/costs?days=30 — AI cost trends',
        performance: 'GET /api/analytics/performance?days=7 — Execution time and success rate trends',
      },
    },
  });
});

/**
 * GET /api/analytics/summary
 * Get full analytics summary for the current user
 */
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await AnalyticsService.getSummary(req.user!.userId);
    res.json({ success: true, data: summary });
  } catch (error) { next(error); }
});

/**
 * GET /api/analytics/employees
 * Get performance breakdown by employee type
 */
router.get('/employees', async (req, res, next) => {
  try {
    const performance = await AnalyticsService.getEmployeePerformance(req.user!.userId);
    res.json({ success: true, data: { performance, total: performance.length } });
  } catch (error) { next(error); }
});

/**
 * GET /api/analytics/costs
 * Get cost trends over time
 */
router.get('/costs', async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;
    const trends = await AnalyticsService.getCostTrends(req.user!.userId, days);
    res.json({ success: true, data: { trends, days } });
  } catch (error) { next(error); }
});

/**
 * GET /api/analytics/performance
 * Get execution time and success rate trends
 */
router.get('/performance', async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 7;
    const trends = await AnalyticsService.getPerformanceTrends(req.user!.userId, days);
    res.json({ success: true, data: { trends, days } });
  } catch (error) { next(error); }
});

export default router;

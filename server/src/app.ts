import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { logger } from './config/logger';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import researchRoutes from './modules/research/research.routes';
import reportRoutes from './modules/reports/report.routes';
import ceoRoutes from './features/ceo/ceo.routes';
import projectRoutes from './features/projects/project.routes';
import approvalRoutes from './features/approvals/approval.routes';
import departmentRoutes from './features/departments/department.routes';
import employeeRoutes from './features/departments/employee.routes';
import memoryRoutes from './features/memory/memory.routes';
import schedulerRoutes from './features/scheduler/scheduler.routes';
import analyticsRoutes from './features/analytics/analytics.routes';
import systemRoutes from './features/system/system.routes';
import toolsRoutes from './features/system/tools.routes';
import providersRoutes from './features/system/providers.routes';
import workflowsRoutes from './features/system/workflows.routes';

const app = express();

// ==================== Middleware ====================

app.use(helmet());

app.use(cors({
  origin: env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN : '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }));
}

// ==================== Health Check ====================

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ==================== Routes ====================

app.use('/api/auth', authRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/research', reportRoutes);
app.use('/api/ceo', ceoRoutes);
app.use('/api', projectRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/workflows', workflowsRoutes);

// ==================== Error Handler ====================

app.use(errorHandler);

// ==================== 404 Handler ====================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', statusCode: 404 },
  });
});

export default app;

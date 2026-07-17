import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { startAllWorkers } from './workers/worker.factory';
import './features/employees'; // Triggers employee auto-registration
import './workflows'; // Triggers workflow auto-registration
import { schedulerService } from './services/scheduler.service';
import { startResearchWorker } from './workers/research.worker';
import { startPlanningWorker } from './workers/planning.worker';

async function bootstrap(): Promise<void> {
  const startTime = Date.now();

  logger.info('🚀 Starting AIOS Server...');

  try {
    await connectDatabase();
    await connectRedis();

    // Start workers
    startAllWorkers();
    startResearchWorker();
    startPlanningWorker();

    // Start scheduler
    schedulerService.start();

    const server = app.listen(env.PORT, () => {
      const elapsed = Date.now() - startTime;
      logger.info(`✅ AIOS Server started on port ${env.PORT} (${env.NODE_ENV} mode) in ${elapsed}ms`);
      logger.info(`📚 API Routes:`);
      logger.info(`   POST /api/auth/*           - Auth (register/login/refresh/me)`);
      logger.info(`   POST /api/ceo/delegate     - Delegate a goal to the AIOS`);
      logger.info(`   GET  /api/ceo/status/:id   - Get project status`);
      logger.info(`   GET/POST /api/projects/*   - Manage projects`);
      logger.info(`   GET /api/tasks/*            - Manage tasks`);
      logger.info(`   POST /api/research/tasks   - Direct research tasks`);
      logger.info(`   GET  /api/research/reports/* - Research reports`);
      logger.info(`   GET  /api/health            - Health check`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`📥 Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        await Promise.all([disconnectDatabase(), disconnectRedis()]);
        logger.info('👋 All connections closed. Goodbye!');
        process.exit(0);
      });
      setTimeout(() => { logger.error('Forced shutdown after timeout'); process.exit(1); }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

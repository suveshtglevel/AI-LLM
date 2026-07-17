import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { logger } from '../config/logger';

let connection: ConnectionOptions;

function getConnection(): ConnectionOptions {
  if (!connection) {
    const redis = getRedisClient();
    connection = {
      host: redis.options.host,
      port: redis.options.port,
    };
  }
  return connection;
}

export function createQueue(name: string): Queue {
  const queue = new Queue(name, {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 3600 * 24, // Keep for 24 hours
        count: 100,
      },
      removeOnFail: {
        age: 3600 * 48, // Keep failed jobs for 48 hours
      },
    },
  });

  logger.info(`Queue created: ${name}`);
  return queue;
}

export function createWorker(
  name: string,
  processor: (job: any) => Promise<void>,
  concurrency: number = 5
): Worker {
  const worker = new Worker(name, processor, {
    connection: getConnection(),
    concurrency,
    limiter: {
      max: 10, // Max jobs per duration
      duration: 1000, // per second
    },
  });

  worker.on('completed', (job) => {
    logger.info(`Worker: Job ${job.id} completed in queue ${name}`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Worker: Job ${job?.id} failed in queue ${name}`, {
      error: error.message,
    });
  });

  worker.on('error', (error) => {
    logger.error(`Worker: Error in queue ${name}:`, error);
  });

  logger.info(`Worker created for queue: ${name} (concurrency: ${concurrency})`);
  return worker;
}

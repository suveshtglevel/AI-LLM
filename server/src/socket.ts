import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from './config/logger';
import { verifyAccessToken } from './utils/jwt';

let io: Server | null = null;

/**
 * Socket event names for the AI Inspector
 */
export const INSPECTOR_EVENTS = {
  /** Emitted when an employee's inspector snapshot is updated */
  INSPECTOR_UPDATED: 'inspector:updated',
  /** Emitted when a new execution log is created */
  LOG_CREATED: 'inspector:log_created',
  /** Emitted when employee status changes */
  STATUS_CHANGED: 'inspector:status_changed',
  /** Emitted when employee performance metrics change */
  PERFORMANCE_UPDATED: 'inspector:performance_updated',
} as const;

/**
 * Initialize Socket.IO server with auth middleware.
 */
export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifyAccessToken(token);
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.debug(`[Socket.IO] User connected: ${user?.userId || 'unknown'}`);

    // Join a project room for real-time updates
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      logger.debug(`[Socket.IO] ${user?.userId} joined project:${projectId}`);
    });

    // Join an employee inspector room
    socket.on('join:inspector', (employeeType: string) => {
      socket.join(`inspector:${employeeType}`);
      logger.debug(`[Socket.IO] ${user?.userId} joined inspector:${employeeType}`);
    });

    // Leave an employee inspector room
    socket.on('leave:inspector', (employeeType: string) => {
      socket.leave(`inspector:${employeeType}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`[Socket.IO] User disconnected: ${user?.userId || 'unknown'}`);
    });
  });

  logger.info('[Socket.IO] Server initialized');
  return io;
}

/**
 * Emit an inspector update event for a specific employee type.
 */
export function emitInspectorUpdate(employeeType: string, data: Record<string, any>): void {
  if (!io) return;
  io.to(`inspector:${employeeType}`).emit(INSPECTOR_EVENTS.INSPECTOR_UPDATED, {
    employeeType,
    ...data,
    timestamp: new Date(),
  });
}

/**
 * Emit a log entry for an employee.
 */
export function emitInspectorLog(employeeType: string, log: Record<string, any>): void {
  if (!io) return;
  io.to(`inspector:${employeeType}`).emit(INSPECTOR_EVENTS.LOG_CREATED, {
    employeeType,
    log,
    timestamp: new Date(),
  });
}

/**
 * Emit a status change for an employee.
 */
export function emitStatusChange(employeeType: string, status: string, details?: Record<string, any>): void {
  if (!io) return;
  io.to(`inspector:${employeeType}`).emit(INSPECTOR_EVENTS.STATUS_CHANGED, {
    employeeType,
    status,
    details,
    timestamp: new Date(),
  });
}

/**
 * Emit performance update for an employee.
 */
export function emitPerformanceUpdate(employeeType: string, performance: Record<string, any>): void {
  if (!io) return;
  io.to(`inspector:${employeeType}`).emit(INSPECTOR_EVENTS.PERFORMANCE_UPDATED, {
    employeeType,
    performance,
    timestamp: new Date(),
  });
}

/**
 * Get the Socket.IO server instance.
 */
export function getIO(): Server | null {
  return io;
}

/**
 * Structured Logging Utilities
 * 
 * Log all requests and errors in JSON format for easy parsing
 * Include requestId, timestamps, user context, performance metrics
 * 
 * Format: JSON with requestId for correlation across requests
 * Output: console.log (can be piped to Datadog, Loki, or file)
 */

import { randomUUID } from 'crypto';

export interface LogContext {
  requestId: string;
  userId?: string;
  workspaceId?: string;
  action: string;
  timestamp: string;
}

export interface RequestLog {
  requestId: string;
  timestamp: string;
  userId?: string;
  workspaceId?: string;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  error?: string;
  tags?: Record<string, string>;
}

export interface ErrorLog {
  requestId: string;
  timestamp: string;
  userId?: string;
  workspaceId?: string;
  action: string;
  error: string;
  stack?: string;
  tags?: Record<string, string>;
}

/**
 * Generate unique request ID for correlation
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Extract user and workspace context from request
 */
export function extractContext(request?: Request): {
  userId?: string;
  workspaceId?: string;
} {
  if (!request) return {};

  // Try to extract from header (set by middleware or auth)
  const userId = request.headers.get('x-user-id') || undefined;
  const workspaceId = request.headers.get('x-workspace-id') || undefined;

  return { userId, workspaceId };
}

/**
 * Log incoming request
 */
export function logRequest({
  requestId,
  method,
  path,
  statusCode,
  durationMs,
  userId,
  workspaceId,
  action,
  tags,
}: {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  workspaceId?: string;
  action: string;
  tags?: Record<string, string>;
}): RequestLog {
  const log: RequestLog = {
    requestId,
    timestamp: new Date().toISOString(),
    userId,
    workspaceId,
    action,
    method,
    path,
    statusCode,
    durationMs,
  };

  if (tags && Object.keys(tags).length > 0) {
    log.tags = tags;
  }

  // Log in JSON format for easy parsing
  console.log(JSON.stringify(log));

  return log;
}

/**
 * Log error
 */
export function logError({
  requestId,
  error,
  userId,
  workspaceId,
  action,
  tags,
}: {
  requestId: string;
  error: Error | string;
  userId?: string;
  workspaceId?: string;
  action: string;
  tags?: Record<string, string>;
}): ErrorLog {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack =
    typeof error === 'string' ? undefined : error.stack;

  const log: ErrorLog = {
    requestId,
    timestamp: new Date().toISOString(),
    userId,
    workspaceId,
    action,
    error: errorMessage,
    stack: errorStack,
  };

  if (tags && Object.keys(tags).length > 0) {
    log.tags = tags;
  }

  console.error(JSON.stringify(log));

  return log;
}

/**
 * Log custom event (not request/error)
 */
export function logEvent({
  requestId,
  action,
  userId,
  workspaceId,
  message,
  tags,
}: {
  requestId: string;
  action: string;
  userId?: string;
  workspaceId?: string;
  message: string;
  tags?: Record<string, string>;
}): void {
  const log = {
    requestId,
    timestamp: new Date().toISOString(),
    userId,
    workspaceId,
    action,
    message,
    ...(tags && Object.keys(tags).length > 0 && { tags }),
  };

  console.log(JSON.stringify(log));
}

/**
 * Middleware-style function to wrap request handling
 * Usage in route handler:
 *   const startTime = Date.now();
 *   try {
 *     // do work
 *     logRequest({
 *       requestId,
 *       method: request.method,
 *       path: new URL(request.url).pathname,
 *       statusCode: 200,
 *       durationMs: Date.now() - startTime,
 *       ...context,
 *       action: 'create-task',
 *     });
 *   } catch (error) {
 *     logError({
 *       requestId,
 *       error,
 *       action: 'create-task',
 *       ...context,
 *     });
 *   }
 */
export class RequestLogger {
  private requestId: string;
  private startTime: number;
  private context: { userId?: string; workspaceId?: string };

  constructor(requestId?: string) {
    this.requestId = requestId || generateRequestId();
    this.startTime = Date.now();
    this.context = {};
  }

  getRequestId(): string {
    return this.requestId;
  }

  setContext(userId?: string, workspaceId?: string): void {
    this.context = { userId, workspaceId };
  }

  getDurationMs(): number {
    return Date.now() - this.startTime;
  }

  logSuccess({
    method,
    path,
    statusCode,
    action,
    tags,
  }: {
    method: string;
    path: string;
    statusCode: number;
    action: string;
    tags?: Record<string, string>;
  }): RequestLog {
    return logRequest({
      requestId: this.requestId,
      method,
      path,
      statusCode,
      durationMs: this.getDurationMs(),
      userId: this.context.userId,
      workspaceId: this.context.workspaceId,
      action,
      tags,
    });
  }

  logFailure({
    error,
    action,
    tags,
  }: {
    error: Error | string;
    action: string;
    tags?: Record<string, string>;
  }): ErrorLog {
    return logError({
      requestId: this.requestId,
      error,
      userId: this.context.userId,
      workspaceId: this.context.workspaceId,
      action,
      tags,
    });
  }
}

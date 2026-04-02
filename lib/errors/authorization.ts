/**
 * Forbidden Error
 * Thrown when user lacks necessary permissions
 */
export class ForbiddenError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * NotFound Error
 * Thrown when resource doesn't exist or isn't accessible
 */
export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation Error
 * Thrown when input validation fails
 */
export class ValidationError extends Error {
  constructor(
    message: string = 'Validation failed',
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

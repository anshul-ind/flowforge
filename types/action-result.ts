/**
 * Standard result type for Next.js server actions
 * Provides consistent error handling and validation feedback
 */

export type ActionResult<T = void> =
  | {
      success: true;
      message?: string;
      data?: T;
    }
  | {
      success: false;
      message?: string;
      formError?: string;
      fieldErrors?: Record<string, string[]>;
    };

/**
 * Helper to create success response
 */
export function successResult<T>(data?: T, message?: string): ActionResult<T> {
  return {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  };
}

/**
 * Helper to create form-level error response
 */
export function formErrorResult(formError: string): ActionResult {
  return {
    success: false,
    formError,
  };
}

/**
 * Helper to create field-level validation error response
 */
export function fieldErrorsResult(
  fieldErrors: Record<string, string[]>,
  message?: string
): ActionResult {
  return {
    success: false,
    fieldErrors,
    ...(message && { message }),
  };
}

/**
 * Helper to create generic error response
 */
export function errorResult(message: string): ActionResult {
  return {
    success: false,
    message,
  };
}

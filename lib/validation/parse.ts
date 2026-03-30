import { z } from 'zod';
import { ActionResult, fieldErrorsResult, errorResult } from '@/types/action-result';

/**
 * Parse result with structured error handling
 */
export type ParseResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      fieldErrors: Record<string, string[]>;
    };

/**
 * Safely parse data with Zod schema
 * Converts Zod errors into structured field errors
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ParseResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Convert Zod errors to field-level errors
  const fieldErrors: Record<string, string[]> = {};
  
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return {
    success: false,
    fieldErrors,
  };
}

/**
 * Parse form data and return ActionResult
 * Use this in server actions for consistent error handling
 * 
 * @example
 * const result = parseFormData(createProjectSchema, formData);
 * if (!result.success) return result;
 * 
 * const project = await db.project.create({ data: result.data });
 * return successResult(project, 'Project created!');
 */
export function parseFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ActionResult<T> {
  const parseResult = safeParse(schema, data);

  if (!parseResult.success) {
    return fieldErrorsResult(parseResult.fieldErrors, 'Validation failed');
  }

  return {
    success: true,
    data: parseResult.data,
  };
}

/**
 * Async version for schemas with async refinements
 */
export async function parseFormDataAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<ActionResult<T>> {
  try {
    const result = await schema.safeParseAsync(data);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }

      return fieldErrorsResult(fieldErrors, 'Validation failed');
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return errorResult('Unexpected validation error');
  }
}

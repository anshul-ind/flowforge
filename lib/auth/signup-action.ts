'use server';

import type { ActionResult } from '@/types/action-result';
import { fieldErrorsResult, errorResult } from '@/types/action-result';
import { AuthService } from '@/modules/auth/service';
import { signUpSchema } from '@/modules/auth/schemas';

/**
 * Sign Up Server Action
 * 
 * Handles user registration from the sign-up form.
 * 
 * Flow:
 * 1. Convert FormData to object
 * 2. Validate with Zod schema
 * 3. Call AuthService.signup() to create user
 * 4. Return success or validation/error result
 */
export async function signUp(
  formData: FormData
): Promise<ActionResult<{ email: string; id: string }>> {
  try {
    // Convert FormData to object
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      name: formData.get('name') as string | undefined,
    };

    // Validate with Zod schema
    const validationResult = await signUpSchema.safeParseAsync(data);

    if (!validationResult.success) {
      // Extract field errors from Zod validation
      const fieldErrors: Record<string, string[]> = {};

      for (const issue of validationResult.error.issues) {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }

      return fieldErrorsResult(fieldErrors, 'Validation failed');
    }

    // Call auth service to create user
    const result = await AuthService.signup(validationResult.data);
    return result;
  } catch (error) {
    console.error('Sign up action error:', error);
    return errorResult('An unexpected error occurred. Please try again.');
  }
}

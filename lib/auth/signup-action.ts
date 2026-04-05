'use server';

import type { ActionResult } from '@/types/action-result';
import { fieldErrorsResult, errorResult } from '@/types/action-result';
import { AuthService } from '@/modules/auth/service';
import { signUpSchema } from '@/modules/auth/schemas';
import { signupLimiter } from '@/lib/rate-limiting/rate-limiter';

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
    const nameRaw = formData.get('name');
    const name =
      typeof nameRaw === 'string' && nameRaw.trim().length > 0
        ? nameRaw.trim()
        : undefined;

    // Convert FormData to object
    const data = {
      email: String(formData.get('email') ?? '')
        .trim()
        .toLowerCase(),
      password: String(formData.get('password') ?? ''),
      confirmPassword: String(formData.get('confirmPassword') ?? ''),
      name,
      userType: (formData.get('userType') as string) || 'personal',
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

    const signupLimit = signupLimiter.check(`signup:${validationResult.data.email}`);
    if (!signupLimit.allowed) {
      return errorResult('Too many sign-up attempts for this email. Try again later.');
    }

    // Call auth service to create user with userType
    const userType = (data.userType === 'team' ? 'team' : 'personal') as 'personal' | 'team';
    const result = await AuthService.signup(validationResult.data, userType);
    return result;
  } catch (error) {
    console.error('Sign up action error:', error);
    return errorResult('An unexpected error occurred. Please try again.');
  }
}

'use server';

import type { ActionResult } from '@/types/action-result';
import { errorResult, successResult } from '@/types/action-result';
import { AuthService } from '@/modules/auth/service';
import { signInSchema } from '@/modules/auth/schemas';
import { auth, signIn } from '@/auth';

/**
 * Sign In Server Action
 * 
 * Validates credentials and creates JWT session.
 * This is primarily for server-side credential validation;
 * form submission uses next-auth/react signIn() directly.
 * 
 * Use case: Server-side verification before session creation.
 * 
 * Flow:
 * 1. Validate email/password with schema
 * 2. Find user by email
 * 3. Verify password hash with AuthService
 * 4. Return success or error
 */
export async function signInAction(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  try {
    // Convert FormData to object
    const data = {
      email: (formData.get('email') as string)?.trim().toLowerCase(),
      password: formData.get('password') as string,
    };

    // Validate with Zod schema
    const validationResult = await signInSchema.safeParseAsync(data);

    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validationResult.error.issues) {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      }
      return errorResult('Invalid email or password');
    }

    // Verify credentials through service
    const result = await AuthService.verifyCredentials(validationResult.data);

    if (!result.success) {
      return errorResult('Invalid email or password');
    }

    // Credentials verified — session will be created by next-auth/react on client
    return successResult(
      result.data ? { email: result.data.email } : undefined,
      'Authentication successful'
    );
  } catch (error) {
    console.error('Sign in action error:', error);
    return errorResult('An unexpected error occurred. Please try again.');
  }
}

import { z } from 'zod';

/**
 * Authentication Validation Schemas
 * 
 * Single source of truth for auth field validation.
 * Used in signup service and server actions.
 */

// Password validation rules
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/** Shown under the password field on sign-up (matches `passwordSchema`). */
export const PASSWORD_POLICY_SUMMARY =
  '8+ characters, including one uppercase letter, one lowercase letter, and one number.';

/** Client-side check aligned with `passwordSchema` (first failing rule). */
export function getPasswordPolicyError(password: string): string | null {
  const parsed = passwordSchema.safeParse(password);
  if (parsed.success) return null;
  return parsed.error.issues[0]?.message ?? 'Invalid password';
}

/**
 * Sign Up Schema
 * Validates new user registration form
 */
export const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

/**
 * Sign In Schema
 * Validates user login form
 */
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchema>;

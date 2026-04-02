import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import type { ActionResult } from '@/types/action-result';
import { successResult, errorResult } from '@/types/action-result';
import { signUpSchema, type SignUpInput, signInSchema, type SignInInput } from './schemas';

/**
 * Authentication Service
 * 
 * Handles user registration and password management.
 * This is the business logic layer for auth operations.
 */

export class AuthService {
  /**
   * Register a new user
   * 
   * @param input - Validated signup data
   * @returns Success with user email or error message
   * 
   * Flow:
   * 1. Validate input schema
   * 2. Check if email already exists
   * 3. Hash password with bcrypt
   * 4. Create user in database
   * 5. Return success result
   */
  static async signup(input: SignUpInput): Promise<ActionResult<{ email: string; id: string }>> {
    try {
      // 1. Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });

      if (existingUser) {
        return errorResult('An account with this email already exists');
      }

      // 2. Hash password with bcrypt (10 salt rounds)
      const passwordHash = await bcrypt.hash(input.password, 10);

      // 3. Create user in database
      const user = await prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name || undefined,
        },
        select: {
          id: true,
          email: true,
        },
      });

      // 4. Return success
      return successResult({ email: user.email, id: user.id }, 'Account created successfully');
    } catch (error) {
      console.error('Signup error:', error);
      return errorResult('Failed to create account. Please try again.');
    }
  }

  /**
   * Verify user credentials
   * 
   * @param input - Email and password to verify
   * @returns Success with user data if credentials valid, error otherwise
   * 
   * Used by sign-in flows to validate credentials before session creation.
   * Does not create session here — that's done by next-auth.
   */
  static async verifyCredentials(
    input: SignInInput
  ): Promise<ActionResult<{ id: string; email: string; name: string | null }>> {
    try {
      // 1. Find user by email
      const user = await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true, email: true, passwordHash: true, name: true },
      });

      if (!user) {
        // Don't reveal if email exists (security best practice)
        return errorResult('Invalid email or password');
      }

      // 2. Verify password hash
      const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

      if (!isPasswordValid) {
        return errorResult('Invalid email or password');
      }

      // 3. Return user data (password hash excluded)
      return successResult(
        {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        'Credentials verified'
      );
    } catch (error) {
      console.error('Credential verification error:', error);
      return errorResult('An unexpected error occurred during sign-in');
    }
  }

  /**
   * Hash a password
   * 
   * Used for password resets and other password changes.
   * 
   * @param password - Plain text password
   * @returns Hash of the password
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Verify a password against its hash
   * 
   * Used by auth.ts Credentials provider.
   * 
   * @param password - Plain text password from user
   * @param passwordHash - Hashed password from database
   * @returns True if password matches hash, false otherwise
   */
  static async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return await bcrypt.compare(password, passwordHash);
  }
}

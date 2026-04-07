import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

/**
 * NextAuth Type Extensions
 * 
 * Extends the default NextAuth types to include custom fields.
 * This makes TypeScript aware of our custom session/token fields.
 */

export type User = DefaultUser & {
  id: string;
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  /**
   * Extended User object
   * Includes the user ID
   */
  interface User extends DefaultUser {
    id: string;
  }

  /**
   * Extended Session object
   * Adds user ID to the session.user object
   */
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT token
   * Includes user ID in the token payload
   */
  interface JWT extends DefaultJWT {
    id: string;
    email?: string;
  }
}

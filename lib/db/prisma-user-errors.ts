import { Prisma } from '@/lib/generated/prisma';

/**
 * Maps Prisma / driver errors to a safe, user-visible string for auth flows.
 * Server operators should also check logs and DEPLOYMENT.md when P1001 appears.
 */
export function prismaUserFacingMessage(error: unknown, fallback: string): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P1001' || error.code === 'P1017') {
      return (
        'Cannot reach PostgreSQL. Ensure the database service is running on this server and DATABASE_URL matches it ' +
        '(same-machine example: postgresql://USER:PASSWORD@127.0.0.1:5432/flowforge). See DEPLOYMENT.md.'
      );
    }
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      const t = Array.isArray(target) ? target.join(', ') : String(target ?? '');
      if (t.includes('email') || t.includes('User')) {
        return 'An account with this email already exists';
      }
      return 'This value is already in use. Try signing in instead.';
    }
    if (error.code === 'P2021' || error.code === 'P2010' || error.code === 'P2022') {
      return (
        'The database schema is missing or outdated. On the server, run: npx prisma migrate deploy ' +
        '(see DEPLOYMENT.md).'
      );
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return 'Cannot initialize the database connection. Verify DATABASE_URL and that PostgreSQL is running.';
  }

  const msg = error instanceof Error ? error.message : '';
  if (/P1001|P1017|ECONNREFUSED|ENOTFOUND|connect timed out|Connection refused|DatabaseNotReachable/i.test(msg)) {
    return 'Cannot reach the database. Check DATABASE_URL and that PostgreSQL is running on this host.';
  }

  return fallback;
}

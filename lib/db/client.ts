import { PrismaClient } from "@/lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

if (!process.env.DATABASE_URL) {
  console.warn(
    "[flowforge] DATABASE_URL is not set. The app cannot talk to PostgreSQL until it is defined (see .env.example and DEPLOYMENT.md)."
  );
}

/**
 * One shared Pool per Node process. Session-mode poolers (e.g. Supabase "Session" / PgBouncer)
 * cap concurrent clients at pool_size. PrismaPg({ connectionString }) used node-pg's default
 * max (~10), which easily triggers: "MaxClientsInSessionMode: max clients reached".
 *
 * Tune with DATABASE_POOL_MAX (try 1–3 behind session poolers; slightly higher for direct Postgres).
 */
function createPgPool(): Pool {
  const connectionString = process.env.DATABASE_URL ?? "";
  const max = Math.max(
    1,
    Math.min(50, Number(process.env.DATABASE_POOL_MAX ?? "3"))
  );

  return new Pool({
    connectionString,
    max,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
}

if (!globalForPrisma.pgPool) {
  globalForPrisma.pgPool = createPgPool();
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    adapter: new PrismaPg(globalForPrisma.pgPool),
  });
}

export const prisma = globalForPrisma.prisma;
export const pgPool = globalForPrisma.pgPool;

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Health check: process up; optional DB connectivity for load balancers / k8s probes.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      database: 'up',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        database: 'down',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

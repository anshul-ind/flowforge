import { NextResponse } from 'next/server';

/**
 * Health Check API
 * Returns 200 OK if service is healthy
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

import { NextResponse } from 'next/server';

/**
 * Analytics API
 * Not implemented in Phase-6
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Analytics API not implemented yet' },
    { status: 501 }
  );
}

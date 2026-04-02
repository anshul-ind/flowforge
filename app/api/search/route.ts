import { NextResponse } from 'next/server';

/**
 * Search API
 * Not implemented in Phase-6
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Search API not implemented yet' },
    { status: 501 }
  );
}

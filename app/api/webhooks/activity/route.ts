import { NextResponse } from 'next/server';

/**
 * Activity Webhook API
 * Not implemented in Phase-6
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Activity webhook not implemented yet' },
    { status: 501 }
  );
}

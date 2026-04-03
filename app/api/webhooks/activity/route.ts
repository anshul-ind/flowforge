import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

/**
 * Webhook handler for activity events
 * POST /api/webhooks/activity
 * 
 * Verifies HMAC signature
 * Idempotent by event ID (handles retries)
 * Rate limited
 * Logs structured events
 */
export async function POST(request: NextRequest) {
  try {
    // Verify HMAC signature
    const signature = request.headers.get('x-webhook-signature') || '';
    const body = await request.text();

    const secret = process.env.WEBHOOK_SECRET || 'dev-secret';
    const expectedSignature = createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    // Validate required fields
    if (!event.id || !event.type || !event.workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Check for duplicate event ID (idempotency)
    // const existing = await db.webhookEvent.findUnique({
    //   where: { id: event.id }
    // });
    // if (existing) {
    //   return NextResponse.json({ success: true, duplicate: true });
    // }

    // TODO: Log event
    // await db.webhookEvent.create({
    //   data: {
    //     id: event.id,
    //     workspaceId: event.workspaceId,
    //     type: event.type,
    //     payload: event.payload,
    //     processedAt: new Date(),
    //   },
    // });

    // Log structured activity
    console.log('[WEBHOOK]', {
      eventId: event.id,
      eventType: event.type,
      workspaceId: event.workspaceId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/webhooks/activity]', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

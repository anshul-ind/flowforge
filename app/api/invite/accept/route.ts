import { auth } from '@/auth';
import { acceptInviteByToken } from '@/lib/actions/invite-workflow';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Accept invite (legacy GET flow).
 * Prefers redirect to workspace when session exists; otherwise sends user to sign-in.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      const signIn = new URL('/sign-in', request.url);
      signIn.searchParams.set(
        'callbackUrl',
        `/invite/accept?token=${encodeURIComponent(token)}`
      );
      return NextResponse.redirect(signIn);
    }

    const result = await acceptInviteByToken(token);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.redirect(new URL(result.nextPath, request.url));
  } catch (error) {
    console.error('[GET /api/invite/accept]', error);
    return NextResponse.json(
      { error: 'Failed to accept invite' },
      { status: 500 }
    );
  }
}

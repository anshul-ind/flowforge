import { auth } from '@/auth';
import { acceptInviteByToken } from '@/lib/actions/invite-workflow';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Accept invite (legacy GET flow).
 * Unauthenticated → sign-in with callback. Failure → back to /invite/accept with message (no raw JSON in browsers).
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      const back = new URL('/invite/accept', request.url);
      back.searchParams.set('inviteError', 'Missing invitation token');
      return NextResponse.redirect(back);
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
      const back = new URL('/invite/accept', request.url);
      back.searchParams.set('token', token);
      back.searchParams.set('inviteError', result.error);
      return NextResponse.redirect(back);
    }

    return NextResponse.redirect(new URL(result.nextPath, request.url));
  } catch (error) {
    console.error('[GET /api/invite/accept]', error);
    const back = new URL('/invite/accept', request.url);
    back.searchParams.set('inviteError', 'Failed to accept invitation');
    return NextResponse.redirect(back);
  }
}

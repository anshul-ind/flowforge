import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { createSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return NextResponse.redirect(new URL('/auth/signin?error=missing', request.url))
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin?error=invalid', request.url))
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.redirect(new URL('/auth/signin?error=invalid', request.url))
    }

    const token = await createSession({ userId: user.id, email: user.email, name: user.name })

    const response = NextResponse.redirect(new URL('/tenants', request.url))
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.redirect(new URL('/auth/signin?error=server', request.url))
  }
}

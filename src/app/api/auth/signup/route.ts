import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { createSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!name || !email || !password) {
      return NextResponse.redirect(new URL('/auth/signup?error=missing', request.url))
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.redirect(new URL('/auth/signup?error=exists', request.url))
    }

    const hashed = await hashPassword(password)

    // Create user + personal tenant in a transaction
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        memberships: {
          create: {
            role: 'owner',
            tenant: {
              create: {
                name: `${name}'s Workspace`,
                slug,
              },
            },
          },
        },
      },
    })

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
    console.error('Sign up error:', error)
    return NextResponse.redirect(new URL('/auth/signup?error=server', request.url))
  }
}

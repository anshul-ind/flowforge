import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const homeUrl = new URL('/', request.url)
  const response = NextResponse.redirect(homeUrl)
  response.cookies.delete('session')
  return response
}

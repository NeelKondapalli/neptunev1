import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // If the cookie is being deleted, get the cookie options
          if (!value) {
            const cookie = request.cookies.get(name)
            if (cookie?.value) {
              response.cookies.set({
                name,
                value,
                ...options,
                path: '/',
              })
            }
            return
          }
          response.cookies.set(name, value, { ...options, path: '/' })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            path: '/',
          })
        },
      },
    }
  )

  // This will refresh the session if needed and get the latest user data
  const { data: { session }, error } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // If logged in and trying to access auth routes, redirect to create page
  if (session && pathname.startsWith('/auth')) {
    const redirectUrl = new URL('/create', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If not logged in, only allow access to home and auth routes
  if (!session && !pathname.startsWith('/auth') && pathname !== '/') {
    const redirectUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
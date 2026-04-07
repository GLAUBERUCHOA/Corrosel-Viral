import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Proteger rotas /admin e /curadoria
    if ((path.startsWith('/admin') && path !== '/admin/login') || path.startsWith('/curadoria')) {
        const sessionCookie = request.cookies.get('session');

        if (!sessionCookie || !sessionCookie.value) {
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('callbackUrl', path);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/curadoria/:path*'],
};

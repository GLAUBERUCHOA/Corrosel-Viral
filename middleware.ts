import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Proteger rotas /admin
    if (path.startsWith('/admin') && path !== '/admin/login') {
        const sessionCookie = request.cookies.get('session');

        if (!sessionCookie || !sessionCookie.value) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};

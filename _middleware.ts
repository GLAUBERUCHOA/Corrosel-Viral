import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isProtectedAdminRoute = path.startsWith('/admin') && path !== '/admin/login';

    if (!isProtectedAdminRoute) {
        return NextResponse.next();
    }

    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const payload = await decrypt(sessionCookie);

    if (!payload || !payload.id) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Se passou, está autorizado para as rotas auth
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Proteger rotas do Admin
    if (path.startsWith('/admin') && path !== '/admin/login') {
        const sessionCookie = request.cookies.get('session');
        if (!sessionCookie || !sessionCookie.value) {
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('callbackUrl', path);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Proteger rotas da Curadoria
    if (path.startsWith('/curadoria') && path !== '/curadoria/login') {
        const curadoriaCookie = request.cookies.get('curadoria_session');
        const adminCookie = request.cookies.get('session'); // Admin também pode acessar
        
        if ((!curadoriaCookie || !curadoriaCookie.value) && (!adminCookie || !adminCookie.value)) {
            const loginUrl = new URL('/curadoria/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/curadoria/:path*'],
};

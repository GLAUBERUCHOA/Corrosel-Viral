import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Proteger rotas do Admin
    if (path.startsWith('/admin') && path !== '/admin/login') {
        const sessionCookie = request.cookies.get('session');
        let isValidAdmin = false;

        if (sessionCookie && sessionCookie.value) {
            const payload = await decrypt(sessionCookie.value);
            if (payload && payload.role === 'ADMIN') {
                isValidAdmin = true;
            }
        }

        if (!isValidAdmin) {
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('callbackUrl', path);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Proteger rotas da Curadoria
    if (path.startsWith('/curadoria') && path !== '/curadoria/login') {
        const curadoriaCookie = request.cookies.get('curadoria_session');
        const adminCookie = request.cookies.get('session'); // Admin também pode acessar
        
        let isValidCuradoria = false;

        if (curadoriaCookie && curadoriaCookie.value) {
            const payload = await decrypt(curadoriaCookie.value);
            if (payload && payload.role === 'CURADORIA') {
                isValidCuradoria = true;
            }
        }

        if (adminCookie && adminCookie.value) {
            const payload = await decrypt(adminCookie.value);
            if (payload && payload.role === 'ADMIN') {
                isValidCuradoria = true;
            }
        }

        if (!isValidCuradoria) {
            const loginUrl = new URL('/curadoria/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/curadoria/:path*'],
};

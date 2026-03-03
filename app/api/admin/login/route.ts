import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        const ALLOWED_EMAIL = 'drglauberabreu@gmail.com';

        if (email.toLowerCase() !== ALLOWED_EMAIL) {
            return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
        }

        let user = await prisma.user.findUnique({
            where: { email: ALLOWED_EMAIL },
        });

        if (!user) {
            // Se ainda não existir, cria-se automaticamente como admin para que tenha acesso total
            const hashedPassword = await bcrypt.hash('admin123', 10);
            user = await prisma.user.create({
                data: {
                    email: ALLOWED_EMAIL,
                    name: 'Glauber Uchoa',
                    password: hashedPassword,
                    role: 'ADMIN',
                }
            });
        }

        // Criar sessÃ£o JWT
        const session = await encrypt({ id: user.id, email: user.email, role: user.role });

        (await cookies()).set('session', session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Erro interno ao tentar fazer login.' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: cleanEmail },
        });

        // Verifica se usuário existe e se está ativo
        if (!user || user.status !== 'ativo') {
            return NextResponse.json({ error: 'Conta não encontrada ou inativa.' }, { status: 403 });
        }

        // Verifica se a senha confere
        if (!user.password) {
             return NextResponse.json({ error: 'Sua conta ainda não tem senha configurada. Acesse o LAB principal primeiro.' }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
        }

        // Verifica se o usuário tem a permissão comprada do Order Bump
        // Para administradores (seu email), o acesso é livre
        if (!user.hasCuradoriaAccess && user.role !== 'ADMIN') {
            return NextResponse.json({ 
                error: 'Você não tem acesso à Curadoria. Adquira o Order Bump para liberar este painel.' 
            }, { status: 403 });
        }

        // Criar sessão segura
        const sessionPayload = { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            curadoria: true 
        };
        const sessionValue = await encrypt(sessionPayload);

        // Retornar o token via Cookie HTTPOnly
        (await cookies()).set('curadoria_session', sessionValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/', // Path raiz para o cookie ser lido na rota /curadoria
            maxAge: 60 * 60 * 24 * 7, // 7 dias logado
        });

        return NextResponse.json({ 
            success: true, 
            user: { email: user.email, role: user.role } 
        });
    } catch (error) {
        console.error('Curadoria Login err:', error);
        return NextResponse.json({ error: 'Erro interno ao validar acesso.' }, { status: 500 });
    }
}

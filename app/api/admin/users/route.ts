import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { getSession } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        const jwtSecret = process.env.JWT_SECRET;
        if (!convexUrl || !jwtSecret) {
            return NextResponse.json({ error: 'Configuração do servidor ausente.' }, { status: 500 });
        }

        const convex = new ConvexHttpClient(convexUrl);
        const rawUsers = await convex.query(api.users.listUsers, { secret: jwtSecret });
        
        // Map Convex fields to match expected frontend user structure
        const users = rawUsers.map((u: any) => ({
            id: u._id,
            name: u.name || '',
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
        }));

        return NextResponse.json({ success: true, users });
    } catch (error) {
        console.error('Error in GET admin users:', error);
        return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const { name, email, password, role } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
        }

        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        const jwtSecret = process.env.JWT_SECRET;
        if (!convexUrl || !jwtSecret) {
            return NextResponse.json({ error: 'Configuração do servidor ausente.' }, { status: 500 });
        }

        const convex = new ConvexHttpClient(convexUrl);
        
        const existingUser = await convex.query(api.users.getUserByEmail, {
            email: email,
            secret: jwtSecret,
        });

        if (existingUser) {
            return NextResponse.json({ error: 'E-mail já está em uso.' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Somente este e-mail pode ser ADMIN. Todo o resto é USER.
        const MASTER_ADMIN = 'drglauberabreu@gmail.com';
        const finalRole = email.toLowerCase() === MASTER_ADMIN ? 'ADMIN' : 'USER';

        const user = await convex.mutation(api.users.createUser, {
            name,
            email,
            password: hashedPassword,
            role: finalRole,
            status: 'ativo',
            isVerified: true, // Auto-verify manually created users so they don't get stuck in OTP loop
            secret: jwtSecret,
        });

        return NextResponse.json({ 
            success: true, 
            user: { 
                id: user._id, 
                name: user.name || '', 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (error: any) {
        console.error('Error in POST admin users:', error);
        return NextResponse.json({ error: error.message || 'Erro ao criar usuário.' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const { id, name, email, password } = await request.json();

        if (!id || !name || !email) {
            return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
        }

        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        const jwtSecret = process.env.JWT_SECRET;
        if (!convexUrl || !jwtSecret) {
            return NextResponse.json({ error: 'Configuração do servidor ausente.' }, { status: 500 });
        }

        const convex = new ConvexHttpClient(convexUrl);

        // Somente este e-mail pode ser ADMIN. Todo o resto é USER.
        const MASTER_ADMIN = 'drglauberabreu@gmail.com';
        const finalRole = email.toLowerCase() === MASTER_ADMIN ? 'ADMIN' : 'USER';

        const dataToUpdate: any = { 
            id,
            name, 
            email, 
            role: finalRole,
            secret: jwtSecret 
        };

        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
            dataToUpdate.isVerified = true; // Auto-verify so the user doesn't get stuck in OTP loop
        }

        const user = await convex.mutation(api.users.updateUser, dataToUpdate);

        return NextResponse.json({ 
            success: true, 
            user: { 
                id: user._id, 
                name: user.name || '', 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (error: any) {
        console.error('Error in PUT admin users:', error);
        return NextResponse.json({ error: error.message || 'Erro ao atualizar usuário.' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID não fornecido.' }, { status: 400 });
        }

        if (id === session.id) {
            return NextResponse.json({ error: 'Você não pode excluir sua própria conta enquanto estiver logado.' }, { status: 400 });
        }

        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        const jwtSecret = process.env.JWT_SECRET;
        if (!convexUrl || !jwtSecret) {
            return NextResponse.json({ error: 'Configuração do servidor ausente.' }, { status: 500 });
        }

        const convex = new ConvexHttpClient(convexUrl);
        await convex.mutation(api.users.deleteUser, {
            id: id as any,
            secret: jwtSecret,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in DELETE admin users:', error);
        return NextResponse.json({ error: error.message || 'Erro ao deletar usuário.' }, { status: 500 });
    }
}

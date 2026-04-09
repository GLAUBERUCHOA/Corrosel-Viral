import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'NÃ£o autorizado.' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, users });
    } catch (error) {
        return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'NÃ£o autorizado.' }, { status: 401 });
        }

        const { name, email, password, role } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'E-mail jÃ¡ estÃ¡ em uso.' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'ADMIN',
                isVerified: true, // Auto-verify manually created users so they don't get stuck in OTP loop
            },
            select: { id: true, name: true, email: true, role: true }
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao criar usuÃ¡rio.' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'NÃ£o autorizado.' }, { status: 401 });
        }

        const { id, name, email, password, role } = await request.json();

        if (!id || !name || !email) {
            return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
        }

        const dataToUpdate: any = { name, email, role };

        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
            dataToUpdate.isVerified = true; // Auto-verify so the user doesn't get stuck in OTP loop
        }

        const user = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: { id: true, name: true, email: true, role: true }
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar usuÃ¡rio.' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'NÃ£o autorizado.' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID nÃ£o fornecido.' }, { status: 400 });
        }

        if (id === session.id) {
            return NextResponse.json({ error: 'VocÃª nÃ£o pode excluir sua prÃ³pria conta enquanto estiver logado.' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao deletar usuÃ¡rio.' }, { status: 500 });
    }
}

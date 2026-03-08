import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'NÃ£o autorizado.' }, { status: 401 });
        }

        const { prompts } = await request.json();

        if (!Array.isArray(prompts)) {
            return NextResponse.json({ error: 'Dados invÃ¡lidos.' }, { status: 400 });
        }

        for (const p of prompts) {
            await prisma.promptSetting.update({
                where: { id: p.id },
                data: {
                    instruction: p.instruction,
                    label: p.label
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const prompts = await prisma.promptSetting.findMany({
            orderBy: { toneKey: 'asc' },
        });

        // Sincronização automática para garantir que o nome seja atualizado no banco online
        for (const p of prompts) {
            if (p.toneKey === 'STORYTELLING' && p.label.includes('Jornada Histórica')) {
                await prisma.promptSetting.update({
                    where: { id: p.id },
                    data: { label: '📖 Storytelling (Jornada do Herói)' }
                });
                p.label = '📖 Storytelling (Jornada do Herói)';
            }
        }

        return NextResponse.json({ success: true, prompts });
    } catch (error) {
        console.error('Fetch settings error:', error);
        return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
    }
}

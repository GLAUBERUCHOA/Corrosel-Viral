import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

// Helper for auth check
async function requireAuth() {
    const session = await getSession();
    if (!session) {
        throw new Error('Unauthorized');
    }
}

export async function GET() {
    try {
        await requireAuth();
        let settings = await prisma.imagePromptSetting.findMany({
            orderBy: { nicheKey: 'asc' }
        });

        if (settings.length === 0) {
            // Seed defaults
            await prisma.imagePromptSetting.createMany({
                data: [
                    {
                        nicheKey: 'GLOBAL_IMAGE',
                        label: 'Instruções Gerais (Imagens)',
                        instruction: '🎨 1. PADRÃO ESTÉTICO OBRIGATÓRIO:\nVocê opera sempre no estilo "Theatrical Dark Cinematic" (Cinematográfico Escuro e Teatral) com foco em Chiaroscuro (contraste dramático) e efeito Bokeh (fundo elegantemente distorcido).\n\n📸 2. REGRAS DE DIREÇÃO DE ARTE:\n- Ângulos: Evite sempre visões padrão (eye-level). Alterne entre Low Angle (de baixo pra cima, denota poder/imposição), High Angle (vulnerabilidade), Over-the-shoulder e Close-ups detalhados.\n- Iluminação: Luzes de recorte dramáticas, sombras marcadas. Iluminação lateral misteriosa.\n- Metáforas: NUNCA crie interpretações literais e óbvias do texto. Se o texto for sobre "ganhar dinheiro", NÃO crie de pessoas segurando dinheiro ou cifrões. Crie algo como: "A close-up of a sleek black mechanical watch with gold gears turning amidst dark smoke".\n\n🧠 3. COMPOSIÇÃO:\n- Cores: Paleta Industrial e Terrosa (Preto, chumbo, ouro envelhecido, cobre escuro, verde musgo).\n- Sempre inclua: "High end, 8k resolution, raw photo, highly detailed, sharp focus" no final do seu prompt.',
                        isDeletable: false,
                    },
                    {
                        nicheKey: 'SAUDE',
                        label: 'Saúde & Nutrição',
                        instruction: 'Crie imagens focadas em transformar elementos de saúde (frutas escuras, stetoscópios sombrios, anatomia clássica) em obras de arte cinematográficas. Evite rostos sorridentes, foque em texturas e close-ups.',
                        isDeletable: true,
                    },
                    {
                        nicheKey: 'MINDSET',
                        label: 'Mindset & Psicologia',
                        instruction: 'Use metáforas visuais de profundidade psicológica: espelhos quebrados, xadrez, labirintos, nevoeiro. Mantenha o tom escuro e intelectual.',
                        isDeletable: true,
                    }
                ]
            });
            settings = await prisma.imagePromptSetting.findMany({
                orderBy: { nicheKey: 'asc' }
            });
        }

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await requireAuth();
        const body = await req.json();
        const { settings } = body;

        if (!Array.isArray(settings)) {
            return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
        }

        // We use a transaction to update existing or create new ones
        await prisma.$transaction(
            settings.map((s: { id?: string, nicheKey: string, label: string, instruction: string, isDeletable?: boolean }) => {
                if (s.id && !s.id.startsWith('new_')) {
                    // Update existing
                    return prisma.imagePromptSetting.update({
                        where: { id: s.id },
                        data: {
                            label: s.label,
                            instruction: s.instruction,
                            nicheKey: s.nicheKey,
                        }
                    });
                } else {
                    // Create new
                    return prisma.imagePromptSetting.create({
                        data: {
                            nicheKey: s.nicheKey,
                            label: s.label,
                            instruction: s.instruction,
                            isDeletable: s.isDeletable !== undefined ? s.isDeletable : true
                        }
                    });
                }
            })
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await requireAuth();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const settingPath = await prisma.imagePromptSetting.findUnique({ where: { id } });
        if (!settingPath) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (!settingPath.isDeletable) {
            return NextResponse.json({ error: 'Cannot delete fixed settings' }, { status: 400 });
        }

        await prisma.imagePromptSetting.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
    }
}

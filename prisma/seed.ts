import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@carrosselviral.com' },
        update: {},
        create: {
            email: 'admin@carrosselviral.com',
            name: 'Admin Master',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log({ admin });

    // Criar os prompts padrões iniciais para Iury se não existirem
    const prompts = [
        {
            toneKey: 'PROVOCATIVO',
            label: '🥊 Provocativo (Quebra de Padrão e Ego)',
            instruction: 'Modo PROVOCATIVO (O Soco no Estômago): Focado em quebrar o ego, expor o erro e gerar desconforto. Seu tom é irônico, inteligente e instigador. Ideal para criar identificação extrema pela dor (topo de funil).'
        },
        {
            toneKey: 'ANALITICO',
            label: '🧊 Analítico (Autoridade Fria e Dados)',
            instruction: 'Modo ANALÍTICO (A Autoridade Fria): Focado em causa e efeito, lógica e "dissecação clínica". Não tente ser engraçadinho, seja a autoridade inquestionável que usa dados, ciência ou leis com precisão letal.'
        },
        {
            toneKey: 'STORYTELLING',
            label: '📖 Storytelling (Jornada Histórica)',
            instruction: 'Modo STORYTELLING (A Jornada do Herói): Focado emocionalmente na narrativa. Utilize um fato histórico, um conto, uma biografia marcante ou um mito como fio condutor da lição. Envolva o leitor no drama e ensine a moral depois.'
        },
        {
            toneKey: 'PRATICO',
            label: '✅ Prático (Manual e Ação Imediata)',
            instruction: 'Modo PRÁTICO (O Manual de Campo): Direto ao ponto e utilitário. Sem rodeios emocionais, com foco brutal no "faça isso, não aquilo", forneça métodos mastigados, checklists mentais rápidos e planos de ação.'
        }
    ];

    for (const prompt of prompts) {
        await prisma.promptSetting.upsert({
            where: { toneKey: prompt.toneKey },
            update: {},
            create: prompt,
        });
    }

    console.log('Seed completed.');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

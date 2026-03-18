import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gerarIdeias } from '@/services/geradorCarrossel';

export const maxDuration = 60;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    if (action === 'limpar') {
      const { count } = await prisma.autoCarrossel.deleteMany({
        where: { status: 'pendente' }
      });
      return NextResponse.json({ success: true, count, message: 'Itens pendentes removidos' });
    }

    if (action === 'gerar_um') {
      try {
        // Randomiza entre notícias e perene para manter a variedade
        const tipo = Math.random() > 0.5 ? 'noticias' : 'perene';
        const resultado = await gerarIdeias(tipo, []);

        if (resultado.success) {
          const novoPost = await prisma.autoCarrossel.create({
            data: {
              user_id: 1,
              conteudo: JSON.stringify(resultado.carrossel),
              status: 'pendente'
            }
          });

          return NextResponse.json({ 
            success: true, 
            message: '1 post gerado com sucesso!',
            post: novoPost
          });
        } else {
          return NextResponse.json({ success: false, error: resultado.error });
        }
      } catch (error) {
        console.error('Erro na geração avulsa:', error);
        return NextResponse.json({ success: false, error: 'Erro ao gerar o post.' });
      }
    }

    return NextResponse.json({ error: 'Ação indefinida' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno', details: String(error) }, { status: 500 });
  }
}

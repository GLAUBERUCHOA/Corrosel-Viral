import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gerarIdeias } from '@/services/geradorCarrossel';

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

    if (action === 'gerar_lote') {
      const geradosNestaRodada: string[] = [];
      const resultadosSucedidos = [];
      const logsErro = [];

      for (let i = 1; i <= 10; i++) {
        const tipo = (i % 2 !== 0) ? 'noticias' : 'perene';
        const resultado = await gerarIdeias(tipo, geradosNestaRodada);

        if (resultado.success) {
          try {
            const novoPost = await prisma.autoCarrossel.create({
              data: {
                user_id: 1,
                conteudo: JSON.stringify(resultado.carrossel),
                status: 'pendente'
              }
            });

            if (resultado.pauta) geradosNestaRodada.push(resultado.pauta);
            resultadosSucedidos.push(novoPost.id);
          } catch (dbError) {
            logsErro.push({ index: i, error: 'Database Error', details: String(dbError) });
          }
        } else {
          logsErro.push({ index: i, error: 'Service Error', details: resultado.error });
        }

        if (i < 10) await sleep(12000);
      }

      return NextResponse.json({ 
        success: true, 
        message: `${resultadosSucedidos.length} carrosséis gerados.`,
        erros: logsErro
      });
    }

    return NextResponse.json({ error: 'Ação indefinida' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno', details: String(error) }, { status: 500 });
  }
}

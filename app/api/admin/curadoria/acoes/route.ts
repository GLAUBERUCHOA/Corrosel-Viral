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
      // Execução assíncrona em segundo plano para evitar timeout do navegador/Vercel
      const iniciarGeracaoEmLote = async () => {
        const geradosNestaRodada: string[] = [];
        
        for (let i = 1; i <= 10; i++) {
          try {
            const tipo = (i % 2 !== 0) ? 'noticias' : 'perene';
            const resultado = await gerarIdeias(tipo, geradosNestaRodada);

            if (resultado.success) {
              await prisma.autoCarrossel.create({
                data: {
                  user_id: 1,
                  conteudo: JSON.stringify(resultado.carrossel),
                  status: 'pendente'
                }
              });

              if (resultado.pauta) geradosNestaRodada.push(resultado.pauta);
            } else {
              console.error(`Erro ao gerar post ${i}:`, resultado.error);
            }
          } catch (error) {
            console.error(`Erro fatal no loop ${i}:`, error);
          }

          if (i < 10) await sleep(15000); // 15 segundos de intervalo para não estourar rate limit da API
        }
      };

      // Dispara a promise sem await para deixar rodando em background
      iniciarGeracaoEmLote().catch(err => console.error("Falha no processo em lote:", err));

      return NextResponse.json({ 
        success: true, 
        message: 'Processamento iniciado! Os posts aparecerão na lista em instantes.'
      });
    }

    return NextResponse.json({ error: 'Ação indefinida' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno', details: String(error) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { gerarIdeias } from '@/services/geradorCarrossel';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

// Função de sleep para o Delay de 15 segundos entre cada posts.
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: Request) {
  try {
    // 1. Validar autenticação via CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    console.log('--- INICIANDO PRODUÇÃO EM LOTE (10 POSTS) ---');
    const geradosNestaRodada: string[] = [];
    const resultadosSucedidos = [];
    const logsErro = [];

    // O loop gera 10 posts, alternando entre notícias (ímpares) e perenes (pares).
    for (let i = 1; i <= 10; i++) {
      const tipo = (i % 2 !== 0) ? 'noticias' : 'perene';
      console.log(`\n=> Gerando Post ${i} de 10 (Modo: ${tipo})...`);
      
      try {
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

            if (resultado.pauta) {
              geradosNestaRodada.push(resultado.pauta);
            }
            resultadosSucedidos.push(novoPost.id);
            console.log(`   [SUCESSO] Post ${i} salvo no banco com ID ${novoPost.id}`);
          } catch (dbError) {
            logsErro.push({ index: i, error: 'Database Error', details: String(dbError) });
            console.error(`   [ERRO DB] Post ${i}:`, dbError);
          }
        } else {
          logsErro.push({ index: i, error: 'Service Error', details: resultado.error });
          console.error(`   [ERRO] Falha no Post ${i}: ${resultado.error}`);
        }
      } catch (loopError) {
        logsErro.push({ index: i, error: 'Generation Error', details: String(loopError) });
        console.error(`   [ERRO FATAL] Falha não tratada ao gerar Post ${i}:`, loopError);
      }

      if (i < 10) await sleep(5000); // Reduzi levemente o sleep para tentar caber melhor no timeout
    }

    return NextResponse.json({ 
      success: true, 
      message: `${resultadosSucedidos.length} carrosséis gerados.`,
      ids: resultadosSucedidos,
      erros: logsErro
    }, { status: 200 });

  } catch (error) {
    console.error('[CRON ERROR] Crítico na rota de geração em lote:', error);
    return NextResponse.json({ error: 'Erro interno no lote.', details: String(error) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { gerarIdeias } from '@/services/geradorCarrossel';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // 2. Mock de Usuário via .env
    const nicho = process.env.USER_NICHE || 'Marketing Digital';
    const tom = process.env.USER_TONE || 'Autoridade, Direto, Persuasivo';

    console.log('--- INICIANDO PRODUÇÃO EM LOTE (10 POSTS) ---');
    const geradosNestaRodada: string[] = [];
    const resultadosSucedidos = [];

    for (let i = 1; i <= 10; i++) {
      console.log(`\n=> Gerando Post ${i} de 10...`);
      
      // Chamar a Service (Fluxo Agente 1 -> Agente 2)
      const resultado = await gerarIdeias(nicho, tom, geradosNestaRodada);

      if (resultado.success) {
        // Salvar no Banco (Hostinger)
        const novoPost = await prisma.autoCarrossel.create({
          data: {
            user_id: 1,
            conteudo: JSON.stringify(resultado.carrossel),
            status: 'pendente'
          }
        });

        geradosNestaRodada.push(resultado.pauta);
        resultadosSucedidos.push(novoPost.id);
        console.log(`   [SUCESSO] Post ${i} salvo no banco com ID ${novoPost.id}`);
      } else {
        console.error(`   [ERRO] Falha no Post ${i}: ${resultado.error}`);
      }

      // Adicionar delay de 15 segundos entre gerações (exceto no último)
      if (i < 10) {
        console.log(`   Aguardando 15s (Rate Limit Prevention)...`);
        await sleep(15000);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${resultadosSucedidos.length} carrosséis gerados e salvos em lote.`,
      ids: resultadosSucedidos 
    }, { status: 200 });

  } catch (error) {
    console.error('[CRON ERROR] Crítico na rota de geração em lote:', error);
    return NextResponse.json({ error: 'Erro interno no lote.', details: String(error) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { gerarIdeias } from '@/services/geradorCarrossel';
import { prisma } from '@/lib/prisma'; // Assumindo que o prisma client exporta singleton daqui

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // 1. Validar autenticação via CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { error: 'Não autorizado.' },
        { status: 401 }
      );
    }

    // 2. Mock de Usuário via .env
    const nicho = process.env.USER_NICHE;
    const tom = process.env.USER_TONE;

    if (!nicho || !tom) {
      return NextResponse.json(
        { error: 'Variáveis de ambiente USER_NICHE e USER_TONE ausentes.' },
        { status: 500 }
      );
    }

    // 3. Chamar a Service Isolada
    const resultado = await gerarIdeias(nicho, tom);

    if (!resultado.success) {
      return NextResponse.json(
        { error: 'Falha na geração das ideias.', details: resultado.error },
        { status: 500 }
      );
    }

    // 4. Salvar resultado no Banco
    // Se o prisma não estiver acessível, podemos omitir essa parte e voltar ao SQL puro,
    // Mas vamos tentar salvar o resultado da geração:
    const novoAutoCarrossel = await prisma.autoCarrossel.create({
      data: {
        user_id: 1, // Fixado como solicitado
        conteudo: JSON.stringify(resultado.carrossel), // Armazenando a estrutura JSON de slides
        status: 'pendente'
      }
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Carrossel gerado e salvo com sucesso.', 
        data: novoAutoCarrossel 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CRON] Erro ao gerar carrossel:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

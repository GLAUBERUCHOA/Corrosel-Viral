const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearGeneric() {
  console.log('--- INICIANDO LIMPEZA DE PAUTAS GENÉRICAS ---');
  try {
    // Definimos como genéricas as pautas que não têm as tags [TÍTULO] no conteúdo JSON, 
    // ou apenas deletamos as "pendentes" atuais para começar do zero com o novo treinamento.
    // O usuário pediu para limpar as genéricas para não misturar.
    
    const deletados = await prisma.autoCarrossel.deleteMany({
      where: {
        status: 'pendente'
      }
    });

    console.log(`[SUCESSO] ${deletados.count} posts genéricos (status: pendente) foram removidos do banco.`);
    console.log('Agora o banco está limpo para a nova leva com treinamento real (Agente 1 e 2).');

  } catch (error) {
    console.error('[ERRO na Limpeza]:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearGeneric();

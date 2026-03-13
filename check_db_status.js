const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.autoCarrossel.count({
      where: { status: 'pendente' }
    });
    console.log(`Pendente carousels in DB: ${count}`);
    
    const last = await prisma.autoCarrossel.findFirst({
        orderBy: { criado_em: 'desc' }
    });
    
    if (last) {
        console.log(`Last created: ${last.criado_em} with status ${last.status}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();

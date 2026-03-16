import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();
async function main() {
  const last = await prisma.autoCarrossel.findFirst({ orderBy: { id: 'desc' } });
  fs.writeFileSync('output.json', JSON.stringify(last?.conteudo, null, 2));
}
main().finally(() => prisma.$disconnect());

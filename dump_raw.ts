import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.promptSetting.findUnique({
    where: { toneKey: 'SQUAD_CONFIG' }
  });
  if (setting) {
    fs.writeFileSync('raw_instruction.txt', setting.instruction, 'utf8');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

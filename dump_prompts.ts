import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.promptSetting.findUnique({
    where: { toneKey: 'SQUAD_CONFIG' }
  });
  console.log(JSON.stringify(setting, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

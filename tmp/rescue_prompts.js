const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log("Procurando instruções completas antigas no banco MySQL...");
  const oldConfig = await prisma.promptSetting.findUnique({
    where: { toneKey: 'SQUAD_CONFIG' }
  });

  if (oldConfig && oldConfig.instruction) {
    fs.writeFileSync('tmp/recovered_prompts.json', oldConfig.instruction);
    console.log("✅ Prompts mágicos encontrados e salvos em tmp/recovered_prompts.json!");
  } else {
    console.log("⚠️ Nenhuma instrução gigante encontrada no Prisma.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

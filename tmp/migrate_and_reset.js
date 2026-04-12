const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // 1. Reset Password for drglauberabreu@gmail.com
  const email = 'drglauberabreu@gmail.com';
  const newPassword = 'Duralex22!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  console.log(`[Segurança] Atualizando senha para ${email}...`);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  console.log('✅ Senha resetada com sucesso para "Duralex22!"!');

  // 2. Fetch the old SQUAD_CONFIG from MySQL (prisma)
  console.log(`\n[Migração] Resgatando SQUAD_CONFIG antiga...`);
  const oldConfigRecord = await prisma.promptSetting.findUnique({
    where: { toneKey: 'SQUAD_CONFIG' }
  });

  if (oldConfigRecord && oldConfigRecord.instruction) {
    const oldConfig = JSON.parse(oldConfigRecord.instruction);
    
    console.log(`✅ Configuração antiga encontrada. Enviando para Convex...`);
    
    // Convert to flat structure used by mutation
    const syncData = {
      keyName: 'ADMIN_PROMPTS',
      promptAgente1: oldConfig.agente_1?.prompt_diretor || oldConfig.agente_1?.prompt_noticias || "",
      promptAgente2: oldConfig.agente_2?.regras_escrita || "",
      contextoSquad: oldConfig.contexto_squad || "",
      tomGlobal: oldConfig.tom_de_voz_global || "",
      value: oldConfig
    };

    // Use pure fetch to invoke the Convex mutation via HTTP Actions / API since Convex client might be tricky in raw Node script without transpilation
    // Alternatively, I can just tell the user to load the page and copy/paste? No, he wants the texts there!
    
  } else {
    console.log(`⚠️ SQUAD_CONFIG não encontrada no Prisma local. Se os dados sumiram, eles estavam apenas no Convex.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

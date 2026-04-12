const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'drglauberabreu@gmail.com';
  const newPassword = 'Duralex22!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  console.log(`Atualizando senha para ${email}...`);
  
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });

  console.log('✅ Senha resetada com sucesso!');
  console.log(`Nova senha: ${newPassword}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

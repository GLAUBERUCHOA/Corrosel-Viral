import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log("All Users:");
    console.log(users);

    const inativoUsers = users.filter((u: any) => u.status === 'inativo');
    console.log("Inativo Users:");
    console.log(inativoUsers);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const settings = await prisma.imagePromptSetting.findMany();
    console.log(settings);
}
main().finally(() => prisma.$disconnect());

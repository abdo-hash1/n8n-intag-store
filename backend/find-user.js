const { PrismaClient } = require('@prisma/client');

async function findUser() {
    const prisma = new PrismaClient();
    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: 'abdo' } },
                    { fullName: { contains: 'abdo' } },
                    { fullName: { contains: 'Abdo' } },
                ]
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true,
            }
        });
        console.log('Users found:');
        console.log(JSON.stringify(users, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

findUser();

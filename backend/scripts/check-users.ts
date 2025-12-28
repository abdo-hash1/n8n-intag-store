import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Get all users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            status: true,
            role: true,
            emailVerified: true,
        }
    });

    console.log('Current users:');
    console.log(JSON.stringify(users, null, 2));

    // Fix admin users - set status to active
    const adminEmails = ['abdo@n8nsaas.com', 'admin@n8nsaas.com'];

    for (const email of adminEmails) {
        const result = await prisma.user.updateMany({
            where: { email },
            data: { status: 'active' }
        });
        console.log(`Updated ${email}: ${result.count} rows affected`);
    }

    // Show updated users
    const updatedUsers = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            status: true,
            role: true,
        }
    });

    console.log('\nUpdated users:');
    console.log(JSON.stringify(updatedUsers, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

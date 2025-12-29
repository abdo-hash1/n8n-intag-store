/**
 * Password Reset Script
 * Usage: node reset-password.js <email> [new-password]
 * 
 * Examples:
 *   node reset-password.js abdo@n8nsaas.com
 *   node reset-password.js abdo@n8nsaas.com MyNewPassword123!
 * 
 * If no password is provided, defaults to: Admin123!
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const DEFAULT_PASSWORD = 'Admin123!';
const SALT_ROUNDS = 12;

async function resetPassword() {
    const email = process.argv[2];
    const newPassword = process.argv[3] || DEFAULT_PASSWORD;

    if (!email) {
        console.log('\n❌ Error: Email is required\n');
        console.log('Usage: node reset-password.js <email> [new-password]\n');
        console.log('Examples:');
        console.log('  node reset-password.js abdo@n8nsaas.com');
        console.log('  node reset-password.js abdo@n8nsaas.com MyNewPassword123!\n');
        process.exit(1);
    }

    const prisma = new PrismaClient();

    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, fullName: true, role: true }
        });

        if (!user) {
            console.log(`\n❌ User not found: ${email}\n`);

            // List all users
            const allUsers = await prisma.user.findMany({
                select: { email: true, fullName: true, role: true }
            });

            console.log('Available users:');
            allUsers.forEach(u => {
                console.log(`  - ${u.email} (${u.fullName}) [${u.role}]`);
            });
            console.log('');
            process.exit(1);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        console.log('\n✅ Password Reset Successful!\n');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║                     LOGIN CREDENTIALS                        ║');
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║  Email:    ${email.padEnd(48)}║`);
        console.log(`║  Password: ${newPassword.padEnd(48)}║`);
        console.log(`║  Role:     ${user.role.padEnd(48)}║`);
        console.log('╚══════════════════════════════════════════════════════════════╝\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message, '\n');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();

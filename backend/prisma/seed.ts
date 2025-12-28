/**
 * Database Seed Script
 * Creates initial data for development
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@123456', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@n8nsaas.com' },
        update: {},
        create: {
            email: 'admin@n8nsaas.com',
            password: adminPassword,
            fullName: 'System Administrator',
            phone: '+201234567890',
            role: 'super_admin',
            status: 'active',
        },
    });
    console.log('✓ Admin user created:', admin.email);

    // Create test user
    const userPassword = await bcrypt.hash('User@123456', 12);
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            password: userPassword,
            fullName: 'Test User',
            phone: '+201098765432',
            role: 'user',
            status: 'active',
        },
    });
    console.log('✓ Test user created:', user.email);

    // Create system settings
    const settings = [
        { key: 'monthly_price', value: JSON.stringify(400) },
        { key: 'annual_price', value: JSON.stringify(3800) },
        { key: 'currency', value: JSON.stringify('EGP') },
        { key: 'refund_period_days', value: JSON.stringify(7) },
        { key: 'grace_period_days', value: JSON.stringify(7) },
        { key: 'data_retention_days', value: JSON.stringify(30) },
        { key: 'free_trial_enabled', value: JSON.stringify(false) },
        { key: 'pause_enabled', value: JSON.stringify(true) },
        { key: 'refunds_enabled', value: JSON.stringify(true) },
        { key: 'maintenance_mode', value: JSON.stringify(false) },
    ];

    for (const setting of settings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: {
                key: setting.key,
                value: setting.value,
            },
        });
    }
    console.log('✓ System settings created');

    // Log seed completion
    await prisma.activityLog.create({
        data: {
            userId: admin.id,
            action: 'database_seeded',
            details: JSON.stringify({
                timestamp: new Date().toISOString(),
                usersCreated: 2,
                settingsCreated: settings.length,
            }),
        },
    });
    console.log('✓ Seed activity logged');

    console.log('\n✅ Database seed completed successfully!\n');
    console.log('Test Credentials:');
    console.log('────────────────────────────────────');
    console.log('Admin: admin@n8nsaas.com / Admin@123456');
    console.log('User:  test@example.com / User@123456');
    console.log('────────────────────────────────────\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

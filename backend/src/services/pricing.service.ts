/**
 * Pricing Service
 * Handles dynamic subscription pricing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default prices if not configured in database
const DEFAULT_PRICES = {
    monthly: {
        price: 400,
        displayName: 'الاشتراك الشهري',
        description: 'فوترة شهرية مرنة',
        features: [
            'n8n كامل بدون قيود',
            'دعم فني على مدار الساعة',
            'إلغاء في أي وقت',
            '+400 تكامل جاهز'
        ]
    },
    yearly: {
        price: 3800,
        displayName: 'الاشتراك السنوي',
        description: 'وفر 20% مع الدفع السنوي',
        features: [
            'جميع مميزات الشهري',
            'أولوية في الدعم الفني',
            'ضمان استرداد 30 يوم',
            'توفير شهرين مجاناً'
        ]
    }
};

class PricingService {
    /**
     * Get pricing for a plan
     */
    async getPlanPrice(planType: 'monthly' | 'yearly') {
        // Try to get from database first
        const config = await prisma.pricingConfig.findUnique({
            where: { planType }
        });

        if (config && config.isActive) {
            return {
                planType,
                price: config.price,
                currency: config.currency,
                displayName: config.displayName,
                description: config.description,
                features: JSON.parse(config.features)
            };
        }

        // Fall back to defaults
        const defaults = DEFAULT_PRICES[planType];
        return {
            planType,
            price: defaults.price,
            currency: 'EGP',
            displayName: defaults.displayName,
            description: defaults.description,
            features: defaults.features
        };
    }

    /**
     * Get all pricing plans
     */
    async getAllPlans() {
        const [monthlyPlan, yearlyPlan] = await Promise.all([
            this.getPlanPrice('monthly'),
            this.getPlanPrice('yearly')
        ]);

        return {
            monthly: monthlyPlan,
            yearly: yearlyPlan
        };
    }

    /**
     * Update plan pricing (admin)
     */
    async updatePlanPrice(
        planType: 'monthly' | 'yearly',
        data: {
            price?: number;
            displayName?: string;
            description?: string;
            features?: string[];
            isActive?: boolean;
        }
    ) {
        const updateData: any = {};

        if (data.price !== undefined) updateData.price = data.price;
        if (data.displayName !== undefined) updateData.displayName = data.displayName;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.features !== undefined) updateData.features = JSON.stringify(data.features);
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        // Upsert - create if doesn't exist, update if does
        const defaults = DEFAULT_PRICES[planType];

        return prisma.pricingConfig.upsert({
            where: { planType },
            update: updateData,
            create: {
                planType,
                price: data.price ?? defaults.price,
                displayName: data.displayName ?? defaults.displayName,
                description: data.description ?? defaults.description,
                features: data.features ? JSON.stringify(data.features) : JSON.stringify(defaults.features),
                isActive: data.isActive ?? true
            }
        });
    }

    /**
     * Initialize default pricing configs
     */
    async initializeDefaultPricing() {
        for (const [planType, defaults] of Object.entries(DEFAULT_PRICES)) {
            await prisma.pricingConfig.upsert({
                where: { planType },
                update: {},  // Don't update if exists
                create: {
                    planType,
                    price: defaults.price,
                    displayName: defaults.displayName,
                    description: defaults.description,
                    features: JSON.stringify(defaults.features)
                }
            });
        }
    }
}

export const pricingService = new PricingService();

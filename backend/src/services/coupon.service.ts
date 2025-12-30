/**
 * Coupon Service
 * Handles coupon validation, application, and management
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CouponValidationResult {
    valid: boolean;
    coupon?: {
        id: string;
        code: string;
        discountType: string;
        discountValue: number;
    };
    discountAmount?: number;
    message: string;
}

class CouponService {
    /**
     * Validate a coupon code
     */
    async validateCoupon(
        code: string,
        userId: string,
        planType: string,
        orderAmount: number
    ): Promise<CouponValidationResult> {
        // Find the coupon
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                usages: {
                    where: { userId }
                }
            }
        });

        if (!coupon) {
            return { valid: false, message: 'كود الخصم غير صالح' };
        }

        // Check if active
        if (!coupon.isActive) {
            return { valid: false, message: 'كود الخصم غير نشط' };
        }

        // Check validity dates
        const now = new Date();
        if (coupon.validFrom > now) {
            return { valid: false, message: 'كود الخصم لم يبدأ بعد' };
        }

        if (coupon.validUntil && coupon.validUntil < now) {
            return { valid: false, message: 'كود الخصم منتهي الصلاحية' };
        }

        // Check max uses
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            return { valid: false, message: 'كود الخصم استنفد جميع الاستخدامات' };
        }

        // Check per-user limit
        if (coupon.usages.length >= coupon.maxUsesPerUser) {
            return { valid: false, message: 'لقد استخدمت هذا الكود من قبل' };
        }

        // Check applicable plans
        if (coupon.applicablePlans) {
            const plans = JSON.parse(coupon.applicablePlans);
            if (!plans.includes(planType)) {
                return { valid: false, message: 'كود الخصم غير صالح لهذه الخطة' };
            }
        }

        // Check minimum order amount
        if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
            return {
                valid: false,
                message: `الحد الأدنى للطلب ${coupon.minOrderAmount} ج.م`
            };
        }

        // Calculate discount
        let discountAmount: number;
        if (coupon.discountType === 'percentage') {
            discountAmount = (orderAmount * coupon.discountValue) / 100;
        } else {
            discountAmount = Math.min(coupon.discountValue, orderAmount);
        }

        return {
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            },
            discountAmount: Math.round(discountAmount * 100) / 100,
            message: `تم تطبيق الخصم: ${discountAmount} ج.م`
        };
    }

    /**
     * Apply a coupon (record usage)
     */
    async applyCoupon(
        couponId: string,
        userId: string,
        discountAmount: number,
        orderId?: string
    ) {
        // Create usage record
        await prisma.couponUsage.create({
            data: {
                couponId,
                userId,
                discountAmount,
                orderId
            }
        });

        // Increment used count
        await prisma.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } }
        });
    }

    /**
     * Create a new coupon (admin)
     */
    async createCoupon(data: {
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        maxUses?: number;
        maxUsesPerUser?: number;
        validFrom?: Date;
        validUntil?: Date;
        applicablePlans?: string[];
        minOrderAmount?: number;
    }) {
        return prisma.coupon.create({
            data: {
                code: data.code.toUpperCase(),
                discountType: data.discountType,
                discountValue: data.discountValue,
                maxUses: data.maxUses,
                maxUsesPerUser: data.maxUsesPerUser ?? 1,
                validFrom: data.validFrom ?? new Date(),
                validUntil: data.validUntil,
                applicablePlans: data.applicablePlans ? JSON.stringify(data.applicablePlans) : null,
                minOrderAmount: data.minOrderAmount
            }
        });
    }

    /**
     * Get all coupons (admin)
     */
    async getAllCoupons(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { usages: true }
                    }
                }
            }),
            prisma.coupon.count()
        ]);

        return {
            coupons,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Update coupon (admin)
     */
    async updateCoupon(id: string, data: Partial<{
        code: string;
        discountType: string;
        discountValue: number;
        maxUses: number | null;
        maxUsesPerUser: number;
        validFrom: Date;
        validUntil: Date | null;
        applicablePlans: string[] | null;
        minOrderAmount: number | null;
        isActive: boolean;
    }>) {
        const updateData: any = { ...data };

        if (data.code) {
            updateData.code = data.code.toUpperCase();
        }

        if (data.applicablePlans !== undefined) {
            updateData.applicablePlans = data.applicablePlans
                ? JSON.stringify(data.applicablePlans)
                : null;
        }

        return prisma.coupon.update({
            where: { id },
            data: updateData
        });
    }

    /**
     * Delete coupon (admin)
     */
    async deleteCoupon(id: string) {
        return prisma.coupon.delete({
            where: { id }
        });
    }
}

export const couponService = new CouponService();

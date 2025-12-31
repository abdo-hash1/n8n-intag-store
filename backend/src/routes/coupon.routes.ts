/**
 * Coupon Routes
 * /api/coupons/* - Coupon validation and management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { couponService } from '../services/coupon.service.js';
import { sendSuccess, BadRequestError } from '../utils/index.js';
import { authenticate, requireAdmin } from '../middleware/index.js';

const router = Router();

/**
 * POST /api/coupons/validate
 * Validate a coupon code (user - requires login)
 */
router.post('/validate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new BadRequestError('Authentication required');
        }

        const { code, planType, amount } = req.body;

        if (!code || !planType || !amount) {
            throw new BadRequestError('Missing required fields: code, planType, amount');
        }

        const result = await couponService.validateCoupon(
            code,
            req.user.id,
            planType,
            parseFloat(amount)
        );

        sendSuccess(res, result, result.message);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/coupons (admin)
 * Get all coupons with pagination
 */
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await couponService.getAllCoupons(page, limit);
        sendSuccess(res, result, 'Coupons retrieved');
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/coupons (admin)
 * Create a new coupon
 */
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            maxUses,
            maxUsesPerUser,
            validFrom,
            validUntil,
            applicablePlans,
            minOrderAmount
        } = req.body;

        if (!code || !discountType || discountValue === undefined) {
            throw new BadRequestError('Missing required fields');
        }

        const coupon = await couponService.createCoupon({
            code,
            discountType,
            discountValue: parseFloat(discountValue),
            maxUses: maxUses ? parseInt(maxUses) : undefined,
            maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser) : 1,
            validFrom: validFrom ? new Date(validFrom) : undefined,
            validUntil: validUntil ? new Date(validUntil) : undefined,
            applicablePlans,
            minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined
        });

        sendSuccess(res, { coupon }, 'تم إنشاء كود الخصم بنجاح');
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/coupons/:id (admin)
 * Update a coupon
 */
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const coupon = await couponService.updateCoupon(id, req.body);

        sendSuccess(res, { coupon }, 'تم تحديث كود الخصم بنجاح');
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/coupons/:id (admin)
 * Delete a coupon
 */
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await couponService.deleteCoupon(id);

        sendSuccess(res, null, 'تم حذف كود الخصم بنجاح');
    } catch (error) {
        next(error);
    }
});

export default router;


/**
 * Pricing Routes
 * /api/pricing/* - Subscription pricing management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { pricingService } from '../services/pricing.service.js';
import { sendSuccess, BadRequestError } from '../utils/index.js';
import { authenticate, requireAdmin } from '../middleware/index.js';

const router = Router();

/**
 * GET /api/pricing
 * Get all pricing plans (public)
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const plans = await pricingService.getAllPlans();
        sendSuccess(res, { plans }, 'Pricing retrieved');
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/pricing/:planType
 * Get specific plan pricing (public)
 */
router.get('/:planType', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { planType } = req.params;

        if (planType !== 'monthly' && planType !== 'yearly') {
            throw new BadRequestError('Invalid plan type');
        }

        const plan = await pricingService.getPlanPrice(planType);
        sendSuccess(res, { plan }, 'Plan pricing retrieved');
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/pricing/:planType (admin)
 * Update plan pricing
 */
router.put('/:planType', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { planType } = req.params;

        if (planType !== 'monthly' && planType !== 'yearly') {
            throw new BadRequestError('Invalid plan type');
        }

        const { price, displayName, description, features, isActive } = req.body;

        const updatedPlan = await pricingService.updatePlanPrice(planType, {
            price: price !== undefined ? parseFloat(price) : undefined,
            displayName,
            description,
            features,
            isActive
        });

        sendSuccess(res, { plan: updatedPlan }, 'تم تحديث السعر بنجاح');
    } catch (error) {
        next(error);
    }
});

export default router;


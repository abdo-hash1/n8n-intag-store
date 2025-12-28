/**
 * Validation Middleware
 * Input validation using express-validator
 */

import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/index.js';

/**
 * Run validation and throw error if invalid
 */
export function validate(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => ({
            field: 'path' in err ? err.path : 'unknown',
            message: err.msg,
        }));

        throw new ValidationError('Validation failed', errorMessages);
    }

    next();
}

// ===========================================
// AUTH VALIDATION RULES
// ===========================================

export const signupValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),

    body('fullName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^(\+?20)?1[0125][0-9]{8}$/)
        .withMessage('Please provide a valid Egyptian phone number'),

    validate,
];

export const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    validate,
];

export const refreshTokenValidation = [
    body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required'),

    validate,
];

// ===========================================
// USER VALIDATION RULES
// ===========================================

export const updateProfileValidation = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^(\+?20)?1[0125][0-9]{8}$/)
        .withMessage('Please provide a valid Egyptian phone number'),

    validate,
];

export const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),

    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),

    body('confirmPassword')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match'),

    validate,
];

// ===========================================
// SUBSCRIPTION VALIDATION RULES
// ===========================================

export const createSubscriptionValidation = [
    body('planType')
        .isIn(['monthly', 'yearly'])
        .withMessage('Plan type must be monthly or yearly'),

    validate,
];

export const pauseSubscriptionValidation = [
    body('duration')
        .isInt({ min: 1, max: 3 })
        .withMessage('Pause duration must be between 1 and 3 months'),

    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Reason must be less than 500 characters'),

    validate,
];

export const cancelSubscriptionValidation = [
    body('reason')
        .notEmpty()
        .withMessage('Please provide a cancellation reason')
        .isIn([
            'too_expensive',
            'not_using',
            'found_alternative',
            'technical_issues',
            'other',
        ])
        .withMessage('Invalid cancellation reason'),

    body('feedback')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Feedback must be less than 1000 characters'),

    validate,
];

// ===========================================
// REFUND VALIDATION RULES
// ===========================================

export const refundRequestValidation = [
    body('paymentId')
        .isUUID()
        .withMessage('Invalid payment ID'),

    body('reason')
        .notEmpty()
        .withMessage('Please provide a reason for refund')
        .isIn([
            'not_satisfied',
            'technical_issues',
            'found_alternative',
            'changed_mind',
            'other',
        ])
        .withMessage('Invalid refund reason'),

    body('additionalDetails')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Additional details must be less than 1000 characters'),

    validate,
];

// ===========================================
// SUPPORT TICKET VALIDATION RULES
// ===========================================

export const createTicketValidation = [
    body('subject')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Subject must be between 5 and 200 characters'),

    body('description')
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Description must be between 10 and 5000 characters'),

    body('category')
        .isIn(['billing', 'technical', 'refund', 'other'])
        .withMessage('Invalid ticket category'),

    body('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Invalid priority level'),

    validate,
];

export const ticketReplyValidation = [
    body('content')
        .trim()
        .isLength({ min: 1, max: 5000 })
        .withMessage('Message must be between 1 and 5000 characters'),

    validate,
];

// ===========================================
// COMMON VALIDATION RULES
// ===========================================

export const uuidParamValidation = [
    param('id')
        .isUUID()
        .withMessage('Invalid ID format'),

    validate,
];

export const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    validate,
];

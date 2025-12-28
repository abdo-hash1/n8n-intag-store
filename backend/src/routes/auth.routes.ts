/**
 * Authentication Routes
 * /api/auth/*
 */

import { Router } from 'express';
import { authController } from '../controllers/index.js';
import {
    authenticate,
    signupValidation,
    loginValidation,
    refreshTokenValidation,
    authRateLimiter,
    signupRateLimiter,
} from '../middleware/index.js';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', signupRateLimiter, signupValidation, authController.signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get tokens
 * @access  Public
 */
router.post('/login', authRateLimiter, loginValidation, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', refreshTokenValidation, authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (optional - mainly for activity logging)
 * @access  Protected
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Protected
 */
router.get('/me', authenticate, authController.getMe);

export default router;

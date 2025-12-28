/**
 * Helper Utilities
 * Common utility functions used throughout the application
 */

import bcrypt from 'bcrypt';
import { config } from '../config/index.js';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.security.bcryptSaltRounds);
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a random string (for tokens, temporary passwords, etc.)
 */
export function generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
 */
export function isStrongPassword(password: string): {
    isValid: boolean;
    message: string;
} {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    return { isValid: true, message: 'Password is strong' };
}

/**
 * Validate Egyptian phone number format
 */
export function isValidEgyptianPhone(phone: string): boolean {
    // Formats: +201xxxxxxxxx, 01xxxxxxxxx, 201xxxxxxxxx
    const phoneRegex = /^(\+?20)?1[0125][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[\s-]/g, '');
    if (cleaned.startsWith('+20')) {
        return cleaned;
    }
    if (cleaned.startsWith('20')) {
        return `+${cleaned}`;
    }
    if (cleaned.startsWith('0')) {
        return `+20${cleaned.substring(1)}`;
    }
    return `+20${cleaned}`;
}

/**
 * Calculate date difference in days
 */
export function daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

/**
 * Add years to a date
 */
export function addYears(date: Date, years: number): Date {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
}

/**
 * Check if a date is within a certain number of days from now
 */
export function isWithinDays(date: Date, days: number): boolean {
    const now = new Date();
    return daysBetween(now, date) <= days;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'EGP'): string {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

/**
 * Create a slug from a string
 */
export function createSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Mask email for privacy (e.g., ab***@gmail.com)
 */
export function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
        return `${local[0]}***@${domain}`;
    }
    return `${local.substring(0, 2)}***@${domain}`;
}

/**
 * Mask credit card number (show last 4 digits)
 */
export function maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    return `****-****-****-${cleaned.slice(-4)}`;
}

/**
 * Calculate proration for plan changes
 */
export function calculateProration(
    currentAmount: number,
    daysUsed: number,
    totalDays: number
): number {
    const dailyRate = currentAmount / totalDays;
    const unusedDays = totalDays - daysUsed;
    return Math.round(dailyRate * unusedDays * 100) / 100;
}

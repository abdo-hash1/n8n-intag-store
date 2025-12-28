import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS support
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
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
 * Format date for display
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
    };
    return new Date(dateString).toLocaleDateString('ar-EG', defaultOptions);
}

/**
 * Format relative time (e.g., "منذ 5 دقائق")
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'منذ لحظات';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `منذ ${diffInMinutes} دقيقة`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `منذ ${diffInHours} ساعة`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `منذ ${diffInDays} يوم`;
    }

    return formatDate(dateString);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
}

/**
 * Wait for a specified duration
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if we're running on the client side
 */
export const isClient = typeof window !== 'undefined';

/**
 * Get item from localStorage safely
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
    if (!isClient) return defaultValue;

    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * Set item in localStorage safely
 */
export function setInStorage<T>(key: string, value: T): void {
    if (!isClient) return;

    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Remove item from localStorage
 */
export function removeFromStorage(key: string): void {
    if (!isClient) return;
    localStorage.removeItem(key);
}

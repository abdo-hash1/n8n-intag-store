/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // Environment variables available on the client side
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'n8n SaaS',
    },

    // Image optimization configuration
    images: {
        domains: ['localhost'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },

    // Internationalization (for Arabic RTL support)
    i18n: {
        locales: ['ar', 'en'],
        defaultLocale: 'ar',
        localeDetection: false,
    },
};

module.exports = nextConfig;

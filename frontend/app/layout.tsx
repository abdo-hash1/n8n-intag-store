import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';

// Load fonts
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const cairo = Cairo({
    subsets: ['arabic', 'latin'],
    variable: '--font-cairo',
    display: 'swap',
});

// Metadata for SEO
export const metadata: Metadata = {
    title: {
        default: 'n8n SaaS - أتمتة أعمالك بدون تعقيد',
        template: '%s | n8n SaaS',
    },
    description:
        'منصة سحابية لاستضافة n8n - أتمتة أعمالك بسهولة مع أكثر من 400 تكامل جاهز. اشترك الآن وابدأ بتجربتك المجانية!',
    keywords: [
        'n8n',
        'أتمتة',
        'automation',
        'workflow',
        'تكامل',
        'integration',
        'SaaS',
        'مصر',
        'Egypt',
    ],
    authors: [{ name: 'n8n SaaS Platform' }],
    creator: 'n8n SaaS Platform',
    openGraph: {
        type: 'website',
        locale: 'ar_EG',
        alternateLocale: 'en_US',
        url: 'https://n8nsaas.com',
        siteName: 'n8n SaaS',
        title: 'n8n SaaS - أتمتة أعمالك بدون تعقيد',
        description:
            'منصة سحابية لاستضافة n8n - أتمتة أعمالك بسهولة مع أكثر من 400 تكامل جاهز',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'n8n SaaS Platform',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'n8n SaaS - أتمتة أعمالك بدون تعقيد',
        description:
            'منصة سحابية لاستضافة n8n - أتمتة أعمالك بسهولة مع أكثر من 400 تكامل جاهز',
        images: ['/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl" suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#3b82f6" />
            </head>
            <body
                className={`${inter.variable} ${cairo.variable} min-h-screen bg-background antialiased`}
            >
                {children}
            </body>
        </html>
    );
}

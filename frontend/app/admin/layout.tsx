'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Skip layout for login page
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        // Skip auth check for login page
        if (isLoginPage) return;

        // Check if admin is authenticated using ADMIN tokens
        const storedUser = localStorage.getItem('adminUser');
        const token = localStorage.getItem('adminAccessToken');

        if (!token || !storedUser) {
            router.push('/admin/login');
            return;
        }

        try {
            const parsed = JSON.parse(storedUser);
            if (!['admin', 'super_admin'].includes(parsed.role)) {
                router.push('/admin/login');
                return;
            }
            setUser(parsed);
        } catch {
            router.push('/admin/login');
        }
    }, [router, isLoginPage]);

    const handleLogout = () => {
        // Only clear ADMIN tokens
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
    };

    // If it's the login page, just render children without the layout
    if (isLoginPage) {
        return <>{children}</>;
    }

    const navigation = [
        {
            name: 'لوحة التحكم',
            href: '/admin',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
            ),
        },
        {
            name: 'المستخدمين',
            href: '/admin/users',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            name: 'الاشتراكات',
            href: '/admin/subscriptions',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
        },
        {
            name: 'المدفوعات',
            href: '/admin/payments',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            name: 'تذاكر الدعم',
            href: '/admin/tickets',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
            ),
        },
        {
            name: 'سجل النشاط',
            href: '/admin/activity',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
        },
        {
            name: 'الإعدادات',
            href: '/admin/settings',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
    ];

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile sidebar backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 right-0 bottom-0 w-64 bg-card border-l z-50 transform transition-transform duration-200 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b bg-primary/5">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-white font-bold text-lg">n8n</span>
                        </div>
                        <div>
                            <span className="font-bold text-lg">لوحة الإدارة</span>
                            <span className="text-xs text-muted-foreground block">Admin Panel</span>
                        </div>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-muted rounded-lg"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User section at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                            <span className="text-destructive font-medium">
                                {user.fullName.charAt(0)}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user.role === 'super_admin' ? 'مدير عام' : 'مدير'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/dashboard"
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            الموقع
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            خروج
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:mr-64">
                {/* Top header */}
                <header className="h-16 bg-card border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 hover:bg-muted rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex-1 lg:mr-4">
                        <h1 className="text-lg font-bold text-primary">
                            🛡️ لوحة الإدارة
                        </h1>
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">النظام يعمل</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

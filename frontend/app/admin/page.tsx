'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
    users: {
        total: number;
        active: number;
        newThisMonth: number;
        growthRate: number;
    };
    subscriptions: {
        total: number;
        active: number;
    };
    revenue: {
        total: number;
        thisMonth: number;
        currency: string;
    };
    support: {
        openTickets: number;
        pendingRefunds: number;
    };
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats');
            }

            const data = await response.json();
            setStats(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency: string = 'EGP') => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-4 w-24 mb-4" />
                            <div className="skeleton h-8 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card p-6 text-center text-destructive">
                <p>{error}</p>
                <button
                    onClick={fetchDashboardStats}
                    className="btn-primary mt-4 px-4 py-2"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">لوحة التحكم</h1>
                <p className="text-muted-foreground">
                    نظرة عامة على أداء المنصة والإحصائيات
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Users */}
                <div className="card p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground">إجمالي المستخدمين</span>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold">{stats?.users.total || 0}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className={stats?.users.growthRate && stats.users.growthRate > 0 ? 'text-success' : 'text-destructive'}>
                            {stats?.users.growthRate && stats.users.growthRate > 0 ? '↑' : '↓'} {Math.abs(stats?.users.growthRate || 0)}%
                        </span>
                        <span className="text-muted-foreground">هذا الشهر</span>
                    </div>
                </div>

                {/* Active Subscriptions */}
                <div className="card p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground">الاشتراكات النشطة</span>
                        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold">{stats?.subscriptions.active || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        من {stats?.subscriptions.total || 0} إجمالي
                    </p>
                </div>

                {/* Revenue This Month */}
                <div className="card p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground">إيرادات الشهر</span>
                        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold">
                        {formatCurrency(stats?.revenue.thisMonth || 0, stats?.revenue.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        الإجمالي: {formatCurrency(stats?.revenue.total || 0, stats?.revenue.currency)}
                    </p>
                </div>

                {/* Open Tickets */}
                <div className="card p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground">تذاكر مفتوحة</span>
                        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold">{stats?.support.openTickets || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        طلبات استرداد: {stats?.support.pendingRefunds || 0}
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">إجراءات سريعة</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Link
                        href="/admin/users"
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">إدارة المستخدمين</p>
                            <p className="text-sm text-muted-foreground">عرض وإدارة الحسابات</p>
                        </div>
                    </Link>

                    <Link
                        href="/admin/subscriptions"
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">الاشتراكات</p>
                            <p className="text-sm text-muted-foreground">إدارة الخطط والفواتير</p>
                        </div>
                    </Link>

                    <Link
                        href="/admin/tickets"
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                            <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">تذاكر الدعم</p>
                            <p className="text-sm text-muted-foreground">الرد على الاستفسارات</p>
                        </div>
                    </Link>

                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-accent transition-colors">
                            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">الإعدادات</p>
                            <p className="text-sm text-muted-foreground">تكوين النظام</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Activity Preview */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">آخر النشاطات</h2>
                    <Link href="/admin/activity" className="text-primary text-sm hover:underline">
                        عرض الكل ←
                    </Link>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                    <p>سيتم عرض سجل النشاطات هنا</p>
                </div>
            </div>
        </div>
    );
}

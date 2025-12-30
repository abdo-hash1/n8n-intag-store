'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
    fullName: string;
}

interface Subscription {
    id: string;
    planType: 'monthly' | 'yearly';
    status: string;
    currentPeriodEnd: string;
    nextBillingDate: string;
    amount: number;
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Fetch subscription data
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSubscription(data.data.subscription);
            }
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; class: string }> = {
            active: { label: 'نشط', class: 'badge-success' },
            paused: { label: 'متوقف مؤقتاً', class: 'badge-warning' },
            cancelled: { label: 'ملغي', class: 'badge-destructive' },
            payment_failed: { label: 'فشل الدفع', class: 'badge-destructive' },
            expired: { label: 'منتهي', class: 'badge-secondary' },
        };
        const config = statusMap[status] || { label: status, class: 'badge-secondary' };
        return <span className={config.class}>{config.label}</span>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-8 animate-in">
            {/* Welcome section */}
            <div>
                <h1 className="text-3xl font-bold mb-2">
                    مرحباً، {user?.fullName || 'المستخدم'} 👋
                </h1>
                <p className="text-muted-foreground">
                    مرحباً بك في لوحة التحكم. هنا يمكنك إدارة اشتراكك والوصول إلى n8n الخاص بك.
                </p>
            </div>

            {/* Quick stats cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Subscription Status Card */}
                <div className="card p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground">حالة الاشتراك</span>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="skeleton h-6 w-20 mb-1" />
                    ) : subscription ? (
                        <div>
                            {getStatusBadge(subscription.status)}
                            <p className="text-sm text-muted-foreground mt-2">
                                {subscription.planType === 'yearly' ? 'الخطة السنوية' : 'الخطة الشهرية'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <span className="badge-secondary">لا يوجد اشتراك</span>
                            <Link href="/checkout" className="text-sm text-primary block mt-2">
                                اشترك الآن ←
                            </Link>
                        </div>
                    )}
                </div>

                {/* Next Billing Card */}
                <div className="card p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground">موعد الدفع القادم</span>
                        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="skeleton h-6 w-32" />
                    ) : subscription?.nextBillingDate ? (
                        <div>
                            <p className="text-lg font-semibold">{formatDate(subscription.nextBillingDate)}</p>
                            <p className="text-sm text-muted-foreground mt-1">{subscription.amount} ج.م</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">-</p>
                    )}
                </div>

                {/* n8n Instance Card */}
                <div className="card p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground">حالة n8n</span>
                        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="skeleton h-6 w-20" />
                    ) : subscription?.status === 'active' ? (
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                                </span>
                                <span className="font-semibold text-success">يعمل</span>
                            </div>
                            <Link href="/dashboard/instance" className="text-sm text-primary block mt-2">
                                فتح n8n ←
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-muted-foreground"></span>
                            <span className="text-muted-foreground">متوقف</span>
                        </div>
                    )}
                </div>

                {/* Support Card */}
                <div className="card p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground">الدعم الفني</span>
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold">تحتاج مساعدة؟</p>
                        <Link href="/dashboard/support" className="text-sm text-primary block mt-2">
                            فتح تذكرة ←
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">إجراءات سريعة</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Link
                        href="/dashboard/instance"
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">فتح n8n</p>
                            <p className="text-sm text-muted-foreground">الوصول لمنصة الأتمتة</p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/subscription"
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                            <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">إدارة الاشتراك</p>
                            <p className="text-sm text-muted-foreground">تغيير أو إلغاء الخطة</p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/billing"
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">الفواتير</p>
                            <p className="text-sm text-muted-foreground">عرض سجل الدفعات</p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/settings"
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
                            <p className="text-sm text-muted-foreground">تعديل حسابك</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Getting Started Guide (for new users) */}
            {!subscription && (
                <div className="card p-6 border-primary/50 bg-primary/5">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-2">ابدأ رحلتك مع n8n!</h3>
                            <p className="text-muted-foreground mb-4">
                                اشترك الآن واحصل على نسختك الخاصة من n8n مع أكثر من 400 تكامل جاهز.
                                أتمتة أعمالك أصبحت أسهل من أي وقت مضى.
                            </p>
                            <div className="flex gap-3">
                                <Link href="/checkout?plan=monthly" className="btn-primary px-4 py-2">
                                    اشترك شهرياً - 400 ج.م
                                </Link>
                                <Link href="/checkout?plan=annual" className="btn-outline px-4 py-2">
                                    اشترك سنوياً ووفر 20%
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Subscription {
    id: string;
    planType: 'monthly' | 'yearly';
    status: string;
    amount: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextBillingDate: string;
    createdAt: string;
    pausedAt?: string;
    cancelledAt?: string;
}

export default function SubscriptionPage() {
    const router = useRouter();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [pauseReason, setPauseReason] = useState('');

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                // API returns { data: { subscription: {...} } }
                setSubscription(data.data?.subscription || null);
            }
        } catch (err) {
            setError('فشل في جلب بيانات الاشتراك');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePause = async () => {
        if (!subscription || !pauseReason) return;
        setActionLoading('pause');

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/${subscription.id}/pause`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason: pauseReason }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'فشل إيقاف الاشتراك');
            }

            setShowPauseModal(false);
            fetchSubscription();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResume = async () => {
        if (!subscription) return;
        setActionLoading('resume');

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/${subscription.id}/resume`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'فشل استئناف الاشتراك');
            }

            fetchSubscription();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async () => {
        if (!subscription || !cancelReason) return;
        setActionLoading('cancel');

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/${subscription.id}/cancel`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason: cancelReason }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'فشل إلغاء الاشتراك');
            }

            setShowCancelModal(false);
            fetchSubscription();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setActionLoading(null);
        }
    };

    const handleChangePlan = async (newPlan: 'monthly' | 'yearly') => {
        if (!subscription) return;
        setActionLoading('change');

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/${subscription.id}/plan`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ planType: newPlan }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'فشل تغيير الخطة');
            }

            fetchSubscription();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatPrice = (amount?: number | null) => {
        if (amount === undefined || amount === null || isNaN(amount)) return '- ج.م';
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; class: string; icon: string }> = {
            active: { label: 'نشط', class: 'bg-success/10 text-success', icon: '✓' },
            paused: { label: 'متوقف مؤقتاً', class: 'bg-warning/10 text-warning', icon: '⏸' },
            cancelled: { label: 'ملغي', class: 'bg-destructive/10 text-destructive', icon: '✕' },
            expired: { label: 'منتهي', class: 'bg-muted text-muted-foreground', icon: '⏰' },
            payment_failed: { label: 'فشل الدفع', class: 'bg-destructive/10 text-destructive', icon: '!' },
        };
        return configs[status] || { label: status, class: 'bg-muted text-muted-foreground', icon: '?' };
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in">
                <div className="skeleton h-10 w-48" />
                <div className="card p-6">
                    <div className="skeleton h-6 w-32 mb-4" />
                    <div className="space-y-3">
                        <div className="skeleton h-4 w-full" />
                        <div className="skeleton h-4 w-3/4" />
                    </div>
                </div>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="space-y-6 animate-in">
                <div>
                    <h1 className="text-3xl font-bold mb-2">إدارة الاشتراك</h1>
                    <p className="text-muted-foreground">تحكم في اشتراكك وخطتك</p>
                </div>

                <div className="card p-12 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">لا يوجد اشتراك نشط</h2>
                    <p className="text-muted-foreground mb-6">
                        اشترك الآن للحصول على نسختك الخاصة من n8n
                    </p>
                    <Link href="/pricing" className="btn-primary px-6 py-3">
                        استعرض الخطط المتاحة
                    </Link>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(subscription.status);

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">إدارة الاشتراك</h1>
                    <p className="text-muted-foreground">تحكم في اشتراكك وخطتك</p>
                </div>
                <Link href="/dashboard" className="btn-outline px-4 py-2">
                    العودة للوحة التحكم
                </Link>
            </div>

            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {error}
                    <button onClick={() => setError('')} className="float-left">✕</button>
                </div>
            )}

            {/* Current Plan */}
            <div className="card p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold mb-1">خطتك الحالية</h2>
                        <p className="text-muted-foreground">
                            {subscription.planType === 'yearly' ? 'الاشتراك السنوي' : 'الاشتراك الشهري'}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${statusConfig.class}`}>
                        <span>{statusConfig.icon}</span>
                        {statusConfig.label}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">المبلغ</p>
                        <p className="text-2xl font-bold">{formatPrice(subscription.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                            / {subscription.planType === 'yearly' ? 'سنة' : 'شهر'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">تاريخ الاشتراك</p>
                        <p className="font-medium">{formatDate(subscription.createdAt)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">نهاية الفترة</p>
                        <p className="font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">الفاتورة القادمة</p>
                        <p className="font-medium">
                            {subscription.status === 'active' && subscription.nextBillingDate
                                ? formatDate(subscription.nextBillingDate)
                                : '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Plan Comparison */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">تغيير الخطة</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Monthly Plan */}
                    <div className={`p-6 rounded-lg border-2 ${subscription.planType === 'monthly' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">الخطة الشهرية</h3>
                            {subscription.planType === 'monthly' && (
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                    الخطة الحالية
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold mb-2">400 ج.م</p>
                        <p className="text-muted-foreground text-sm mb-4">/ شهر</p>
                        <ul className="space-y-2 text-sm mb-4">
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                n8n كامل بدون قيود
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                دعم فني على مدار الساعة
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                إلغاء في أي وقت
                            </li>
                        </ul>
                        {subscription.planType !== 'monthly' && subscription.status === 'active' && (
                            <button
                                onClick={() => handleChangePlan('monthly')}
                                disabled={actionLoading === 'change'}
                                className="btn-outline w-full py-2"
                            >
                                {actionLoading === 'change' ? 'جاري التحويل...' : 'التحويل للشهري'}
                            </button>
                        )}
                    </div>

                    {/* Yearly Plan */}
                    <div className={`p-6 rounded-lg border-2 ${subscription.planType === 'yearly' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">الخطة السنوية</h3>
                            {subscription.planType === 'yearly' ? (
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                    الخطة الحالية
                                </span>
                            ) : (
                                <span className="bg-success/10 text-success text-xs px-2 py-1 rounded">
                                    وفر 20%
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold mb-2">3,800 ج.م</p>
                        <p className="text-muted-foreground text-sm mb-4">/ سنة</p>
                        <ul className="space-y-2 text-sm mb-4">
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                جميع مميزات الشهري
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                أولوية في الدعم الفني
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                ضمان استرداد 30 يوم
                            </li>
                        </ul>
                        {subscription.planType !== 'yearly' && subscription.status === 'active' && (
                            <button
                                onClick={() => handleChangePlan('yearly')}
                                disabled={actionLoading === 'change'}
                                className="btn-primary w-full py-2"
                            >
                                {actionLoading === 'change' ? 'جاري الترقية...' : 'الترقية للسنوي'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            {subscription.status !== 'cancelled' && (
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-6">إجراءات الاشتراك</h2>
                    <div className="flex flex-wrap gap-4">
                        {subscription.status === 'active' && (
                            <button
                                onClick={() => setShowPauseModal(true)}
                                disabled={actionLoading === 'pause'}
                                className="btn-outline px-6 py-2"
                            >
                                إيقاف مؤقت
                            </button>
                        )}
                        {subscription.status === 'paused' && (
                            <button
                                onClick={handleResume}
                                disabled={actionLoading === 'resume'}
                                className="btn-primary px-6 py-2"
                            >
                                {actionLoading === 'resume' ? 'جاري الاستئناف...' : 'استئناف الاشتراك'}
                            </button>
                        )}
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="text-destructive hover:bg-destructive/10 px-6 py-2 rounded-lg transition-colors"
                        >
                            إلغاء الاشتراك
                        </button>
                    </div>
                </div>
            )}

            {/* Re-subscribe */}
            {subscription.status === 'cancelled' && (
                <div className="card p-6 border-primary/50 bg-primary/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold mb-1">هل تريد العودة؟</h3>
                            <p className="text-muted-foreground text-sm">
                                يمكنك إعادة الاشتراك في أي وقت والاستمتاع بجميع المميزات
                            </p>
                        </div>
                        <Link href="/pricing" className="btn-primary px-6 py-2">
                            إعادة الاشتراك
                        </Link>
                    </div>
                </div>
            )}

            {/* Pause Modal */}
            {showPauseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card p-6 max-w-md w-full animate-in">
                        <h3 className="text-xl font-bold mb-4">إيقاف الاشتراك مؤقتاً</h3>
                        <p className="text-muted-foreground mb-4">
                            سيتم إيقاف اشتراكك مؤقتاً. يمكنك استئنافه في أي وقت.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">سبب الإيقاف</label>
                            <select
                                value={pauseReason}
                                onChange={(e) => setPauseReason(e.target.value)}
                                className="input w-full"
                            >
                                <option value="">اختر السبب...</option>
                                <option value="vacation">إجازة / سفر</option>
                                <option value="project_complete">انتهاء المشروع مؤقتاً</option>
                                <option value="budget">أسباب مالية مؤقتة</option>
                                <option value="other">سبب آخر</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPauseModal(false)}
                                className="btn-outline flex-1 py-2"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handlePause}
                                disabled={!pauseReason || actionLoading === 'pause'}
                                className="btn-primary flex-1 py-2 disabled:opacity-50"
                            >
                                {actionLoading === 'pause' ? 'جاري الإيقاف...' : 'تأكيد الإيقاف'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card p-6 max-w-md w-full animate-in">
                        <h3 className="text-xl font-bold mb-4 text-destructive">إلغاء الاشتراك</h3>
                        <p className="text-muted-foreground mb-4">
                            هل أنت متأكد من إلغاء اشتراكك؟ سيتم إلغاء جميع المميزات في نهاية فترة الفوترة الحالية.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">سبب الإلغاء</label>
                            <select
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="input w-full"
                            >
                                <option value="">اختر السبب...</option>
                                <option value="too_expensive">السعر مرتفع</option>
                                <option value="not_using">لا أستخدم الخدمة</option>
                                <option value="missing_features">ميزات ناقصة</option>
                                <option value="found_alternative">وجدت بديل آخر</option>
                                <option value="technical_issues">مشاكل تقنية</option>
                                <option value="other">سبب آخر</option>
                            </select>
                        </div>
                        <div className="p-3 bg-warning/10 text-warning rounded-lg text-sm mb-4">
                            ⚠️ ستفقد الوصول إلى n8n في {formatDate(subscription.currentPeriodEnd)}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="btn-outline flex-1 py-2"
                            >
                                تراجع
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={!cancelReason || actionLoading === 'cancel'}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg flex-1 py-2 disabled:opacity-50"
                            >
                                {actionLoading === 'cancel' ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

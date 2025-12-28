'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Subscription {
    id: string;
    planType: string;
    status: string;
    amount: number;
    currency: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextBillingDate: string;
    pausedAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    user: {
        id: string;
        email: string;
        fullName: string;
        phone: string;
    };
    payments: Array<{
        id: string;
        amount: number;
        status: string;
        createdAt: string;
    }>;
}

export default function AdminSubscriptionDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const subscriptionId = params.subscriptionId as string;

    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (subscriptionId) {
            fetchSubscription();
        }
    }, [subscriptionId]);

    const fetchSubscription = async () => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/subscriptions/${subscriptionId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error('Subscription not found');

            const data = await response.json();
            setSubscription(data.data?.subscription || data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!subscription) return;
        setActionLoading(newStatus);

        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/subscriptions/${subscriptionId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (!response.ok) throw new Error('Failed to update subscription');

            fetchSubscription();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setActionLoading(null);
        }
    };

    const formatCurrency = (amount: number, currency: string = 'EGP') => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; class: string; color: string }> = {
            active: { label: 'نشط', class: 'badge-success', color: 'text-success' },
            paused: { label: 'متوقف', class: 'badge-warning', color: 'text-warning' },
            cancelled: { label: 'ملغى', class: 'badge-destructive', color: 'text-destructive' },
            expired: { label: 'منتهي', class: 'badge-secondary', color: 'text-muted-foreground' },
            payment_failed: { label: 'فشل الدفع', class: 'badge-destructive', color: 'text-destructive' },
        };
        return configs[status] || { label: status, class: 'badge-secondary', color: 'text-muted-foreground' };
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in">
                <div className="flex items-center gap-4">
                    <div className="skeleton h-8 w-8 rounded" />
                    <div className="skeleton h-8 w-64" />
                </div>
                <div className="card p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="skeleton h-4 w-32" />
                            <div className="skeleton h-6 w-48" />
                        </div>
                        <div className="space-y-4">
                            <div className="skeleton h-4 w-32" />
                            <div className="skeleton h-6 w-48" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !subscription) {
        return (
            <div className="space-y-6 animate-in">
                <div className="flex items-center gap-4">
                    <Link href="/admin/subscriptions" className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                    <h1 className="text-3xl font-bold">تفاصيل الاشتراك</h1>
                </div>
                <div className="card p-12 text-center">
                    <p className="text-destructive mb-4">{error || 'لم يتم العثور على الاشتراك'}</p>
                    <Link href="/admin/subscriptions" className="btn-primary px-4 py-2">
                        العودة للاشتراكات
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
                <div className="flex items-center gap-4">
                    <Link href="/admin/subscriptions" className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">تفاصيل الاشتراك</h1>
                        <p className="text-muted-foreground">{subscription.id.slice(0, 8)}...</p>
                    </div>
                </div>
                <span className={statusConfig.class}>{statusConfig.label}</span>
            </div>

            {/* User Info */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">معلومات المستخدم</h2>
                    <Link
                        href={`/admin/users/${subscription.user.id}`}
                        className="text-primary hover:underline text-sm"
                    >
                        عرض الملف الكامل ←
                    </Link>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">الاسم</p>
                        <p className="font-medium">{subscription.user.fullName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
                        <p className="font-medium">{subscription.user.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">رقم الهاتف</p>
                        <p className="font-medium">{subscription.user.phone || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Subscription Details */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">تفاصيل الاشتراك</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">الخطة</p>
                        <p className="font-medium text-lg">
                            {subscription.planType === 'yearly' ? 'سنوي' : 'شهري'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">المبلغ</p>
                        <p className="font-bold text-lg">{formatCurrency(subscription.amount, subscription.currency)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">تاريخ البداية</p>
                        <p className="font-medium">{formatDate(subscription.currentPeriodStart)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">تاريخ الانتهاء</p>
                        <p className="font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">تاريخ الإنشاء</p>
                        <p className="font-medium">{formatDate(subscription.createdAt)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">الفاتورة القادمة</p>
                        <p className="font-medium">
                            {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : '-'}
                        </p>
                    </div>
                    {subscription.pausedAt && (
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">تاريخ الإيقاف</p>
                            <p className="font-medium text-warning">{formatDate(subscription.pausedAt)}</p>
                        </div>
                    )}
                    {subscription.cancelledAt && (
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">تاريخ الإلغاء</p>
                            <p className="font-medium text-destructive">{formatDate(subscription.cancelledAt)}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Admin Actions */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">إجراءات الإدارة</h2>
                <div className="flex flex-wrap gap-4">
                    {subscription.status !== 'active' && subscription.status !== 'cancelled' && (
                        <button
                            onClick={() => handleStatusChange('active')}
                            disabled={actionLoading === 'active'}
                            className="btn-primary px-4 py-2"
                        >
                            {actionLoading === 'active' ? 'جاري التفعيل...' : 'تفعيل الاشتراك'}
                        </button>
                    )}
                    {subscription.status === 'active' && (
                        <button
                            onClick={() => handleStatusChange('paused')}
                            disabled={actionLoading === 'paused'}
                            className="btn-outline px-4 py-2"
                        >
                            {actionLoading === 'paused' ? 'جاري الإيقاف...' : 'إيقاف مؤقت'}
                        </button>
                    )}
                    {subscription.status !== 'cancelled' && (
                        <button
                            onClick={() => handleStatusChange('cancelled')}
                            disabled={actionLoading === 'cancelled'}
                            className="text-destructive hover:bg-destructive/10 px-4 py-2 rounded-lg transition-colors"
                        >
                            {actionLoading === 'cancelled' ? 'جاري الإلغاء...' : 'إلغاء الاشتراك'}
                        </button>
                    )}
                </div>
            </div>

            {/* Payment History */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">سجل المدفوعات</h2>
                {subscription.payments && subscription.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-right p-3 font-medium">التاريخ</th>
                                    <th className="text-right p-3 font-medium">المبلغ</th>
                                    <th className="text-right p-3 font-medium">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {subscription.payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3">{formatDate(payment.createdAt)}</td>
                                        <td className="p-3 font-medium">{formatCurrency(payment.amount)}</td>
                                        <td className="p-3">
                                            <span className={payment.status === 'completed' || payment.status === 'success' ? 'badge-success' : 'badge-destructive'}>
                                                {payment.status === 'completed' || payment.status === 'success' ? 'مكتمل' : 'فشل'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        لا توجد مدفوعات مسجلة
                    </div>
                )}
            </div>
        </div>
    );
}

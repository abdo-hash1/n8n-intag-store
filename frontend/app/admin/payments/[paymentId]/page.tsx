'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paymentGateway: string;
    gatewayTransactionId: string;
    gatewayResponse: string | null;
    refundAmount: number | null;
    refundReason: string | null;
    refundedAt: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        email: string;
        fullName: string;
        phone: string;
    };
    subscription: {
        id: string;
        planType: string;
        status: string;
        currentPeriodStart: string;
        currentPeriodEnd: string;
    } | null;
}

export default function AdminPaymentDetailsPage() {
    const params = useParams();
    const paymentId = params.paymentId as string;

    const [payment, setPayment] = useState<Payment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [refundAmount, setRefundAmount] = useState(0);
    const [isRefunding, setIsRefunding] = useState(false);

    useEffect(() => {
        if (paymentId) {
            fetchPayment();
        }
    }, [paymentId]);

    const fetchPayment = async () => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/payments/${paymentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error('Payment not found');

            const data = await response.json();
            setPayment(data.data?.payment || data.data);
            setRefundAmount(data.data?.payment?.amount || data.data?.amount || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!payment || !refundReason) return;
        setIsRefunding(true);

        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/payments/${paymentId}/refund`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        reason: refundReason,
                        amount: refundAmount,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'فشل في الاسترداد');
            }

            setShowRefundModal(false);
            fetchPayment();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsRefunding(false);
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
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; class: string; color: string }> = {
            success: { label: 'ناجح', class: 'badge-success', color: 'text-success' },
            completed: { label: 'مكتمل', class: 'badge-success', color: 'text-success' },
            pending: { label: 'قيد المعالجة', class: 'badge-warning', color: 'text-warning' },
            failed: { label: 'فشل', class: 'badge-destructive', color: 'text-destructive' },
            refunded: { label: 'مسترد', class: 'badge-secondary', color: 'text-muted-foreground' },
        };
        return configs[status] || { label: status, class: 'badge-secondary', color: 'text-muted-foreground' };
    };

    const getPaymentGatewayLabel = (gateway: string) => {
        const gateways: Record<string, string> = {
            paymob: 'Paymob',
            mock: 'تجريبي',
            manual: 'يدوي',
            stripe: 'Stripe',
        };
        return gateways[gateway] || gateway;
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

    if (error || !payment) {
        return (
            <div className="space-y-6 animate-in">
                <div className="flex items-center gap-4">
                    <Link href="/admin/payments" className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                    <h1 className="text-3xl font-bold">تفاصيل الدفعة</h1>
                </div>
                <div className="card p-12 text-center">
                    <p className="text-destructive mb-4">{error || 'لم يتم العثور على الدفعة'}</p>
                    <Link href="/admin/payments" className="btn-primary px-4 py-2">
                        العودة للمدفوعات
                    </Link>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(payment.status);

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/payments" className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">تفاصيل الدفعة</h1>
                        <p className="text-muted-foreground font-mono">{payment.id}</p>
                    </div>
                </div>
                <span className={statusConfig.class}>{statusConfig.label}</span>
            </div>

            {/* Amount Card */}
            <div className="card p-8 text-center">
                <p className="text-muted-foreground mb-2">المبلغ</p>
                <p className={`text-5xl font-bold mb-4 ${statusConfig.color}`}>
                    {formatCurrency(payment.amount, payment.currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                    {formatDate(payment.createdAt)}
                </p>
            </div>

            {/* User Info */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">معلومات المستخدم</h2>
                    <Link
                        href={`/admin/users/${payment.user.id}`}
                        className="text-primary hover:underline text-sm"
                    >
                        عرض الملف الكامل ←
                    </Link>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">الاسم</p>
                        <p className="font-medium">{payment.user.fullName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
                        <p className="font-medium">{payment.user.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">رقم الهاتف</p>
                        <p className="font-medium">{payment.user.phone || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Payment Details */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">تفاصيل الدفعة</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">بوابة الدفع</p>
                        <p className="font-medium">{getPaymentGatewayLabel(payment.paymentGateway)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">رقم المعاملة</p>
                        <p className="font-mono text-sm">{payment.gatewayTransactionId || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">تاريخ الإنشاء</p>
                        <p className="font-medium">{formatDate(payment.createdAt)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">آخر تحديث</p>
                        <p className="font-medium">{formatDate(payment.updatedAt)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">العملة</p>
                        <p className="font-medium">{payment.currency}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">الحالة</p>
                        <span className={statusConfig.class}>{statusConfig.label}</span>
                    </div>
                </div>
            </div>

            {/* Subscription Info */}
            {payment.subscription && (
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">الاشتراك المرتبط</h2>
                        <Link
                            href={`/admin/subscriptions/${payment.subscription.id}`}
                            className="text-primary hover:underline text-sm"
                        >
                            عرض التفاصيل ←
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">نوع الخطة</p>
                            <p className="font-medium">
                                {payment.subscription.planType === 'yearly' ? 'سنوي' : 'شهري'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">فترة الاشتراك</p>
                            <p className="font-medium">
                                {formatDate(payment.subscription.currentPeriodStart).split(',')[0]} - {formatDate(payment.subscription.currentPeriodEnd).split(',')[0]}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">حالة الاشتراك</p>
                            <span className={getStatusConfig(payment.subscription.status).class}>
                                {getStatusConfig(payment.subscription.status).label}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Info */}
            {payment.refundedAt && (
                <div className="card p-6 border-warning/50 bg-warning/5">
                    <h2 className="text-xl font-bold mb-4">معلومات الاسترداد</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">المبلغ المسترد</p>
                            <p className="font-bold text-lg">{formatCurrency(payment.refundAmount || 0)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">تاريخ الاسترداد</p>
                            <p className="font-medium">{formatDate(payment.refundedAt)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">سبب الاسترداد</p>
                            <p className="font-medium">{payment.refundReason || '-'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Gateway Response */}
            {payment.gatewayResponse && (
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-4">رد بوابة الدفع</h2>
                    <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                        {JSON.stringify(JSON.parse(payment.gatewayResponse), null, 2)}
                    </pre>
                </div>
            )}

            {/* Actions */}
            {(payment.status === 'success' || payment.status === 'completed') && !payment.refundedAt && (
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-6">إجراءات الإدارة</h2>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setShowRefundModal(true)}
                            className="text-destructive hover:bg-destructive/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            استرداد المبلغ
                        </button>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {showRefundModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card p-6 max-w-md w-full animate-in">
                        <h3 className="text-xl font-bold mb-4 text-destructive">استرداد المبلغ</h3>
                        <p className="text-muted-foreground mb-4">
                            هل أنت متأكد من استرداد هذا المبلغ؟ سيتم إرجاع المبلغ للمستخدم.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">مبلغ الاسترداد</label>
                            <input
                                type="number"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(Number(e.target.value))}
                                max={payment.amount}
                                className="input w-full"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                الحد الأقصى: {formatCurrency(payment.amount)}
                            </p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">سبب الاسترداد</label>
                            <select
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                className="input w-full"
                            >
                                <option value="">اختر السبب...</option>
                                <option value="customer_request">طلب العميل</option>
                                <option value="duplicate_payment">دفعة مكررة</option>
                                <option value="service_not_provided">عدم تقديم الخدمة</option>
                                <option value="technical_issue">مشكلة تقنية</option>
                                <option value="other">سبب آخر</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRefundModal(false)}
                                className="btn-outline flex-1 py-2"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleRefund}
                                disabled={!refundReason || refundAmount <= 0 || isRefunding}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg flex-1 py-2 disabled:opacity-50"
                            >
                                {isRefunding ? 'جاري الاسترداد...' : 'تأكيد الاسترداد'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

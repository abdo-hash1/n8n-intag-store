'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Payment {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
    transactionId: string;
    createdAt: string;
    subscription?: {
        planType: string;
    };
}

export default function BillingPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/payments`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data.data?.payments || []);
            }
        } catch (err) {
            setError('فشل في جلب بيانات الفواتير');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; class: string }> = {
            completed: { label: 'مكتمل', class: 'badge-success' },
            success: { label: 'ناجح', class: 'badge-success' },
            pending: { label: 'قيد المعالجة', class: 'badge-warning' },
            failed: { label: 'فشل', class: 'badge-destructive' },
            refunded: { label: 'مسترد', class: 'badge-secondary' },
        };
        return configs[status] || { label: status, class: 'badge-secondary' };
    };

    const getPaymentMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
            card: 'بطاقة ائتمان',
            wallet: 'محفظة إلكترونية',
            mock: 'اختبار',
            paymob: 'Paymob',
        };
        return methods[method] || method;
    };

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">الفواتير والمدفوعات</h1>
                    <p className="text-muted-foreground">سجل جميع مدفوعاتك وفواتيرك</p>
                </div>
                <Link href="/dashboard" className="btn-outline px-4 py-2">
                    العودة للوحة التحكم
                </Link>
            </div>

            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {error}
                </div>
            )}

            {/* Payments List */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="skeleton h-10 w-10 rounded" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-4 w-32" />
                                    <div className="skeleton h-3 w-24" />
                                </div>
                                <div className="skeleton h-6 w-20" />
                            </div>
                        ))}
                    </div>
                ) : payments.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold mb-2">لا توجد فواتير</h3>
                        <p className="text-muted-foreground mb-4">
                            ستظهر هنا فواتيرك بعد إتمام أول عملية دفع
                        </p>
                        <Link href="/pricing" className="btn-primary px-6 py-2">
                            استعرض الخطط
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-right p-4 font-medium">التاريخ</th>
                                    <th className="text-right p-4 font-medium">الوصف</th>
                                    <th className="text-right p-4 font-medium">طريقة الدفع</th>
                                    <th className="text-right p-4 font-medium">المبلغ</th>
                                    <th className="text-right p-4 font-medium">الحالة</th>
                                    <th className="text-right p-4 font-medium">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payments.map((payment) => {
                                    const statusConfig = getStatusConfig(payment.status);
                                    return (
                                        <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4">
                                                <p className="font-medium">{formatDate(payment.createdAt)}</p>
                                            </td>
                                            <td className="p-4">
                                                <p>اشتراك {payment.subscription?.planType === 'yearly' ? 'سنوي' : 'شهري'}</p>
                                                <p className="text-xs text-muted-foreground">#{payment.transactionId?.slice(0, 12) || payment.id.slice(0, 8)}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                                        {payment.paymentMethod === 'card' ? (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span>{getPaymentMethodLabel(payment.paymentMethod)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold">{formatPrice(payment.amount)}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={statusConfig.class}>{statusConfig.label}</span>
                                            </td>
                                            <td className="p-4">
                                                <button className="text-primary hover:underline text-sm">
                                                    تحميل الفاتورة
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment Methods */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">طرق الدفع المحفوظة</h2>
                    <button className="btn-outline px-4 py-2 text-sm">
                        إضافة طريقة دفع
                    </button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p>لا توجد طرق دفع محفوظة</p>
                    <p className="text-sm mt-1">سيتم حفظ طريقة الدفع عند الاشتراك</p>
                </div>
            </div>

            {/* Billing Info */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">معلومات الفوترة</h2>
                    <button className="btn-outline px-4 py-2 text-sm">
                        تعديل
                    </button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">الاسم</p>
                        <p className="font-medium">-</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
                        <p className="font-medium">-</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">رقم الهاتف</p>
                        <p className="font-medium">-</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">العنوان</p>
                        <p className="font-medium">-</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

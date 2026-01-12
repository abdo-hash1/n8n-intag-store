'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paymentGateway: string;
    gatewayTransactionId: string;
    createdAt: string;
    user: {
        id: string;
        email: string;
        fullName: string;
    };
    subscription?: {
        id: string;
        planType: string;
    };
}

interface Stats {
    total: number;
    totalAmount: number;
    successCount: number;
    failedCount: number;
    pendingCount: number;
    refundedCount: number;
    currency: string;
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const limit = 20;

    useEffect(() => {
        fetchData();
    }, [page, statusFilter]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminAccessToken');

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/payments?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error('Failed to fetch payments');

            const data = await response.json();
            setPayments(data.data || []);
            setTotal(data.meta?.total || 0);

            // Calculate stats from data
            const allPayments = data.data || [];
            const statsData: Stats = {
                total: data.meta?.total || allPayments.length,
                totalAmount: allPayments.reduce((sum: number, p: Payment) =>
                    (p.status === 'success' || p.status === 'completed') ? sum + p.amount : sum, 0),
                successCount: allPayments.filter((p: Payment) => p.status === 'success' || p.status === 'completed').length,
                failedCount: allPayments.filter((p: Payment) => p.status === 'failed').length,
                pendingCount: allPayments.filter((p: Payment) => p.status === 'pending').length,
                refundedCount: allPayments.filter((p: Payment) => p.status === 'refunded').length,
                currency: 'EGP',
            };
            setStats(statsData);
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; class: string; icon: string }> = {
            success: { label: 'ناجح', class: 'badge-success', icon: '✓' },
            completed: { label: 'مكتمل', class: 'badge-success', icon: '✓' },
            pending: { label: 'قيد المعالجة', class: 'badge-warning', icon: '⏳' },
            failed: { label: 'فشل', class: 'badge-destructive', icon: '✕' },
            refunded: { label: 'مسترد', class: 'badge-secondary', icon: '↩' },
        };
        return configs[status] || { label: status, class: 'badge-secondary', icon: '?' };
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

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">المدفوعات</h1>
                    <p className="text-muted-foreground">إدارة ومتابعة جميع المدفوعات</p>
                </div>
                <button className="btn-outline px-4 py-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    تصدير CSV
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div className="card p-4">
                        <p className="text-sm text-muted-foreground mb-1">إجمالي المدفوعات</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-sm text-muted-foreground mb-1">إجمالي الإيرادات</p>
                        <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalAmount, stats.currency)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-sm text-muted-foreground mb-1">ناجحة</p>
                        <p className="text-2xl font-bold text-success">{stats.successCount}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-sm text-muted-foreground mb-1">فاشلة</p>
                        <p className="text-2xl font-bold text-destructive">{stats.failedCount}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-sm text-muted-foreground mb-1">مستردة</p>
                        <p className="text-2xl font-bold">{stats.refundedCount}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card p-4">
                <div className="flex gap-4 flex-wrap items-center">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="input w-auto"
                    >
                        <option value="">كل الحالات</option>
                        <option value="success">ناجح</option>
                        <option value="pending">قيد المعالجة</option>
                        <option value="failed">فشل</option>
                        <option value="refunded">مسترد</option>
                    </select>
                    <span className="text-sm text-muted-foreground">
                        إجمالي: {total} عملية دفع
                    </span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="card p-4 text-center text-destructive">{error}</div>
            )}

            {/* Payments Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-right p-4 font-medium">رقم العملية</th>
                                <th className="text-right p-4 font-medium">المستخدم</th>
                                <th className="text-right p-4 font-medium">المبلغ</th>
                                <th className="text-right p-4 font-medium">الحالة</th>
                                <th className="text-right p-4 font-medium">بوابة الدفع</th>
                                <th className="text-right p-4 font-medium">التاريخ</th>
                                <th className="text-right p-4 font-medium">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4"><div className="skeleton h-4 w-24" /></td>
                                        <td className="p-4"><div className="skeleton h-10 w-48" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-20" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-16" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-16" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-32" /></td>
                                        <td className="p-4"><div className="skeleton h-8 w-20" /></td>
                                    </tr>
                                ))
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-medium text-muted-foreground">لا توجد مدفوعات</p>
                                        <p className="text-sm text-muted-foreground">ستظهر هنا جميع عمليات الدفع</p>
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => {
                                    const statusConfig = getStatusConfig(payment.status);
                                    return (
                                        <tr key={payment.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-mono text-sm">{payment.id.slice(0, 8)}...</p>
                                                    {payment.gatewayTransactionId && (
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            {payment.gatewayTransactionId.slice(0, 12)}...
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium">{payment.user?.fullName || '-'}</p>
                                                    <p className="text-sm text-muted-foreground">{payment.user?.email || '-'}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold text-lg">{formatCurrency(payment.amount, payment.currency)}</p>
                                                {payment.subscription && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {payment.subscription.planType === 'yearly' ? 'سنوي' : 'شهري'}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`${statusConfig.class} flex items-center gap-1 w-fit`}>
                                                    <span>{statusConfig.icon}</span>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm">{getPaymentGatewayLabel(payment.paymentGateway)}</span>
                                            </td>
                                            <td className="p-4 text-muted-foreground text-sm">
                                                {formatDate(payment.createdAt)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/admin/payments/${payment.id}`}
                                                        className="btn-ghost px-3 py-1.5 text-sm hover:text-primary"
                                                    >
                                                        عرض
                                                    </Link>
                                                    {payment.user?.id && (
                                                        <Link
                                                            href={`/admin/users/${payment.user.id}`}
                                                            className="btn-ghost px-3 py-1.5 text-sm hover:text-primary"
                                                            title="عرض المستخدم"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    total={total}
                    limit={limit}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}

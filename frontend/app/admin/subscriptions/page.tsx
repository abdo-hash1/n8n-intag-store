'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Subscription {
    id: string;
    planType: string;
    status: string;
    amount: number;
    currency: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    createdAt: string;
    user: {
        id: string;
        email: string;
        fullName: string;
    };
}

interface Stats {
    total: number;
    active: number;
    paused: number;
    cancelled: number;
    byPlan: {
        monthly: number;
        yearly: number;
    };
    mrr: number;
    currency: string;
}

export default function AdminSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const limit = 20;

    useEffect(() => {
        fetchData();
    }, [page, statusFilter, planFilter]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminAccessToken');

            // Fetch subscriptions
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (statusFilter) params.append('status', statusFilter);
            if (planFilter) params.append('planType', planFilter);

            const [subsRes, statsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/subscriptions?${params}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/subscriptions/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (!subsRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');

            const subsData = await subsRes.json();
            const statsData = await statsRes.json();

            setSubscriptions(subsData.data || []);
            setTotal(subsData.meta?.total || 0);
            setStats(statsData.data);
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
        });
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; class: string }> = {
            active: { label: 'نشط', class: 'badge-success' },
            paused: { label: 'متوقف', class: 'badge-warning' },
            cancelled: { label: 'ملغى', class: 'badge-destructive' },
            expired: { label: 'منتهي', class: 'badge-secondary' },
            payment_failed: { label: 'فشل الدفع', class: 'badge-destructive' },
        };
        const config = map[status] || { label: status, class: 'badge-secondary' };
        return <span className={config.class}>{config.label}</span>;
    };

    const getPlanBadge = (planType: string) => {
        return planType === 'yearly'
            ? <span className="badge-primary">سنوي</span>
            : <span className="badge-secondary">شهري</span>;
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">الاشتراكات</h1>
                <p className="text-muted-foreground">إدارة اشتراكات المستخدمين</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="card p-4">
                        <p className="text-sm text-muted-foreground mb-1">إجمالي الاشتراكات</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-sm text-muted-foreground mb-1">الاشتراكات النشطة</p>
                        <p className="text-2xl font-bold text-success">{stats.active}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-sm text-muted-foreground mb-1">الإيرادات الشهرية (MRR)</p>
                        <p className="text-2xl font-bold">{formatCurrency(stats.mrr, stats.currency)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-sm text-muted-foreground mb-1">بالخطط</p>
                        <div className="flex gap-4 text-sm">
                            <span>شهري: <strong>{stats.byPlan.monthly}</strong></span>
                            <span>سنوي: <strong>{stats.byPlan.yearly}</strong></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card p-4">
                <div className="flex gap-4 flex-wrap">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="input w-auto"
                    >
                        <option value="">كل الحالات</option>
                        <option value="active">نشط</option>
                        <option value="paused">متوقف</option>
                        <option value="cancelled">ملغى</option>
                        <option value="expired">منتهي</option>
                    </select>
                    <select
                        value={planFilter}
                        onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
                        className="input w-auto"
                    >
                        <option value="">كل الخطط</option>
                        <option value="monthly">شهري</option>
                        <option value="yearly">سنوي</option>
                    </select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="card p-4 text-center text-destructive">{error}</div>
            )}

            {/* Subscriptions Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-right p-4 font-medium">المستخدم</th>
                                <th className="text-right p-4 font-medium">الخطة</th>
                                <th className="text-right p-4 font-medium">الحالة</th>
                                <th className="text-right p-4 font-medium">المبلغ</th>
                                <th className="text-right p-4 font-medium">تاريخ الانتهاء</th>
                                <th className="text-right p-4 font-medium">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4"><div className="skeleton h-10 w-48" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-16" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-16" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-20" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-24" /></td>
                                        <td className="p-4"><div className="skeleton h-8 w-20" /></td>
                                    </tr>
                                ))
                            ) : subscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        لا توجد اشتراكات
                                    </td>
                                </tr>
                            ) : (
                                subscriptions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium">{sub.user.fullName}</p>
                                                <p className="text-sm text-muted-foreground">{sub.user.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">{getPlanBadge(sub.planType)}</td>
                                        <td className="p-4">{getStatusBadge(sub.status)}</td>
                                        <td className="p-4 font-medium">
                                            {formatCurrency(sub.amount, sub.currency)}
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            {formatDate(sub.currentPeriodEnd)}
                                        </td>
                                        <td className="p-4">
                                            <Link
                                                href={`/admin/subscriptions/${sub.id}`}
                                                className="btn-ghost px-3 py-1.5 text-sm hover:text-primary"
                                            >
                                                عرض
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn-outline px-4 py-2 disabled:opacity-50"
                        >
                            السابق
                        </button>
                        <span className="text-sm text-muted-foreground">
                            صفحة {page} من {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="btn-outline px-4 py-2 disabled:opacity-50"
                        >
                            التالي
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

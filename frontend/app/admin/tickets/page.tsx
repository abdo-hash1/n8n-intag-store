'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Ticket {
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    user: {
        id: string;
        email: string;
        fullName: string;
    };
    assignedAdmin: {
        id: string;
        fullName: string;
    } | null;
    _count: {
        messages: number;
    };
}

interface Stats {
    total: number;
    byStatus: {
        open: number;
        waitingCustomer: number;
        waitingAdmin: number;
        resolved: number;
        closed: number;
    };
    byPriority: {
        urgent: number;
        high: number;
    };
    needsAttention: number;
}

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const limit = 20;

    useEffect(() => {
        fetchData();
    }, [page, statusFilter, categoryFilter]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminAccessToken');

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (statusFilter) params.append('status', statusFilter);
            if (categoryFilter) params.append('category', categoryFilter);

            const [ticketsRes, statsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tickets?${params}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tickets/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (!ticketsRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');

            const ticketsData = await ticketsRes.json();
            const statsData = await statsRes.json();

            setTickets(ticketsData.data || []);
            setTotal(ticketsData.meta?.total || 0);
            setStats(statsData.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
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

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; class: string }> = {
            open: { label: 'جديدة', class: 'badge-primary' },
            waiting_customer: { label: 'بانتظار العميل', class: 'badge-warning' },
            waiting_admin: { label: 'بانتظار الرد', class: 'badge-destructive' },
            resolved: { label: 'تم الحل', class: 'badge-success' },
            closed: { label: 'مغلقة', class: 'badge-secondary' },
        };
        const config = map[status] || { label: status, class: 'badge-secondary' };
        return <span className={config.class}>{config.label}</span>;
    };

    const getPriorityBadge = (priority: string) => {
        const map: Record<string, { label: string; class: string }> = {
            low: { label: 'منخفضة', class: 'text-muted-foreground' },
            normal: { label: 'عادية', class: '' },
            high: { label: 'عالية', class: 'text-warning font-medium' },
            urgent: { label: '🔥 عاجلة', class: 'text-destructive font-bold' },
        };
        const config = map[priority] || { label: priority, class: '' };
        return <span className={config.class}>{config.label}</span>;
    };

    const getCategoryLabel = (category: string) => {
        const map: Record<string, string> = {
            billing: 'الفواتير',
            technical: 'دعم فني',
            refund: 'استرداد',
            other: 'أخرى',
        };
        return map[category] || category;
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">تذاكر الدعم</h1>
                <p className="text-muted-foreground">إدارة طلبات الدعم من العملاء</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-5">
                    <div className="card p-4 text-center">
                        <p className="text-2xl font-bold text-destructive">{stats.needsAttention}</p>
                        <p className="text-sm text-muted-foreground">تحتاج اهتمام</p>
                    </div>
                    <div className="card p-4 text-center">
                        <p className="text-2xl font-bold">{stats.byStatus.open}</p>
                        <p className="text-sm text-muted-foreground">جديدة</p>
                    </div>
                    <div className="card p-4 text-center">
                        <p className="text-2xl font-bold text-warning">{stats.byStatus.waitingAdmin}</p>
                        <p className="text-sm text-muted-foreground">بانتظار الرد</p>
                    </div>
                    <div className="card p-4 text-center">
                        <p className="text-2xl font-bold text-success">{stats.byStatus.resolved}</p>
                        <p className="text-sm text-muted-foreground">تم حلها</p>
                    </div>
                    <div className="card p-4 text-center">
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">الإجمالي</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="input w-auto"
                    >
                        <option value="">كل الحالات</option>
                        <option value="open">جديدة</option>
                        <option value="waiting_admin">بانتظار الرد</option>
                        <option value="waiting_customer">بانتظار العميل</option>
                        <option value="resolved">تم الحل</option>
                        <option value="closed">مغلقة</option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                        className="input w-auto"
                    >
                        <option value="">كل الأنواع</option>
                        <option value="technical">دعم فني</option>
                        <option value="billing">الفواتير</option>
                        <option value="refund">استرداد</option>
                        <option value="other">أخرى</option>
                    </select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="card p-4 bg-destructive/10 text-destructive">{error}</div>
            )}

            {/* Tickets Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-right p-4 font-medium">التذكرة</th>
                                <th className="text-right p-4 font-medium">العميل</th>
                                <th className="text-right p-4 font-medium">الحالة</th>
                                <th className="text-right p-4 font-medium">النوع</th>
                                <th className="text-right p-4 font-medium">التاريخ</th>
                                <th className="text-right p-4 font-medium">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4"><div className="skeleton h-10 w-48" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-32" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-20" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-16" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-24" /></td>
                                        <td className="p-4"><div className="skeleton h-8 w-16" /></td>
                                    </tr>
                                ))
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        لا توجد تذاكر
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium">{ticket.subject}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {getCategoryLabel(ticket.category)} • {ticket._count.messages} رسالة
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium">{ticket.user.fullName}</p>
                                                <p className="text-xs text-muted-foreground">{ticket.user.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">{getStatusBadge(ticket.status)}</td>
                                        <td className="p-4">
                                            <span className="badge-secondary">{getCategoryLabel(ticket.category)}</span>
                                        </td>
                                        <td className="p-4 text-muted-foreground text-sm">
                                            {formatDate(ticket.createdAt)}
                                        </td>
                                        <td className="p-4">
                                            <Link
                                                href={`/admin/tickets/${ticket.id}`}
                                                className="btn-primary px-3 py-1.5 text-sm"
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

'use client';

import { useState, useEffect } from 'react';
import Pagination from '@/components/Pagination';

interface Instance {
    id: string;
    subdomain: string;
    status: string;
    instanceUrl: string | null;
    provisionedAt: string | null;
    suspendedAt: string | null;
    createdAt: string;
    lastError: string | null;
    user: {
        id: string;
        email: string;
        fullName: string;
    };
}

interface Stats {
    total: number;
    active: number;
    suspended: number;
    provisioning: number;
    error: number;
    deleted: number;
}

export default function AdminInstancesPage() {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const limit = 20;

    useEffect(() => {
        fetchInstances();
        fetchStats();
    }, [page, statusFilter]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/instance/admin/stats`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response.ok) {
                const data = await response.json();
                setStats(data.data);
            }
        } catch {
            // Stats are optional
        }
    };

    const fetchInstances = async (searchQuery?: string) => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminAccessToken');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (searchQuery || search) params.append('search', searchQuery || search);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/instance/admin/list?${params}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch instances');

            const data = await response.json();
            setInstances(data.data?.instances || []);
            setTotal(data.data?.pagination?.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchInstances(search);
    };

    const handleAction = async (userId: string, action: 'suspend' | 'resume' | 'delete' | 'provision') => {
        const confirmMessages: Record<string, string> = {
            suspend: 'هل أنت متأكد من تعليق هذه النسخة؟',
            resume: 'هل أنت متأكد من استئناف هذه النسخة؟',
            delete: 'هل أنت متأكد من حذف هذه النسخة؟ هذا الإجراء لا يمكن التراجع عنه.',
            provision: 'هل أنت متأكد من إنشاء نسخة لهذا المستخدم؟',
        };

        if (!confirm(confirmMessages[action])) return;

        try {
            setActionLoading(userId);
            const token = localStorage.getItem('adminAccessToken');
            const method = action === 'delete' ? 'DELETE' : 'POST';
            const url = action === 'provision'
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/instance/admin/${userId}/provision`
                : action === 'delete'
                    ? `${process.env.NEXT_PUBLIC_API_URL}/api/instance/admin/${userId}`
                    : `${process.env.NEXT_PUBLIC_API_URL}/api/instance/admin/${userId}/${action}`;

            const response = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'فشل في تنفيذ العملية');
            }

            // Refresh the list
            fetchInstances();
            fetchStats();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
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
            active: { label: 'نشط', class: 'badge-success' },
            suspended: { label: 'معلق', class: 'badge-warning' },
            provisioning: { label: 'جاري الإنشاء', class: 'badge-primary' },
            resuming: { label: 'جاري الاستئناف', class: 'badge-primary' },
            deleting: { label: 'جاري الحذف', class: 'badge-destructive' },
            deleted: { label: 'محذوف', class: 'badge-secondary' },
            error: { label: 'خطأ', class: 'badge-destructive' },
            pending: { label: 'معلق', class: 'badge-secondary' },
        };
        const config = map[status] || { label: status, class: 'badge-secondary' };
        return <span className={config.class}>{config.label}</span>;
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">نسخ n8n</h1>
                    <p className="text-muted-foreground">إدارة نسخ n8n للمستخدمين</p>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="card p-4 text-center">
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">الإجمالي</p>
                    </div>
                    <div className="card p-4 text-center bg-success/10">
                        <p className="text-2xl font-bold text-success">{stats.active}</p>
                        <p className="text-sm text-muted-foreground">نشط</p>
                    </div>
                    <div className="card p-4 text-center bg-warning/10">
                        <p className="text-2xl font-bold text-warning">{stats.suspended}</p>
                        <p className="text-sm text-muted-foreground">معلق</p>
                    </div>
                    <div className="card p-4 text-center bg-primary/10">
                        <p className="text-2xl font-bold text-primary">{stats.provisioning}</p>
                        <p className="text-sm text-muted-foreground">جاري الإنشاء</p>
                    </div>
                    <div className="card p-4 text-center bg-destructive/10">
                        <p className="text-2xl font-bold text-destructive">{stats.error}</p>
                        <p className="text-sm text-muted-foreground">خطأ</p>
                    </div>
                    <div className="card p-4 text-center">
                        <p className="text-2xl font-bold text-muted-foreground">{stats.deleted}</p>
                        <p className="text-sm text-muted-foreground">محذوف</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="البحث بالاسم أو البريد أو الـ subdomain..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input flex-1"
                        />
                        <button type="submit" className="btn-primary px-4 py-2">
                            بحث
                        </button>
                    </form>

                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="input w-auto"
                    >
                        <option value="">كل الحالات</option>
                        <option value="active">نشط</option>
                        <option value="suspended">معلق</option>
                        <option value="provisioning">جاري الإنشاء</option>
                        <option value="error">خطأ</option>
                        <option value="deleted">محذوف</option>
                    </select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="card p-4 text-center text-destructive">
                    {error}
                </div>
            )}

            {/* Instances Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-right p-4 font-medium">المستخدم</th>
                                <th className="text-right p-4 font-medium">Subdomain</th>
                                <th className="text-right p-4 font-medium">الحالة</th>
                                <th className="text-right p-4 font-medium">تاريخ الإنشاء</th>
                                <th className="text-right p-4 font-medium">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4"><div className="skeleton h-10 w-48" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-32" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-16" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-24" /></td>
                                        <td className="p-4"><div className="skeleton h-8 w-32" /></td>
                                    </tr>
                                ))
                            ) : instances.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        لا توجد نسخ
                                    </td>
                                </tr>
                            ) : (
                                instances.map((instance) => (
                                    <tr key={instance.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-primary font-medium">
                                                        {instance.user.fullName.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{instance.user.fullName}</p>
                                                    <p className="text-sm text-muted-foreground">{instance.user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {instance.instanceUrl ? (
                                                <a
                                                    href={instance.instanceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline"
                                                >
                                                    {instance.subdomain}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground">{instance.subdomain}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(instance.status)}
                                            {instance.lastError && (
                                                <p className="text-xs text-destructive mt-1 truncate max-w-[150px]" title={instance.lastError}>
                                                    {instance.lastError}
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-muted-foreground">
                                                {formatDate(instance.provisionedAt || instance.createdAt)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {actionLoading === instance.user.id ? (
                                                    <span className="text-muted-foreground text-sm">جاري...</span>
                                                ) : (
                                                    <>
                                                        {instance.status === 'active' && (
                                                            <button
                                                                onClick={() => handleAction(instance.user.id, 'suspend')}
                                                                className="text-warning hover:text-warning/80 text-sm"
                                                            >
                                                                تعليق
                                                            </button>
                                                        )}
                                                        {instance.status === 'suspended' && (
                                                            <button
                                                                onClick={() => handleAction(instance.user.id, 'resume')}
                                                                className="text-success hover:text-success/80 text-sm"
                                                            >
                                                                استئناف
                                                            </button>
                                                        )}
                                                        {instance.status === 'error' && (
                                                            <button
                                                                onClick={() => handleAction(instance.user.id, 'provision')}
                                                                className="text-primary hover:text-primary/80 text-sm"
                                                            >
                                                                إعادة الإنشاء
                                                            </button>
                                                        )}
                                                        {instance.status !== 'deleted' && instance.status !== 'deleting' && (
                                                            <button
                                                                onClick={() => handleAction(instance.user.id, 'delete')}
                                                                className="text-destructive hover:text-destructive/80 text-sm"
                                                            >
                                                                حذف
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
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

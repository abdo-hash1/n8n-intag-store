'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    status: string;
    instanceUrl: string | null;
    createdAt: string;
    lastLoginAt: string | null;
    _count: {
        subscriptions: number;
        supportTickets: number;
    };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const limit = 20;

    useEffect(() => {
        fetchUsers();
    }, [page, statusFilter, roleFilter]);

    const fetchUsers = async (searchQuery?: string) => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminAccessToken');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (searchQuery || search) params.append('search', searchQuery || search);
            if (statusFilter) params.append('status', statusFilter);
            if (roleFilter) params.append('role', roleFilter);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${params}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            setUsers(data.data || []);
            setTotal(data.meta?.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers(search);
    };

    const handleStatusChange = async (userId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/status`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (!response.ok) throw new Error('Failed to update status');

            // Refresh the list
            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'حدث خطأ');
        }
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
            suspended: { label: 'موقوف', class: 'badge-warning' },
            deleted: { label: 'محذوف', class: 'badge-destructive' },
        };
        const config = map[status] || { label: status, class: 'badge-secondary' };
        return <span className={config.class}>{config.label}</span>;
    };

    const getRoleBadge = (role: string) => {
        const map: Record<string, { label: string; class: string }> = {
            user: { label: 'مستخدم', class: 'badge-secondary' },
            admin: { label: 'مدير', class: 'badge-primary' },
            super_admin: { label: 'مدير عام', class: 'badge-destructive' },
            support_agent: { label: 'دعم فني', class: 'badge-warning' },
        };
        const config = map[role] || { label: role, class: 'badge-secondary' };
        return <span className={config.class}>{config.label}</span>;
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">المستخدمين</h1>
                    <p className="text-muted-foreground">إدارة حسابات المستخدمين</p>
                </div>
                <div className="text-sm text-muted-foreground">
                    إجمالي: <span className="font-bold text-foreground">{total}</span> مستخدم
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="البحث بالاسم أو البريد..."
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
                        <option value="suspended">موقوف</option>
                        <option value="deleted">محذوف</option>
                    </select>

                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className="input w-auto"
                    >
                        <option value="">كل الأدوار</option>
                        <option value="user">مستخدم</option>
                        <option value="admin">مدير</option>
                        <option value="super_admin">مدير عام</option>
                        <option value="support_agent">دعم فني</option>
                    </select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="card p-4 text-center text-destructive">
                    {error}
                </div>
            )}

            {/* Users Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-right p-4 font-medium">المستخدم</th>
                                <th className="text-right p-4 font-medium">الدور</th>
                                <th className="text-right p-4 font-medium">الحالة</th>
                                <th className="text-right p-4 font-medium">الاشتراكات</th>
                                <th className="text-right p-4 font-medium">تاريخ التسجيل</th>
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
                                        <td className="p-4"><div className="skeleton h-6 w-8" /></td>
                                        <td className="p-4"><div className="skeleton h-6 w-24" /></td>
                                        <td className="p-4"><div className="skeleton h-8 w-20" /></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        لا توجد نتائج
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-primary font-medium">
                                                        {user.fullName.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.fullName}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">{getRoleBadge(user.role)}</td>
                                        <td className="p-4">{getStatusBadge(user.status)}</td>
                                        <td className="p-4">
                                            <span className="text-muted-foreground">
                                                {user._count.subscriptions}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-muted-foreground">
                                                {formatDate(user.createdAt)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                    className="btn-ghost px-3 py-1.5 text-sm"
                                                >
                                                    عرض
                                                </Link>
                                                {user.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleStatusChange(user.id, 'suspended')}
                                                        className="text-warning hover:text-warning/80 text-sm"
                                                    >
                                                        إيقاف
                                                    </button>
                                                ) : user.status === 'suspended' ? (
                                                    <button
                                                        onClick={() => handleStatusChange(user.id, 'active')}
                                                        className="text-success hover:text-success/80 text-sm"
                                                    >
                                                        تفعيل
                                                    </button>
                                                ) : null}
                                            </div>
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

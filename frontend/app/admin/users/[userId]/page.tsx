'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    status: string;
    instanceUrl: string | null;
    emailVerified: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    subscriptions: Array<{
        id: string;
        planType: string;
        status: string;
        amount: number;
        currentPeriodEnd: string;
    }>;
    supportTickets: Array<{
        id: string;
        subject: string;
        status: string;
        createdAt: string;
    }>;
    _count: {
        subscriptions: number;
        supportTickets: number;
        payments: number;
    };
}

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUser();
    }, [params.userId]);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${params.userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch user');

            const data = await response.json();
            setUser(data.data?.user);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${params.userId}/status`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );
            fetchUser();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
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
            active: { label: 'نشط', class: 'badge-success' },
            suspended: { label: 'معلق', class: 'badge-warning' },
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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-8 w-48" />
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-6"><div className="skeleton h-32 w-full" /></div>
                    </div>
                    <div className="space-y-6">
                        <div className="card p-6"><div className="skeleton h-48 w-full" /></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="card p-6 text-center">
                <p className="text-destructive mb-4">{error || 'المستخدم غير موجود'}</p>
                <Link href="/admin/users" className="btn-primary px-4 py-2">
                    العودة للمستخدمين
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Link
                    href="/admin/users"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(user.status)}
                        {getRoleBadge(user.role)}
                    </div>
                    <h1 className="text-2xl font-bold">{user.fullName}</h1>
                    <p className="text-muted-foreground">{user.email}</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* User Info */}
                    <div className="card p-6">
                        <h2 className="font-bold text-lg mb-4">معلومات المستخدم</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                                <p className="font-medium">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                                <p className="font-medium">{user.phone || 'غير محدد'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
                                <p className="font-medium">{formatDate(user.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">آخر دخول</p>
                                <p className="font-medium">{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'لم يسجل دخول'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">تأكيد البريد</p>
                                <p className="font-medium">{user.emailVerified ? '✓ مؤكد' : '✗ غير مؤكد'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">رابط n8n</p>
                                <p className="font-medium">{user.instanceUrl || 'غير موجود'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Subscriptions */}
                    <div className="card p-6">
                        <h2 className="font-bold text-lg mb-4">الاشتراكات ({user._count.subscriptions})</h2>
                        {user.subscriptions.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">لا توجد اشتراكات</p>
                        ) : (
                            <div className="space-y-3">
                                {user.subscriptions.map((sub) => (
                                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <p className="font-medium">{sub.planType === 'yearly' ? 'سنوي' : 'شهري'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                ينتهي: {formatDate(sub.currentPeriodEnd)}
                                            </p>
                                        </div>
                                        <span className={`badge-${sub.status === 'active' ? 'success' : 'secondary'}`}>
                                            {sub.status === 'active' ? 'نشط' : sub.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Support Tickets */}
                    <div className="card p-6">
                        <h2 className="font-bold text-lg mb-4">تذاكر الدعم ({user._count.supportTickets})</h2>
                        {user.supportTickets.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">لا توجد تذاكر</p>
                        ) : (
                            <div className="space-y-3">
                                {user.supportTickets.slice(0, 5).map((ticket) => (
                                    <Link
                                        key={ticket.id}
                                        href={`/admin/tickets/${ticket.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium">{ticket.subject}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(ticket.createdAt)}
                                            </p>
                                        </div>
                                        <span className={`badge-${ticket.status === 'open' ? 'primary' : ticket.status === 'resolved' ? 'success' : 'secondary'}`}>
                                            {ticket.status === 'open' ? 'جديدة' : ticket.status === 'resolved' ? 'محلولة' : ticket.status}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="card p-6">
                        <h3 className="font-bold mb-4">إحصائيات</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">الاشتراكات</span>
                                <span className="font-bold">{user._count.subscriptions}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">التذاكر</span>
                                <span className="font-bold">{user._count.supportTickets}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">المدفوعات</span>
                                <span className="font-bold">{user._count.payments}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="card p-6">
                        <h3 className="font-bold mb-4">إجراءات</h3>
                        <div className="space-y-3">
                            <select
                                value={user.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="input w-full"
                            >
                                <option value="active">نشط</option>
                                <option value="suspended">معلق</option>
                                <option value="deleted">محذوف</option>
                            </select>

                            {user.status === 'suspended' && (
                                <button
                                    onClick={() => handleStatusChange('active')}
                                    className="btn-success w-full py-2"
                                >
                                    ✓ تفعيل الحساب
                                </button>
                            )}

                            {user.status === 'active' && (
                                <button
                                    onClick={() => handleStatusChange('suspended')}
                                    className="btn-warning w-full py-2"
                                >
                                    ⚠ تعليق الحساب
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

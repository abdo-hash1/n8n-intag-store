'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ActivityLog {
    id: string;
    action: string;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
    user: {
        id: string;
        email: string;
        fullName: string;
    } | null;
}

export default function AdminActivityPage() {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/activity?limit=100`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch activity');

            const data = await response.json();
            setActivities(data.data?.activity || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
    };

    const getActivityLabel = (action: string): string => {
        const labels: Record<string, string> = {
            'user_signup': 'تسجيل مستخدم جديد',
            'user_login': 'تسجيل دخول',
            'user_logout': 'تسجيل خروج',
            'password_reset': 'إعادة تعيين كلمة المرور',
            'subscription_created': 'إنشاء اشتراك',
            'subscription_paused': 'إيقاف اشتراك',
            'subscription_cancelled': 'إلغاء اشتراك',
            'subscription_renewed': 'تجديد اشتراك',
            'payment_success': 'دفعة ناجحة',
            'payment_failed': 'فشل في الدفع',
            'refund_requested': 'طلب استرداد',
            'refund_approved': 'الموافقة على استرداد',
            'refund_rejected': 'رفض استرداد',
            'ticket_created': 'إنشاء تذكرة دعم',
            'ticket_replied': 'الرد على تذكرة',
            'ticket_resolved': 'حل تذكرة',
            'admin_user_status_changed': 'تغيير حالة مستخدم',
            'admin_user_role_changed': 'تغيير صلاحيات مستخدم',
            'admin_user_created': 'إنشاء مستخدم إداري',
            'admin_setting_updated': 'تحديث إعدادات النظام',
        };
        return labels[action] || action;
    };

    const getActivityColor = (action: string): string => {
        if (action.includes('signup') || action.includes('created')) return 'bg-success/10 text-success';
        if (action.includes('login')) return 'bg-primary/10 text-primary';
        if (action.includes('cancelled') || action.includes('failed') || action.includes('rejected')) return 'bg-destructive/10 text-destructive';
        if (action.includes('payment') || action.includes('renewed')) return 'bg-warning/10 text-warning';
        if (action.includes('ticket')) return 'bg-blue-500/10 text-blue-500';
        if (action.includes('admin')) return 'bg-purple-500/10 text-purple-500';
        return 'bg-muted text-muted-foreground';
    };

    const getActivityIcon = (action: string) => {
        if (action.includes('signup') || action.includes('user')) {
            return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
        }
        if (action.includes('payment') || action.includes('subscription')) {
            return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
        }
        if (action.includes('ticket')) {
            return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>;
        }
        if (action.includes('admin') || action.includes('setting')) {
            return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
        }
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    };

    const formatDateTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatRelativeTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return formatDateTime(dateString);
    };

    const parseDetails = (details: string | null): Record<string, unknown> | null => {
        if (!details) return null;
        try {
            return JSON.parse(details);
        } catch {
            return null;
        }
    };

    // Get unique action types for filter
    const actionTypes = Array.from(new Set(activities.map(a => a.action)));

    const filteredActivities = filter
        ? activities.filter(a => a.action === filter)
        : activities;

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">سجل النشاطات</h1>
                    <p className="text-muted-foreground">جميع الأنشطة والإجراءات في النظام</p>
                </div>
            </div>

            {/* Filter */}
            <div className="card p-4">
                <div className="flex items-center gap-4">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="input w-auto"
                    >
                        <option value="">كل الأنشطة</option>
                        {actionTypes.map(action => (
                            <option key={action} value={action}>
                                {getActivityLabel(action)}
                            </option>
                        ))}
                    </select>
                    <span className="text-sm text-muted-foreground">
                        عرض {filteredActivities.length} من {activities.length} نشاط
                    </span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="card p-4 text-center text-destructive">{error}</div>
            )}

            {/* Activity List */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="divide-y">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-4">
                                <div className="skeleton w-12 h-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-4 w-48" />
                                    <div className="skeleton h-3 w-32" />
                                </div>
                                <div className="skeleton h-4 w-24" />
                            </div>
                        ))}
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-lg">لا توجد نشاطات</p>
                        <p className="text-sm">سيظهر هنا سجل جميع الإجراءات في النظام</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredActivities.map((activity) => {
                            const details = parseDetails(activity.details);
                            return (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.action)}`}>
                                        {getActivityIcon(activity.action)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">
                                            {getActivityLabel(activity.action)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {activity.user?.fullName || activity.user?.email || 'نظام'}
                                            {activity.user?.email && (
                                                <span className="text-xs opacity-70"> ({activity.user.email})</span>
                                            )}
                                        </p>
                                        {details && Object.keys(details).length > 0 && (
                                            <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                                {Object.entries(details).map(([key, value]) => (
                                                    <div key={key}>
                                                        <span className="font-medium">{key}:</span> {String(value)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {activity.ipAddress && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                IP: {activity.ipAddress}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground text-left flex-shrink-0">
                                        <p>{formatRelativeTime(activity.createdAt)}</p>
                                        <p className="text-xs opacity-70">{formatDateTime(activity.createdAt)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

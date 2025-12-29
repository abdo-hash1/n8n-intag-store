'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface InstanceStatus {
    hasInstance: boolean;
    containerId?: string;
    instanceUrl?: string;
    port?: number;
    status?: 'running' | 'stopped' | 'error' | 'not_found';
}

interface Subscription {
    id: string;
    status: string;
    planType: string;
}

export default function InstancePage() {
    const [instanceStatus, setInstanceStatus] = useState<InstanceStatus | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [logs, setLogs] = useState<string>('');
    const [showLogs, setShowLogs] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([fetchInstanceStatus(), fetchSubscription()]);
        setIsLoading(false);
    };

    const fetchInstanceStatus = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/instance/status`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setInstanceStatus(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch instance status:', error);
        }
    };

    const fetchSubscription = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/subscription`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setSubscription(data.data.subscription);
            }
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
        }
    };

    const performAction = async (action: string) => {
        setIsActionLoading(true);
        setActiveAction(action);
        setError('');
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/instance/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل في تنفيذ العملية');
            }

            // Show success message
            const messages: Record<string, string> = {
                start: 'تم تشغيل المنصة بنجاح',
                stop: 'تم إيقاف المنصة بنجاح',
                restart: 'تم إعادة تشغيل المنصة بنجاح',
                provision: 'تم إنشاء المنصة بنجاح! جاري التشغيل...',
            };
            setSuccessMessage(messages[action] || 'تمت العملية بنجاح');

            // Refresh status
            await fetchInstanceStatus();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsActionLoading(false);
            setActiveAction(null);
        }
    };

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/instance/logs?lines=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data.data.logs || 'لا توجد سجلات');
            }
        } catch (error) {
            setLogs('فشل في تحميل السجلات');
        }
    };

    const handleShowLogs = async () => {
        setShowLogs(true);
        await fetchLogs();
    };

    const getStatusInfo = (status?: string) => {
        const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
            running: { label: 'يعمل', color: 'text-success', bgColor: 'bg-success' },
            stopped: { label: 'متوقف', color: 'text-warning', bgColor: 'bg-warning' },
            error: { label: 'خطأ', color: 'text-destructive', bgColor: 'bg-destructive' },
            not_found: { label: 'غير موجود', color: 'text-muted-foreground', bgColor: 'bg-muted' },
        };
        return statusMap[status || 'not_found'] || statusMap.not_found;
    };

    const statusInfo = getStatusInfo(instanceStatus?.status);

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6 animate-in">
                <div>
                    <div className="skeleton h-8 w-48 mb-2" />
                    <div className="skeleton h-4 w-64" />
                </div>
                <div className="card p-8">
                    <div className="flex items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    // No subscription state
    if (!subscription || subscription.status !== 'active') {
        return (
            <div className="space-y-6 animate-in">
                <div>
                    <h1 className="text-3xl font-bold mb-2">منصة n8n الخاصة بك</h1>
                    <p className="text-muted-foreground">إدارة منصة الأتمتة الخاصة بك</p>
                </div>

                <div className="card p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-3">يتطلب اشتراك نشط</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        للوصول إلى منصة n8n الخاصة بك، يجب أن يكون لديك اشتراك نشط.
                        اشترك الآن للبدء في أتمتة أعمالك.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link href="/pricing" className="btn-primary px-6 py-3">
                            عرض الأسعار
                        </Link>
                        <Link href="/dashboard/subscription" className="btn-outline px-6 py-3">
                            إدارة الاشتراك
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // No instance yet - show provision button
    if (!instanceStatus?.hasInstance) {
        return (
            <div className="space-y-6 animate-in">
                <div>
                    <h1 className="text-3xl font-bold mb-2">منصة n8n الخاصة بك</h1>
                    <p className="text-muted-foreground">إدارة منصة الأتمتة الخاصة بك</p>
                </div>

                {error && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="p-4 bg-success/10 text-success rounded-lg">
                        {successMessage}
                    </div>
                )}

                <div className="card p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-success/20 to-success/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-3">جاهز لإنشاء منصتك!</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        اشتراكك نشط. اضغط على الزر أدناه لإنشاء منصة n8n الخاصة بك.
                        سيستغرق ذلك دقيقة واحدة تقريباً.
                    </p>
                    <button
                        onClick={() => performAction('provision')}
                        disabled={isActionLoading}
                        className="btn-primary px-8 py-4 text-lg disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                        {isActionLoading && activeAction === 'provision' ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                جاري الإنشاء...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                إنشاء منصة n8n
                            </>
                        )}
                    </button>
                </div>

                {/* What you'll get */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold mb-4">ما ستحصل عليه:</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            { icon: '🔗', title: 'أكثر من 400 تكامل', desc: 'تكامل مع جميع الخدمات الشائعة' },
                            { icon: '🔒', title: 'آمن ومشفر', desc: 'بياناتك محمية بالكامل' },
                            { icon: '⚡', title: 'أداء عالي', desc: 'تشغيل سريع ومستقر' },
                            { icon: '🌐', title: 'واجهة عربية', desc: 'دعم كامل للغة العربية' },
                            { icon: '💾', title: 'نسخ احتياطي', desc: 'نسخ احتياطي يومي تلقائي' },
                            { icon: '🛟', title: 'دعم فني', desc: 'فريق دعم متاح لمساعدتك' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <span className="text-2xl">{item.icon}</span>
                                <div>
                                    <p className="font-medium">{item.title}</p>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Instance exists - show management UI
    return (
        <div className="space-y-6 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">منصة n8n الخاصة بك</h1>
                    <p className="text-muted-foreground">إدارة منصة الأتمتة الخاصة بك</p>
                </div>

                {instanceStatus.instanceUrl && instanceStatus.status === 'running' && (
                    <a
                        href={instanceStatus.instanceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary px-6 py-3 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        فتح n8n
                    </a>
                )}
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="p-4 bg-success/10 text-success rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {successMessage}
                </div>
            )}

            {/* Status Card */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">حالة المنصة</h2>
                    <button
                        onClick={fetchInstanceStatus}
                        className="btn-outline px-3 py-2 text-sm"
                        disabled={isActionLoading}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Status */}
                    <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-2">الحالة</p>
                        <div className="flex items-center gap-2">
                            <span className={`relative flex h-3 w-3`}>
                                {instanceStatus.status === 'running' && (
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusInfo.bgColor} opacity-75`} />
                                )}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${statusInfo.bgColor}`} />
                            </span>
                            <span className={`font-semibold ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* URL */}
                    <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-2">رابط المنصة</p>
                        {instanceStatus.instanceUrl ? (
                            <a
                                href={instanceStatus.instanceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm break-all"
                            >
                                {instanceStatus.instanceUrl}
                            </a>
                        ) : (
                            <p className="text-muted-foreground">-</p>
                        )}
                    </div>

                    {/* Container ID */}
                    <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-2">معرف الحاوية</p>
                        <p className="font-mono text-sm">
                            {instanceStatus.containerId?.slice(0, 12) || '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions Card */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">التحكم بالمنصة</h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Start */}
                    <button
                        onClick={() => performAction('start')}
                        disabled={isActionLoading || instanceStatus.status === 'running'}
                        className="flex items-center gap-3 p-4 rounded-lg border border-success/30 bg-success/5 hover:bg-success/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isActionLoading && activeAction === 'start' ? (
                            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-success border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        )}
                        <div className="text-right">
                            <p className="font-medium text-success">تشغيل</p>
                            <p className="text-xs text-muted-foreground">بدء المنصة</p>
                        </div>
                    </button>

                    {/* Stop */}
                    <button
                        onClick={() => performAction('stop')}
                        disabled={isActionLoading || instanceStatus.status !== 'running'}
                        className="flex items-center gap-3 p-4 rounded-lg border border-warning/30 bg-warning/5 hover:bg-warning/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isActionLoading && activeAction === 'stop' ? (
                            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-warning border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                            </div>
                        )}
                        <div className="text-right">
                            <p className="font-medium text-warning">إيقاف</p>
                            <p className="text-xs text-muted-foreground">إيقاف المنصة</p>
                        </div>
                    </button>

                    {/* Restart */}
                    <button
                        onClick={() => performAction('restart')}
                        disabled={isActionLoading || instanceStatus.status !== 'running'}
                        className="flex items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isActionLoading && activeAction === 'restart' ? (
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                        )}
                        <div className="text-right">
                            <p className="font-medium text-primary">إعادة تشغيل</p>
                            <p className="text-xs text-muted-foreground">Restart</p>
                        </div>
                    </button>

                    {/* View Logs */}
                    <button
                        onClick={handleShowLogs}
                        disabled={isActionLoading}
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="text-right">
                            <p className="font-medium">السجلات</p>
                            <p className="text-xs text-muted-foreground">عرض اللوق</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Logs Modal */}
            {showLogs && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-4xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold">سجلات المنصة</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchLogs}
                                    className="btn-outline px-3 py-2 text-sm"
                                >
                                    تحديث
                                </button>
                                <button
                                    onClick={() => setShowLogs(false)}
                                    className="p-2 hover:bg-muted rounded-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="bg-muted/50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap text-left" dir="ltr">
                                {logs || 'جاري تحميل السجلات...'}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Help Card */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">معلومات مفيدة</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-muted/50">
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                            <span className="text-lg">📚</span>
                            كيفية الاستخدام
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            تعلم كيفية إنشاء أول workflow في n8n من خلال الدليل المفصل.
                        </p>
                        <a
                            href="https://docs.n8n.io/try-it-out/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                        >
                            عرض الدليل ←
                        </a>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                            <span className="text-lg">🔌</span>
                            التكاملات
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            اكتشف أكثر من 400 تكامل متاح لربط تطبيقاتك المفضلة.
                        </p>
                        <a
                            href="https://n8n.io/integrations/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                        >
                            استعراض التكاملات ←
                        </a>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                            <span className="text-lg">💡</span>
                            مكتبة القوالب
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            ابدأ بسرعة مع قوالب جاهزة للاستخدام من مجتمع n8n.
                        </p>
                        <a
                            href="https://n8n.io/workflows/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                        >
                            تصفح القوالب ←
                        </a>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                            <span className="text-lg">🛟</span>
                            الدعم الفني
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            تحتاج مساعدة؟ فريق الدعم جاهز لمساعدتك على مدار الساعة.
                        </p>
                        <Link href="/dashboard/support" className="text-sm text-primary hover:underline">
                            فتح تذكرة دعم ←
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

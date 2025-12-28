'use client';

import { useState, useEffect } from 'react';

interface Settings {
    monthly_price?: number;
    annual_price?: number;
    currency?: string;
    refund_period_days?: number;
    grace_period_days?: number;
    free_trial_enabled?: boolean;
    pause_enabled?: boolean;
    refunds_enabled?: boolean;
    maintenance_mode?: boolean;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch settings');

            const data = await response.json();
            setSettings(data.data?.settings || {});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
    };

    const updateSetting = async (key: string, value: unknown) => {
        try {
            setIsSaving(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/${key}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ value }),
                }
            );

            if (!response.ok) throw new Error('Failed to update setting');

            setSettings((prev) => ({ ...prev, [key]: value }));
            setSuccess('تم حفظ الإعداد بنجاح');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-10 w-48" />
                <div className="card p-6 space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton h-12 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">الإعدادات</h1>
                <p className="text-muted-foreground">إعدادات النظام والتكوين</p>
            </div>

            {/* Messages */}
            {error && (
                <div className="card p-4 bg-destructive/10 text-destructive">
                    {error}
                </div>
            )}
            {success && (
                <div className="card p-4 bg-success/10 text-success">
                    {success}
                </div>
            )}

            {/* Pricing Settings */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">إعدادات الأسعار</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            السعر الشهري (EGP)
                        </label>
                        <input
                            type="number"
                            value={settings.monthly_price || 400}
                            onChange={(e) => updateSetting('monthly_price', parseInt(e.target.value))}
                            className="input"
                            disabled={isSaving}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            السعر السنوي (EGP)
                        </label>
                        <input
                            type="number"
                            value={settings.annual_price || 3800}
                            onChange={(e) => updateSetting('annual_price', parseInt(e.target.value))}
                            className="input"
                            disabled={isSaving}
                        />
                    </div>
                </div>
            </div>

            {/* Business Rules */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">قواعد العمل</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            فترة الاسترداد (أيام)
                        </label>
                        <input
                            type="number"
                            value={settings.refund_period_days || 7}
                            onChange={(e) => updateSetting('refund_period_days', parseInt(e.target.value))}
                            className="input"
                            disabled={isSaving}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            المدة المسموحة لطلب الاسترداد بعد الاشتراك
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            فترة السماح (أيام)
                        </label>
                        <input
                            type="number"
                            value={settings.grace_period_days || 7}
                            onChange={(e) => updateSetting('grace_period_days', parseInt(e.target.value))}
                            className="input"
                            disabled={isSaving}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            المدة قبل تعليق الخدمة عند فشل الدفع
                        </p>
                    </div>
                </div>
            </div>

            {/* Feature Toggles */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">الميزات</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                            <p className="font-medium">تفعيل إيقاف الاشتراك مؤقتاً</p>
                            <p className="text-sm text-muted-foreground">
                                السماح للمستخدمين بإيقاف اشتراكهم مؤقتاً
                            </p>
                        </div>
                        <button
                            onClick={() => updateSetting('pause_enabled', !settings.pause_enabled)}
                            disabled={isSaving}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.pause_enabled ? 'bg-primary' : 'bg-muted'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.pause_enabled ? 'translate-x-1' : 'translate-x-6'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                            <p className="font-medium">تفعيل الاسترداد</p>
                            <p className="text-sm text-muted-foreground">
                                السماح بطلبات استرداد المبالغ
                            </p>
                        </div>
                        <button
                            onClick={() => updateSetting('refunds_enabled', !settings.refunds_enabled)}
                            disabled={isSaving}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.refunds_enabled ? 'bg-primary' : 'bg-muted'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.refunds_enabled ? 'translate-x-1' : 'translate-x-6'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-warning/50 bg-warning/5">
                        <div>
                            <p className="font-medium">وضع الصيانة</p>
                            <p className="text-sm text-muted-foreground">
                                ⚠️ تفعيل هذا سيمنع المستخدمين من الوصول للموقع
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                if (settings.maintenance_mode || confirm('هل أنت متأكد من تفعيل وضع الصيانة؟')) {
                                    updateSetting('maintenance_mode', !settings.maintenance_mode);
                                }
                            }}
                            disabled={isSaving}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenance_mode ? 'bg-destructive' : 'bg-muted'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenance_mode ? 'translate-x-1' : 'translate-x-6'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">معلومات النظام</h2>
                <div className="grid gap-4 text-sm">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">إصدار النظام</span>
                        <span className="font-mono">1.0.0</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">البيئة</span>
                        <span className="badge-secondary">Development</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">آخر تحديث</span>
                        <span>{new Date().toLocaleDateString('ar-EG')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

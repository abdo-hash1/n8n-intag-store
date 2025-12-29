'use client';

import { useState, useEffect } from 'react';

interface Settings {
    // Pricing
    monthly_price?: number;
    annual_price?: number;
    currency?: string;
    // Business Rules
    refund_period_days?: number;
    grace_period_days?: number;
    data_retention_days?: number;
    // Features
    free_trial_enabled?: boolean;
    free_trial_days?: number;
    pause_enabled?: boolean;
    refunds_enabled?: boolean;
    maintenance_mode?: boolean;
    new_signups_enabled?: boolean;
    // API Keys (display only, actual storage handled securely)
    paymob_configured?: boolean;
    sendgrid_configured?: boolean;
    // n8n
    n8n_base_port?: number;
    n8n_domain?: string;
}

type TabType = 'general' | 'pricing' | 'features' | 'integrations' | 'system';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Integration forms (for API keys)
    const [paymobForm, setPaymobForm] = useState({
        apiKey: '',
        integrationId: '',
        iframeId: '',
        hmacSecret: '',
    });
    const [sendgridForm, setSendgridForm] = useState({
        apiKey: '',
        fromEmail: '',
        fromName: '',
    });

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

    const updateMultipleSettings = async (settingsToUpdate: Record<string, unknown>) => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('adminAccessToken');

            for (const [key, value] of Object.entries(settingsToUpdate)) {
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

                if (!response.ok) throw new Error(`Failed to update ${key}`);
                setSettings((prev) => ({ ...prev, [key]: value }));
            }

            setSuccess('تم حفظ جميع الإعدادات بنجاح');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePaymob = async () => {
        if (!paymobForm.apiKey || !paymobForm.integrationId) {
            setError('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        await updateMultipleSettings({
            paymob_api_key: paymobForm.apiKey,
            paymob_integration_id: paymobForm.integrationId,
            paymob_iframe_id: paymobForm.iframeId,
            paymob_hmac_secret: paymobForm.hmacSecret,
            paymob_configured: true,
        });

        // Clear form for security
        setPaymobForm({ apiKey: '', integrationId: '', iframeId: '', hmacSecret: '' });
    };

    const handleSaveSendgrid = async () => {
        if (!sendgridForm.apiKey || !sendgridForm.fromEmail) {
            setError('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        await updateMultipleSettings({
            sendgrid_api_key: sendgridForm.apiKey,
            sendgrid_from_email: sendgridForm.fromEmail,
            sendgrid_from_name: sendgridForm.fromName || 'n8n SaaS Platform',
            sendgrid_configured: true,
        });

        // Clear form for security
        setSendgridForm({ apiKey: '', fromEmail: '', fromName: '' });
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'general', label: 'عام', icon: '⚙️' },
        { id: 'pricing', label: 'الأسعار', icon: '💰' },
        { id: 'features', label: 'الميزات', icon: '🎛️' },
        { id: 'integrations', label: 'التكاملات', icon: '🔌' },
        { id: 'system', label: 'النظام', icon: '🖥️' },
    ];

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
                <div className="card p-4 bg-destructive/10 text-destructive flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}
            {success && (
                <div className="card p-4 bg-success/10 text-success flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {success}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto border-b">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                        className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-4">قواعد العمل</h2>
                        <div className="grid gap-6 md:grid-cols-2">
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
                                    min={0}
                                    max={30}
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
                                    min={0}
                                    max={30}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    المدة قبل تعليق الخدمة عند فشل الدفع
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    مدة الاحتفاظ بالبيانات (أيام)
                                </label>
                                <input
                                    type="number"
                                    value={settings.data_retention_days || 30}
                                    onChange={(e) => updateSetting('data_retention_days', parseInt(e.target.value))}
                                    className="input"
                                    disabled={isSaving}
                                    min={7}
                                    max={365}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    مدة الاحتفاظ ببيانات المستخدم بعد إلغاء الاشتراك
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-4">إعدادات n8n</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    منفذ البداية
                                </label>
                                <input
                                    type="number"
                                    value={settings.n8n_base_port || 5000}
                                    onChange={(e) => updateSetting('n8n_base_port', parseInt(e.target.value))}
                                    className="input"
                                    disabled={isSaving}
                                    min={1000}
                                    max={65535}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    رقم المنفذ الأول لإنشاء حاويات n8n
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    النطاق الأساسي
                                </label>
                                <input
                                    type="text"
                                    value={settings.n8n_domain || 'n8n.yourdomain.com'}
                                    onChange={(e) => updateSetting('n8n_domain', e.target.value)}
                                    className="input"
                                    disabled={isSaving}
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    النطاق المستخدم لحاويات n8n
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-4">إعدادات الأسعار</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                                min={0}
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
                                min={0}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">العملة</label>
                            <select
                                value={settings.currency || 'EGP'}
                                onChange={(e) => updateSetting('currency', e.target.value)}
                                className="input"
                                disabled={isSaving}
                            >
                                <option value="EGP">جنيه مصري (EGP)</option>
                                <option value="USD">دولار أمريكي (USD)</option>
                                <option value="SAR">ريال سعودي (SAR)</option>
                                <option value="AED">درهم إماراتي (AED)</option>
                            </select>
                        </div>
                    </div>

                    {/* Pricing Preview */}
                    <div className="mt-6 p-4 rounded-lg bg-muted/50">
                        <h3 className="font-medium mb-3">معاينة الأسعار</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-lg bg-card border">
                                <p className="text-sm text-muted-foreground">الخطة الشهرية</p>
                                <p className="text-2xl font-bold">{settings.monthly_price || 400} {settings.currency || 'EGP'}</p>
                                <p className="text-xs text-muted-foreground">/شهر</p>
                            </div>
                            <div className="p-4 rounded-lg bg-card border border-primary/50">
                                <p className="text-sm text-muted-foreground">الخطة السنوية</p>
                                <p className="text-2xl font-bold">{settings.annual_price || 3800} {settings.currency || 'EGP'}</p>
                                <p className="text-xs text-muted-foreground">/سنة</p>
                                <p className="text-xs text-primary mt-1">
                                    وفر {Math.round((1 - (settings.annual_price || 3800) / ((settings.monthly_price || 400) * 12)) * 100)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-4">تفعيل/تعطيل الميزات</h2>
                    <div className="space-y-4">
                        <ToggleSetting
                            label="تسجيل المستخدمين الجدد"
                            description="السماح للمستخدمين الجدد بإنشاء حسابات"
                            enabled={settings.new_signups_enabled !== false}
                            onChange={(v) => updateSetting('new_signups_enabled', v)}
                            disabled={isSaving}
                        />

                        <ToggleSetting
                            label="فترة تجريبية مجانية"
                            description="تفعيل فترة تجريبية للمستخدمين الجدد"
                            enabled={settings.free_trial_enabled === true}
                            onChange={(v) => updateSetting('free_trial_enabled', v)}
                            disabled={isSaving}
                        />

                        {settings.free_trial_enabled && (
                            <div className="mr-8 p-4 bg-muted/50 rounded-lg">
                                <label className="block text-sm font-medium mb-2">
                                    مدة الفترة التجريبية (أيام)
                                </label>
                                <input
                                    type="number"
                                    value={settings.free_trial_days || 7}
                                    onChange={(e) => updateSetting('free_trial_days', parseInt(e.target.value))}
                                    className="input w-32"
                                    disabled={isSaving}
                                    min={1}
                                    max={30}
                                />
                            </div>
                        )}

                        <ToggleSetting
                            label="إيقاف الاشتراك مؤقتاً"
                            description="السماح للمستخدمين بإيقاف اشتراكهم مؤقتاً"
                            enabled={settings.pause_enabled === true}
                            onChange={(v) => updateSetting('pause_enabled', v)}
                            disabled={isSaving}
                        />

                        <ToggleSetting
                            label="طلبات الاسترداد"
                            description="السماح بطلبات استرداد المبالغ"
                            enabled={settings.refunds_enabled === true}
                            onChange={(v) => updateSetting('refunds_enabled', v)}
                            disabled={isSaving}
                        />

                        <div className="border-t pt-4 mt-4">
                            <ToggleSetting
                                label="وضع الصيانة"
                                description="⚠️ تفعيل هذا سيمنع المستخدمين من الوصول للموقع"
                                enabled={settings.maintenance_mode === true}
                                onChange={(v) => {
                                    if (!v || confirm('هل أنت متأكد من تفعيل وضع الصيانة؟')) {
                                        updateSetting('maintenance_mode', v);
                                    }
                                }}
                                disabled={isSaving}
                                variant="warning"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
                <div className="space-y-6">
                    {/* Paymob */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <span className="text-2xl">💳</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Paymob</h2>
                                    <p className="text-sm text-muted-foreground">بوابة الدفع الإلكتروني</p>
                                </div>
                            </div>
                            <span className={`badge ${settings.paymob_configured ? 'badge-success' : 'badge-warning'}`}>
                                {settings.paymob_configured ? 'مُفعّل' : 'غير مُفعّل'}
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium mb-2">API Key *</label>
                                <input
                                    type="password"
                                    value={paymobForm.apiKey}
                                    onChange={(e) => setPaymobForm({ ...paymobForm, apiKey: e.target.value })}
                                    placeholder={settings.paymob_configured ? '••••••••' : 'أدخل مفتاح API'}
                                    className="input"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Integration ID *</label>
                                <input
                                    type="text"
                                    value={paymobForm.integrationId}
                                    onChange={(e) => setPaymobForm({ ...paymobForm, integrationId: e.target.value })}
                                    placeholder={settings.paymob_configured ? '••••••••' : 'معرف التكامل'}
                                    className="input"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">iFrame ID</label>
                                <input
                                    type="text"
                                    value={paymobForm.iframeId}
                                    onChange={(e) => setPaymobForm({ ...paymobForm, iframeId: e.target.value })}
                                    placeholder="معرف الـ iFrame"
                                    className="input"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">HMAC Secret</label>
                                <input
                                    type="password"
                                    value={paymobForm.hmacSecret}
                                    onChange={(e) => setPaymobForm({ ...paymobForm, hmacSecret: e.target.value })}
                                    placeholder="المفتاح السري للتوقيع"
                                    className="input"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleSavePaymob}
                                disabled={isSaving || (!paymobForm.apiKey && !paymobForm.integrationId)}
                                className="btn-primary px-6 py-2 disabled:opacity-50"
                            >
                                {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات Paymob'}
                            </button>
                        </div>
                    </div>

                    {/* SendGrid */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                                    <span className="text-2xl">📧</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">SendGrid</h2>
                                    <p className="text-sm text-muted-foreground">خدمة إرسال البريد الإلكتروني</p>
                                </div>
                            </div>
                            <span className={`badge ${settings.sendgrid_configured ? 'badge-success' : 'badge-warning'}`}>
                                {settings.sendgrid_configured ? 'مُفعّل' : 'غير مُفعّل'}
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">API Key *</label>
                                <input
                                    type="password"
                                    value={sendgridForm.apiKey}
                                    onChange={(e) => setSendgridForm({ ...sendgridForm, apiKey: e.target.value })}
                                    placeholder={settings.sendgrid_configured ? '••••••••' : 'SG.xxxxxxxx'}
                                    className="input"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">البريد المرسل *</label>
                                <input
                                    type="email"
                                    value={sendgridForm.fromEmail}
                                    onChange={(e) => setSendgridForm({ ...sendgridForm, fromEmail: e.target.value })}
                                    placeholder="noreply@yourdomain.com"
                                    className="input"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">اسم المرسل</label>
                                <input
                                    type="text"
                                    value={sendgridForm.fromName}
                                    onChange={(e) => setSendgridForm({ ...sendgridForm, fromName: e.target.value })}
                                    placeholder="n8n SaaS Platform"
                                    className="input"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleSaveSendgrid}
                                disabled={isSaving || (!sendgridForm.apiKey && !sendgridForm.fromEmail)}
                                className="btn-primary px-6 py-2 disabled:opacity-50"
                            >
                                {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات SendGrid'}
                            </button>
                        </div>
                    </div>

                    {/* Webhook URLs */}
                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-4">عناوين Webhook</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            استخدم هذه العناوين في لوحة تحكم الخدمات الخارجية
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Paymob Webhook URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={`${process.env.NEXT_PUBLIC_API_URL}/api/payments/webhook/paymob`}
                                        readOnly
                                        className="input flex-1 bg-muted cursor-pointer"
                                        dir="ltr"
                                        onClick={(e) => {
                                            (e.target as HTMLInputElement).select();
                                            navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/webhook/paymob`);
                                            setSuccess('تم نسخ الرابط!');
                                            setTimeout(() => setSuccess(''), 2000);
                                        }}
                                    />
                                    <button
                                        className="btn-outline px-3"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/webhook/paymob`);
                                            setSuccess('تم نسخ الرابط!');
                                            setTimeout(() => setSuccess(''), 2000);
                                        }}
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-4">معلومات النظام</h2>
                        <div className="grid gap-4 text-sm">
                            <div className="flex justify-between py-3 border-b">
                                <span className="text-muted-foreground">إصدار النظام</span>
                                <span className="font-mono">1.0.0</span>
                            </div>
                            <div className="flex justify-between py-3 border-b">
                                <span className="text-muted-foreground">البيئة</span>
                                <span className="badge-secondary">
                                    {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                                </span>
                            </div>
                            <div className="flex justify-between py-3 border-b">
                                <span className="text-muted-foreground">عنوان API</span>
                                <span className="font-mono text-xs" dir="ltr">{process.env.NEXT_PUBLIC_API_URL}</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-muted-foreground">آخر تحديث</span>
                                <span>{new Date().toLocaleDateString('ar-EG')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-4">حالة التكاملات</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <StatusCard
                                name="قاعدة البيانات"
                                status="active"
                                description="SQLite / Prisma"
                            />
                            <StatusCard
                                name="بوابة الدفع"
                                status={settings.paymob_configured ? 'active' : 'inactive'}
                                description="Paymob Accept"
                            />
                            <StatusCard
                                name="البريد الإلكتروني"
                                status={settings.sendgrid_configured ? 'active' : 'inactive'}
                                description="SendGrid"
                            />
                            <StatusCard
                                name="Docker"
                                status="active"
                                description="n8n Containers"
                            />
                        </div>
                    </div>

                    <div className="card p-6 border-destructive/30">
                        <h2 className="text-xl font-bold mb-4 text-destructive">إجراءات خطيرة</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            هذه الإجراءات قد تؤثر على النظام بشكل كبير. كن حذراً.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                disabled
                                className="btn-outline px-4 py-2 text-sm border-warning/50 text-warning opacity-50 cursor-not-allowed"
                            >
                                مسح ذاكرة التخزين المؤقت
                            </button>
                            <button
                                disabled
                                className="btn-outline px-4 py-2 text-sm border-destructive/50 text-destructive opacity-50 cursor-not-allowed"
                            >
                                إعادة تشغيل الخدمات
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Toggle Setting Component
function ToggleSetting({
    label,
    description,
    enabled,
    onChange,
    disabled,
    variant = 'default',
}: {
    label: string;
    description: string;
    enabled: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
    variant?: 'default' | 'warning';
}) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-lg border ${variant === 'warning' ? 'border-warning/50 bg-warning/5' : ''
            }`}>
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                disabled={disabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled
                        ? variant === 'warning'
                            ? 'bg-destructive'
                            : 'bg-primary'
                        : 'bg-muted'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-1' : 'translate-x-6'
                        }`}
                />
            </button>
        </div>
    );
}

// Status Card Component
function StatusCard({
    name,
    status,
    description,
}: {
    name: string;
    status: 'active' | 'inactive' | 'error';
    description: string;
}) {
    const statusConfig = {
        active: { label: 'يعمل', class: 'text-success', bg: 'bg-success' },
        inactive: { label: 'غير نشط', class: 'text-muted-foreground', bg: 'bg-muted' },
        error: { label: 'خطأ', class: 'text-destructive', bg: 'bg-destructive' },
    };

    const config = statusConfig[status];

    return (
        <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
                <p className="font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className={`relative flex h-2 w-2`}>
                    {status === 'active' && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.bg} opacity-75`} />
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${config.bg}`} />
                </span>
                <span className={`text-sm ${config.class}`}>{config.label}</span>
            </div>
        </div>
    );
}

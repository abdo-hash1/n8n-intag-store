'use client';

import { useState, useEffect } from 'react';

interface PlanConfig {
    planType: string;
    price: number;
    currency: string;
    displayName: string;
    description: string;
    features: string[];
    isActive: boolean;
}

export default function AdminPricingPage() {
    const [plans, setPlans] = useState<{ monthly: PlanConfig | null; yearly: PlanConfig | null }>({
        monthly: null,
        yearly: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Editable fields
    const [monthlyPrice, setMonthlyPrice] = useState('');
    const [yearlyPrice, setYearlyPrice] = useState('');

    useEffect(() => {
        fetchPricing();
    }, []);

    const fetchPricing = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pricing`);
            if (response.ok) {
                const data = await response.json();
                setPlans(data.data.plans);
                setMonthlyPrice(data.data.plans.monthly?.price?.toString() || '400');
                setYearlyPrice(data.data.plans.yearly?.price?.toString() || '3800');
            }
        } catch {
            setError('فشل تحميل الأسعار');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (planType: 'monthly' | 'yearly') => {
        setIsSaving(planType);
        setSuccess('');
        setError('');

        const price = planType === 'monthly' ? parseFloat(monthlyPrice) : parseFloat(yearlyPrice);

        if (isNaN(price) || price <= 0) {
            setError('يرجى إدخال سعر صحيح');
            setIsSaving(null);
            return;
        }

        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pricing/${planType}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ price }),
            });

            if (!response.ok) {
                throw new Error('فشل حفظ السعر');
            }

            setSuccess(`تم تحديث سعر ${planType === 'monthly' ? 'الاشتراك الشهري' : 'الاشتراك السنوي'} بنجاح`);
            fetchPricing();
        } catch {
            setError('حدث خطأ أثناء حفظ السعر');
        } finally {
            setIsSaving(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in">
                <div className="skeleton h-10 w-48" />
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="card p-6">
                        <div className="skeleton h-6 w-32 mb-4" />
                        <div className="skeleton h-12 w-full" />
                    </div>
                    <div className="card p-6">
                        <div className="skeleton h-6 w-32 mb-4" />
                        <div className="skeleton h-12 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">إدارة الأسعار</h1>
                <p className="text-muted-foreground">تعديل أسعار خطط الاشتراك</p>
            </div>

            {/* Messages */}
            {success && (
                <div className="p-4 bg-success/10 text-success rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {success}
                </div>
            )}

            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {error}
                </div>
            )}

            {/* Pricing Cards */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Monthly Plan */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold">الاشتراك الشهري</h2>
                            <p className="text-sm text-muted-foreground">دفع شهري متجدد</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">السعر (ج.م)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={monthlyPrice}
                                    onChange={(e) => setMonthlyPrice(e.target.value)}
                                    className="input w-full text-2xl font-bold pl-16"
                                    min="0"
                                    step="1"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    ج.م/شهر
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-2">
                                السعر الحالي: <span className="font-bold text-foreground">{plans.monthly?.price || 400} ج.م</span>
                            </p>
                        </div>

                        <button
                            onClick={() => handleSave('monthly')}
                            disabled={isSaving === 'monthly'}
                            className="btn-primary w-full py-3 disabled:opacity-50"
                        >
                            {isSaving === 'monthly' ? 'جاري الحفظ...' : 'حفظ السعر'}
                        </button>
                    </div>
                </div>

                {/* Yearly Plan */}
                <div className="card p-6 border-primary/50">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold">الاشتراك السنوي</h2>
                            <p className="text-sm text-muted-foreground">دفع سنوي مع خصم</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">السعر (ج.م)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={yearlyPrice}
                                    onChange={(e) => setYearlyPrice(e.target.value)}
                                    className="input w-full text-2xl font-bold pl-16"
                                    min="0"
                                    step="1"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    ج.م/سنة
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-2">
                                السعر الحالي: <span className="font-bold text-foreground">{plans.yearly?.price || 3800} ج.م</span>
                            </p>
                            {/* Calculate savings */}
                            <p className="text-sm text-success">
                                توفير: {Math.round(100 - (parseFloat(yearlyPrice) / (parseFloat(monthlyPrice) * 12)) * 100) || 0}% مقارنة بالشهري
                            </p>
                        </div>

                        <button
                            onClick={() => handleSave('yearly')}
                            disabled={isSaving === 'yearly'}
                            className="btn-primary w-full py-3 disabled:opacity-50"
                        >
                            {isSaving === 'yearly' ? 'جاري الحفظ...' : 'حفظ السعر'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="card p-6 bg-muted/50">
                <h3 className="font-medium mb-3">ملاحظات هامة</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        تغيير الأسعار لن يؤثر على الاشتراكات الحالية
                    </li>
                    <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        الأسعار الجديدة ستُطبق على الاشتراكات الجديدة فقط
                    </li>
                    <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        يُنصح بإعلان العملاء قبل أي تغيير في الأسعار
                    </li>
                </ul>
            </div>
        </div>
    );
}

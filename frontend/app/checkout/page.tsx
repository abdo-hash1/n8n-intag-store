'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Plan {
    id: string;
    nameAr: string;
    price: number;
    periodAr: string;
}

const plans: Record<string, Plan> = {
    monthly: {
        id: 'monthly',
        nameAr: 'الاشتراك الشهري',
        price: 400,
        periodAr: 'شهر',
    },
    yearly: {
        id: 'yearly',
        nameAr: 'الاشتراك السنوي',
        price: 3800,
        periodAr: 'سنة',
    },
};

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = searchParams.get('plan') || 'monthly';
    const paymentIdParam = searchParams.get('payment_id');
    const mockParam = searchParams.get('mock');
    const plan = plans[planId] || plans.monthly;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{
        id: string;
        code: string;
        discountType: string;
        discountValue: number;
        discountAmount: number;
    } | null>(null);

    // Calculate final price
    const finalPrice = appliedCoupon
        ? Math.max(0, plan.price - appliedCoupon.discountAmount)
        : plan.price;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(price);
    };

    // Validate coupon
    const validateCoupon = async () => {
        if (!couponCode.trim()) return;

        setCouponLoading(true);
        setCouponError('');

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    code: couponCode,
                    planType: planId,
                    amount: plan.price
                }),
            });

            const data = await response.json();

            if (data.data?.valid) {
                setAppliedCoupon({
                    id: data.data.coupon.id,
                    code: data.data.coupon.code,
                    discountType: data.data.coupon.discountType,
                    discountValue: data.data.coupon.discountValue,
                    discountAmount: data.data.discountAmount
                });
                setCouponCode('');
            } else {
                setCouponError(data.data?.message || data.message || 'كود الخصم غير صالح');
            }
        } catch {
            setCouponError('حدث خطأ في التحقق من الكود');
        } finally {
            setCouponLoading(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
    };

    // Handle mock payment completion callback
    useEffect(() => {
        if (paymentIdParam && mockParam === 'true') {
            completeMockPayment(paymentIdParam);
        }
    }, [paymentIdParam, mockParam]);

    const completeMockPayment = async (paymentId: string) => {
        setStep('processing');
        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/mock/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ paymentId, success: true }),
            });

            if (!response.ok) {
                throw new Error('فشل في إتمام الدفع');
            }

            setStep('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
            setStep('failed');
        }
    };

    const handleCheckout = async () => {
        setError('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                // Not logged in, redirect to signup with plan
                router.push(`/signup?plan=${planId}`);
                return;
            }

            // Step 1: Create subscription if needed
            let subId = subscriptionId;
            if (!subId) {
                const subResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        planType: planId,
                    }),
                });

                if (!subResponse.ok) {
                    const data = await subResponse.json();
                    // Check if they already have a subscription
                    if (data.message?.includes('already')) {
                        // Get existing subscription
                        const meResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        if (meResponse.ok) {
                            const meData = await meResponse.json();
                            subId = meData.data?.subscription?.id;
                        }
                    }
                    if (!subId) {
                        throw new Error(data.message || 'فشل في إنشاء الاشتراك');
                    }
                } else {
                    const data = await subResponse.json();
                    subId = data.data?.subscription?.id;
                }
                setSubscriptionId(subId!);
            }

            // Step 2: Create payment intent
            const paymentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    subscriptionId: subId,
                    planType: planId,
                }),
            });

            if (!paymentResponse.ok) {
                const data = await paymentResponse.json();
                throw new Error(data.message || 'فشل في إنشاء طلب الدفع');
            }

            const paymentData = await paymentResponse.json();
            const { paymentUrl } = paymentData.data;

            // Step 3: Redirect to payment gateway or handle mock
            if (paymentUrl.includes('mock=true') || paymentUrl.includes('/checkout/')) {
                // Mock payment - redirect within app
                window.location.href = paymentUrl;
            } else {
                // Real Paymob iframe - open in current window
                window.location.href = paymentUrl;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء معالجة الدفع');
            setIsLoading(false);
        }
    };

    if (step === 'processing') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center animate-in">
                    <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-2">جاري معالجة الدفع...</h2>
                    <p className="text-muted-foreground">الرجاء الانتظار</p>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center animate-in max-w-md px-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-success/20 to-success/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-3">تم الاشتراك بنجاح! 🎉</h2>
                    <p className="text-muted-foreground mb-8 text-lg">
                        شكراً لاشتراكك في {plan.nameAr}. يمكنك الآن البدء في استخدام n8n.
                    </p>
                    <div className="space-y-4">
                        <Link href="/dashboard" className="btn-primary w-full py-4 block text-center text-lg">
                            🚀 الذهاب للوحة التحكم
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            سيتم إرسال تفاصيل الاشتراك والفاتورة إلى بريدك الإلكتروني
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'failed') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center animate-in max-w-md px-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-3">فشلت عملية الدفع</h2>
                    <p className="text-muted-foreground mb-4">
                        {error || 'حدث خطأ أثناء معالجة الدفع'}
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => { setStep('form'); setError(''); }}
                            className="btn-primary w-full py-3"
                        >
                            إعادة المحاولة
                        </button>
                        <Link href="/pricing" className="btn-outline w-full py-3 block text-center">
                            العودة للأسعار
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Header */}
            <header className="container mx-auto px-4 py-6">
                <nav className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
                        <span className="text-3xl">🔄</span>
                        n8n SaaS
                    </Link>
                    <Link href="/pricing" className="text-sm hover:text-primary transition-colors flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        العودة للأسعار
                    </Link>
                </nav>
            </header>

            <main className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-center mb-2">إتمام الاشتراك</h1>
                    <p className="text-muted-foreground text-center mb-8">
                        خطوة واحدة فقط للوصول إلى منصة n8n الخاصة بك
                    </p>

                    {/* Plan Summary Card */}
                    <div className="card p-8 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">{plan.nameAr}</h2>
                                <p className="text-muted-foreground">
                                    {plan.periodAr === 'شهر' ? 'اشتراك شهري متجدد' : 'اشتراك سنوي (وفر 21%)'}
                                </p>
                            </div>
                            <div className="text-left">
                                <p className="text-3xl font-bold text-primary">{formatPrice(plan.price)}</p>
                                <p className="text-sm text-muted-foreground">/ {plan.periodAr}</p>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="border-t border-b py-6 mb-6">
                            <h3 className="font-medium mb-4">ما ستحصل عليه:</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    'منصة n8n خاصة بك',
                                    'دعم فني على مدار الساعة',
                                    'نسخ احتياطي يومي',
                                    'تشغيل غير محدود',
                                    'واجهة عربية كاملة',
                                    'إلغاء في أي وقت',
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Coupon Code */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">كود الخصم (اختياري)</label>
                            {appliedCoupon ? (
                                <div className="flex items-center justify-between p-3 bg-success/10 text-success rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">{appliedCoupon.code}</span>
                                        <span className="text-sm">
                                            (-{appliedCoupon.discountType === 'percentage'
                                                ? `${appliedCoupon.discountValue}%`
                                                : formatPrice(appliedCoupon.discountValue)})
                                        </span>
                                    </div>
                                    <button
                                        onClick={removeCoupon}
                                        className="text-success/80 hover:text-success"
                                    >
                                        إزالة
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => {
                                            setCouponCode(e.target.value.toUpperCase());
                                            setCouponError('');
                                        }}
                                        placeholder="أدخل كود الخصم"
                                        className="input flex-1"
                                    />
                                    <button
                                        onClick={validateCoupon}
                                        disabled={couponLoading || !couponCode.trim()}
                                        className="btn-outline px-4 disabled:opacity-50"
                                    >
                                        {couponLoading ? '...' : 'تطبيق'}
                                    </button>
                                </div>
                            )}
                            {couponError && (
                                <p className="text-sm text-destructive mt-2">{couponError}</p>
                            )}
                        </div>

                        {/* Price Summary */}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">سعر الخطة</span>
                                <span>{formatPrice(plan.price)}</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between items-center text-success">
                                    <span>الخصم ({appliedCoupon.code})</span>
                                    <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                                </div>
                            )}
                            <div className="border-t pt-3 flex justify-between items-center text-lg">
                                <span className="font-bold">الإجمالي الآن</span>
                                <span className="text-2xl font-bold text-primary">{formatPrice(finalPrice)}</span>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* CTA Button */}
                        <button
                            onClick={handleCheckout}
                            disabled={isLoading}
                            className="btn-primary w-full py-4 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    جاري التحميل...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    متابعة للدفع الآمن
                                </>
                            )}
                        </button>

                        <p className="text-xs text-muted-foreground text-center mt-4">
                            بالضغط على متابعة، أنت توافق على{' '}
                            <Link href="/terms" className="text-primary hover:underline">
                                الشروط والأحكام
                            </Link>{' '}
                            و{' '}
                            <Link href="/privacy" className="text-primary hover:underline">
                                سياسة الخصوصية
                            </Link>
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>دفع آمن ومشفر</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <span>بطاقات ومحافظ إلكترونية</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                            </svg>
                            <span>ضمان استرداد 7 أيام</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">جاري التحميل...</p>
                </div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}

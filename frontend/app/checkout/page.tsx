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
    const plan = plans[planId] || plans.monthly;

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: '',
    });
    const [error, setError] = useState('');
    const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.slice(0, 2) + '/' + v.slice(2, 4);
        }
        return v;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate
        if (paymentMethod === 'card') {
            if (!cardData.number || cardData.number.replace(/\s/g, '').length < 16) {
                setError('الرجاء إدخال رقم بطاقة صحيح');
                return;
            }
            if (!cardData.name) {
                setError('الرجاء إدخال اسم حامل البطاقة');
                return;
            }
            if (!cardData.expiry || cardData.expiry.length < 5) {
                setError('الرجاء إدخال تاريخ انتهاء صحيح');
                return;
            }
            if (!cardData.cvv || cardData.cvv.length < 3) {
                setError('الرجاء إدخال رمز CVV صحيح');
                return;
            }
        }

        setStep('processing');
        setIsProcessing(true);

        try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                // Not logged in, redirect to signup with plan
                router.push(`/signup?plan=${planId}`);
                return;
            }

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Create subscription
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    planType: planId,
                    paymentGateway: 'mock',
                    gatewayTransactionId: `MOCK_${Date.now()}`,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'فشل في إنشاء الاشتراك');
            }

            setStep('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء معالجة الدفع');
            setStep('form');
        } finally {
            setIsProcessing(false);
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
                <div className="text-center animate-in max-w-md">
                    <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">تم الاشتراك بنجاح! 🎉</h2>
                    <p className="text-muted-foreground mb-6">
                        شكراً لاشتراكك في {plan.nameAr}. يمكنك الآن البدء في استخدام n8n.
                    </p>
                    <div className="space-y-3">
                        <Link href="/dashboard" className="btn-primary w-full py-3 block text-center">
                            الذهاب للوحة التحكم
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            سيتم إرسال تفاصيل الاشتراك إلى بريدك الإلكتروني
                        </p>
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
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-center mb-8">إتمام الاشتراك</h1>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Order Summary */}
                        <div className="order-2 md:order-1">
                            <div className="card p-6 sticky top-6">
                                <h2 className="text-xl font-bold mb-4">ملخص الطلب</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{plan.nameAr}</span>
                                        <span>{formatPrice(plan.price)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>مدة الاشتراك</span>
                                        <span>{plan.periodAr === 'شهر' ? 'شهر واحد' : 'سنة واحدة'}</span>
                                    </div>
                                </div>

                                <div className="border-t pt-4 mb-6">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>الإجمالي</span>
                                        <span className="text-primary">{formatPrice(plan.price)}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        شامل الضريبة
                                    </p>
                                </div>

                                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>ضمان استرداد المال خلال 7 أيام</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>دفع آمن ومشفر</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>إلغاء في أي وقت</span>
                                    </div>
                                </div>

                                {/* Change Plan */}
                                <div className="mt-6 text-center">
                                    <Link href="/pricing" className="text-sm text-primary hover:underline">
                                        تغيير الخطة
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div className="order-1 md:order-2">
                            <div className="card p-6">
                                <h2 className="text-xl font-bold mb-6">معلومات الدفع</h2>

                                {/* Payment Method */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-3">طريقة الدفع</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('card')}
                                            className={`p-4 rounded-lg border-2 text-center transition-all ${paymentMethod === 'card'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-muted hover:border-primary/50'
                                                }`}
                                        >
                                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                            <span className="text-sm font-medium">بطاقة ائتمان</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('wallet')}
                                            className={`p-4 rounded-lg border-2 text-center transition-all ${paymentMethod === 'wallet'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-muted hover:border-primary/50'
                                                }`}
                                        >
                                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm font-medium">محفظة إلكترونية</span>
                                        </button>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    {paymentMethod === 'card' ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">رقم البطاقة</label>
                                                <input
                                                    type="text"
                                                    value={cardData.number}
                                                    onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                                                    placeholder="0000 0000 0000 0000"
                                                    maxLength={19}
                                                    className="input w-full text-left"
                                                    dir="ltr"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">اسم حامل البطاقة</label>
                                                <input
                                                    type="text"
                                                    value={cardData.name}
                                                    onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                                                    placeholder="JOHN DOE"
                                                    className="input w-full text-left"
                                                    dir="ltr"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">تاريخ الانتهاء</label>
                                                    <input
                                                        type="text"
                                                        value={cardData.expiry}
                                                        onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                                                        placeholder="MM/YY"
                                                        maxLength={5}
                                                        className="input w-full text-left"
                                                        dir="ltr"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">CVV</label>
                                                    <input
                                                        type="password"
                                                        value={cardData.cvv}
                                                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                                                        placeholder="•••"
                                                        maxLength={4}
                                                        className="input w-full text-left"
                                                        dir="ltr"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-muted-foreground mb-4">
                                                سيتم تحويلك لإكمال الدفع عبر تطبيق المحفظة الإلكترونية
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                ندعم: فودافون كاش، اتصالات كاش، أورانج كاش
                                            </p>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="btn-primary w-full py-3 mt-6 disabled:opacity-50"
                                    >
                                        {isProcessing ? 'جاري المعالجة...' : `ادفع ${formatPrice(plan.price)}`}
                                    </button>

                                    <p className="text-xs text-muted-foreground text-center mt-4">
                                        بالضغط على الدفع، أنت توافق على{' '}
                                        <Link href="/terms" className="text-primary hover:underline">
                                            الشروط والأحكام
                                        </Link>{' '}
                                        و{' '}
                                        <Link href="/privacy" className="text-primary hover:underline">
                                            سياسة الخصوصية
                                        </Link>
                                    </p>
                                </form>
                            </div>

                            {/* Security Badges */}
                            <div className="flex items-center justify-center gap-4 mt-6 text-muted-foreground text-sm">
                                <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>مشفر وآمن</span>
                                </div>
                                <span>•</span>
                                <span>SSL 256-bit</span>
                            </div>
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

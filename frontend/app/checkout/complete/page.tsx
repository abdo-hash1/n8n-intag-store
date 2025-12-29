'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function CheckoutCompleteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get parameters from URL
    const paymentId = searchParams.get('payment_id');
    const isMock = searchParams.get('mock') === 'true';
    const success = searchParams.get('success') !== 'false';
    const transactionId = searchParams.get('transaction_id');

    const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
    const [error, setError] = useState<string>('');
    const [subscriptionData, setSubscriptionData] = useState<{
        planType?: string;
        expiresAt?: string;
    } | null>(null);

    useEffect(() => {
        if (paymentId) {
            handlePaymentCompletion();
        } else {
            setError('معرّف الدفع غير موجود');
            setStatus('failed');
        }
    }, [paymentId]);

    const handlePaymentCompletion = async () => {
        try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                // Not logged in, redirect to login
                router.push('/login?redirect=/dashboard');
                return;
            }

            if (isMock) {
                // Handle mock payment completion
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/mock/complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        paymentId,
                        success: success
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'فشل في إتمام الدفع');
                }

                setSubscriptionData({
                    planType: data.data?.subscription?.planType,
                    expiresAt: data.data?.subscription?.currentPeriodEnd,
                });
                setStatus('success');
            } else {
                // Verify real payment with backend
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/verify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        paymentId,
                        transactionId,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'فشل في التحقق من الدفع');
                }

                if (data.data?.payment?.status === 'completed') {
                    setSubscriptionData({
                        planType: data.data?.subscription?.planType,
                        expiresAt: data.data?.subscription?.currentPeriodEnd,
                    });
                    setStatus('success');
                } else {
                    throw new Error('الدفع لم يكتمل بنجاح');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء معالجة الدفع');
            setStatus('failed');
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (status === 'processing') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
                <div className="text-center animate-in px-4">
                    <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-8" />
                    <h2 className="text-2xl font-bold mb-3">جاري التحقق من الدفع...</h2>
                    <p className="text-muted-foreground">الرجاء الانتظار، لا تغلق هذه الصفحة</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
                <div className="text-center animate-in max-w-lg px-4">
                    {/* Success Icon */}
                    <div className="w-28 h-28 bg-gradient-to-br from-success/30 to-success/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-success/20">
                        <svg className="w-14 h-14 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    {/* Success Message */}
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                        تم الاشتراك بنجاح! 🎉
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8">
                        مبروك! تم تفعيل اشتراكك وأصبحت منصة n8n جاهزة للاستخدام
                    </p>

                    {/* Subscription Info */}
                    {subscriptionData && (
                        <div className="card p-6 mb-8 text-right">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                تفاصيل الاشتراك
                            </h3>
                            <div className="space-y-2 text-muted-foreground">
                                <p>
                                    <span className="font-medium text-foreground">الخطة:</span>{' '}
                                    {subscriptionData.planType === 'yearly' ? 'الاشتراك السنوي' : 'الاشتراك الشهري'}
                                </p>
                                {subscriptionData.expiresAt && (
                                    <p>
                                        <span className="font-medium text-foreground">ينتهي في:</span>{' '}
                                        {formatDate(subscriptionData.expiresAt)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CTA Buttons */}
                    <div className="space-y-4">
                        <Link
                            href="/dashboard"
                            className="btn-primary w-full py-4 block text-center text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                        >
                            🚀 الذهاب للوحة التحكم
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            تم إرسال تفاصيل الاشتراك والفاتورة إلى بريدك الإلكتروني
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="mt-8 pt-8 border-t flex flex-wrap justify-center gap-4 text-sm">
                        <Link href="/dashboard/support" className="text-primary hover:underline">
                            الدعم الفني
                        </Link>
                        <span className="text-muted-foreground">•</span>
                        <Link href="/dashboard/settings" className="text-primary hover:underline">
                            إعدادات الحساب
                        </Link>
                        <span className="text-muted-foreground">•</span>
                        <Link href="/docs" className="text-primary hover:underline">
                            دليل الاستخدام
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Failed state
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
            <div className="text-center animate-in max-w-md px-4">
                {/* Error Icon */}
                <div className="w-28 h-28 bg-gradient-to-br from-destructive/30 to-destructive/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-destructive/20">
                    <svg className="w-14 h-14 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>

                {/* Error Message */}
                <h1 className="text-3xl font-bold mb-4">فشلت عملية الدفع</h1>
                <p className="text-lg text-muted-foreground mb-4">
                    {error || 'حدث خطأ أثناء معالجة الدفع'}
                </p>

                {/* Payment ID for support reference */}
                {paymentId && (
                    <p className="text-sm text-muted-foreground mb-8 bg-muted p-3 rounded-lg">
                        رقم المرجع: <code className="font-mono text-xs">{paymentId}</code>
                    </p>
                )}

                {/* CTA Buttons */}
                <div className="space-y-3">
                    <Link
                        href="/checkout"
                        className="btn-primary w-full py-4 block text-center text-lg"
                    >
                        إعادة المحاولة
                    </Link>
                    <Link
                        href="/pricing"
                        className="btn-outline w-full py-3 block text-center"
                    >
                        العودة للأسعار
                    </Link>
                    <Link
                        href="/dashboard/support"
                        className="text-sm text-primary hover:underline block mt-4"
                    >
                        تحتاج مساعدة؟ تواصل مع الدعم الفني
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutCompletePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">جاري التحميل...</p>
                </div>
            </div>
        }>
            <CheckoutCompleteContent />
        </Suspense>
    );
}

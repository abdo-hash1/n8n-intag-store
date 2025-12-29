'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (token) {
            verifyEmail(token);
        } else {
            setStatus('error');
            setMessage('رابط التحقق غير صالح');
        }
    }, [token]);

    const verifyEmail = async (verificationToken: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/user/verify-email?token=${verificationToken}`
            );
            const data = await response.json();

            if (response.ok && data.data?.verified) {
                setStatus('success');
                setMessage('تم تأكيد بريدك الإلكتروني بنجاح!');
            } else {
                setStatus('error');
                setMessage(data.message || 'فشل في تأكيد البريد الإلكتروني');
            }
        } catch (error) {
            setStatus('error');
            setMessage('حدث خطأ أثناء التحقق من الرابط');
        }
    };

    // Loading state
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-2">جاري التحقق...</h2>
                    <p className="text-muted-foreground">الرجاء الانتظار</p>
                </div>
            </div>
        );
    }

    // Success state
    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="card p-8 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-success/20 to-success/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold mb-3">تم التأكيد! ✅</h1>
                        <p className="text-muted-foreground mb-6 text-lg">
                            {message}
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            يمكنك الآن الاستفادة من جميع مميزات المنصة.
                        </p>
                        <Link href="/dashboard" className="btn-primary w-full py-3 block text-center">
                            الذهاب للوحة التحكم
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="card p-8 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-3">فشل التحقق</h1>
                    <p className="text-muted-foreground mb-6">
                        {message}
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                        قد يكون الرابط منتهي الصلاحية أو تم استخدامه مسبقاً.
                    </p>
                    <div className="space-y-3">
                        <Link href="/dashboard/settings" className="btn-primary w-full py-3 block text-center">
                            طلب رابط جديد
                        </Link>
                        <Link href="/login" className="btn-outline w-full py-3 block text-center">
                            تسجيل الدخول
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">جاري التحميل...</p>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}

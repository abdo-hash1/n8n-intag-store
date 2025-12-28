'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل تسجيل الدخول');
            }

            // Store tokens in localStorage (for regular users)
            localStorage.setItem('accessToken', data.data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            // Always redirect to user dashboard
            // Admins should use /admin/login for admin panel access
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">n8n</span>
                        </div>
                        <span className="font-bold text-2xl">SaaS</span>
                    </Link>
                </div>

                {/* Login Card */}
                <div className="card p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold mb-2">مرحباً بعودتك!</h1>
                        <p className="text-muted-foreground">سجل دخولك للوصول إلى لوحة التحكم</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6 text-center">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                البريد الإلكتروني
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder="example@email.com"
                                required
                                autoComplete="email"
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-medium">
                                    كلمة المرور
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    نسيت كلمة المرور؟
                                </Link>
                            </div>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                dir="ltr"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-3 mt-6"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                    جاري تسجيل الدخول...
                                </span>
                            ) : (
                                'تسجيل الدخول'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-card px-4 text-muted-foreground">أو</span>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center text-muted-foreground">
                        ليس لديك حساب؟{' '}
                        <Link href="/signup" className="text-primary font-medium hover:underline">
                            سجل الآن
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-8">
                    بتسجيل الدخول، أنت توافق على{' '}
                    <Link href="/terms" className="underline hover:text-foreground">
                        الشروط والأحكام
                    </Link>{' '}
                    و{' '}
                    <Link href="/privacy" className="underline hover:text-foreground">
                        سياسة الخصوصية
                    </Link>
                </p>
            </div>
        </div>
    );
}

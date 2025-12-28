'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
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

            // Check if user is admin
            const userRole = data.data.user.role;
            if (userRole !== 'admin' && userRole !== 'super_admin') {
                throw new Error('هذه الصفحة للمديرين فقط');
            }

            // Store tokens with ADMIN prefix - separate from user tokens
            localStorage.setItem('adminAccessToken', data.data.tokens.accessToken);
            localStorage.setItem('adminRefreshToken', data.data.tokens.refreshToken);
            localStorage.setItem('adminUser', JSON.stringify(data.data.user));

            // Redirect to admin dashboard
            router.push('/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">🛡️</span>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-2xl text-white block">لوحة الإدارة</span>
                            <span className="text-slate-400 text-sm">Admin Panel</span>
                        </div>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold mb-2 text-white">تسجيل دخول المدير</h1>
                        <p className="text-slate-400">أدخل بيانات حساب الإدارة</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-center">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2 text-slate-300">
                                البريد الإلكتروني
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="admin@example.com"
                                required
                                autoComplete="email"
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2 text-slate-300">
                                كلمة المرور
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                dir="ltr"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 mt-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                'دخول لوحة الإدارة'
                            )}
                        </button>
                    </form>

                    {/* Back to main site */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-slate-400 hover:text-white text-sm transition-colors"
                        >
                            ← العودة للموقع الرئيسي
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-8">
                    🔒 هذه الصفحة للمديرين فقط
                </p>
            </div>
        </div>
    );
}

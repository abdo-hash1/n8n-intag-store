'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedPlan = searchParams.get('plan') || 'monthly';

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false,
    });
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        setError('');

        // Validate password on change
        if (name === 'password') {
            validatePassword(value);
        }
    };

    const validatePassword = (password: string) => {
        const errors: string[] = [];
        if (password.length < 8) {
            errors.push('8 أحرف على الأقل');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('حرف صغير واحد على الأقل');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('حرف كبير واحد على الأقل');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('رقم واحد على الأقل');
        }
        setPasswordErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validate
        if (!validatePassword(formData.password)) {
            setError('كلمة المرور لا تستوفي المتطلبات');
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('كلمتا المرور غير متطابقتين');
            setIsLoading(false);
            return;
        }

        if (!formData.termsAccepted) {
            setError('يجب الموافقة على الشروط والأحكام');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل إنشاء الحساب');
            }

            // Store tokens
            localStorage.setItem('accessToken', data.data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            // Redirect to checkout or dashboard
            router.push(`/checkout?plan=${selectedPlan}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4 py-12">
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

                {/* Selected Plan Badge */}
                <div className="text-center mb-6">
                    <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                        {selectedPlan === 'annual' ? (
                            <>
                                <span>الخطة السنوية</span>
                                <span className="bg-primary text-white px-2 py-0.5 rounded text-xs">وفر 20%</span>
                            </>
                        ) : (
                            <span>الخطة الشهرية</span>
                        )}
                    </span>
                </div>

                {/* Signup Card */}
                <div className="card p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold mb-2">إنشاء حساب جديد</h1>
                        <p className="text-muted-foreground">ابدأ رحلتك مع أتمتة الأعمال</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6 text-center">
                            {error}
                        </div>
                    )}

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                                الاسم الكامل
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="input"
                                placeholder="محمد أحمد"
                                required
                                autoComplete="name"
                            />
                        </div>

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
                            <label htmlFor="phone" className="block text-sm font-medium mb-2">
                                رقم الهاتف
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="input"
                                placeholder="01xxxxxxxxx"
                                autoComplete="tel"
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                كلمة المرور
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input"
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                dir="ltr"
                            />
                            {/* Password requirements */}
                            {formData.password && passwordErrors.length > 0 && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                    <p className="mb-1">يجب أن تحتوي على:</p>
                                    <ul className="space-y-1">
                                        {['8 أحرف على الأقل', 'حرف صغير واحد على الأقل', 'حرف كبير واحد على الأقل', 'رقم واحد على الأقل'].map((req) => (
                                            <li key={req} className="flex items-center gap-2">
                                                {passwordErrors.includes(req) ? (
                                                    <svg className="w-4 h-4 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                تأكيد كلمة المرور
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="input"
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                dir="ltr"
                            />
                        </div>

                        {/* Terms checkbox */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="termsAccepted"
                                name="termsAccepted"
                                checked={formData.termsAccepted}
                                onChange={handleChange}
                                className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                            />
                            <label htmlFor="termsAccepted" className="text-sm text-muted-foreground">
                                أوافق على{' '}
                                <Link href="/terms" className="text-primary hover:underline">
                                    الشروط والأحكام
                                </Link>{' '}
                                و{' '}
                                <Link href="/privacy" className="text-primary hover:underline">
                                    سياسة الخصوصية
                                </Link>
                            </label>
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
                                    جاري إنشاء الحساب...
                                </span>
                            ) : (
                                'إنشاء الحساب والمتابعة للدفع'
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

                    {/* Login Link */}
                    <p className="text-center text-muted-foreground">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/login" className="text-primary font-medium hover:underline">
                            سجل دخولك
                        </Link>
                    </p>
                </div>

                {/* Security note */}
                <p className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    بياناتك محمية ومشفرة بالكامل
                </p>
            </div>
        </div>
    );
}

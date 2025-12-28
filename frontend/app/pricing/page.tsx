'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PricingPlan {
    id: string;
    name: string;
    nameAr: string;
    price: number;
    period: string;
    periodAr: string;
    features: string[];
    popular?: boolean;
    savings?: number;
}

const plans: PricingPlan[] = [
    {
        id: 'monthly',
        name: 'Monthly',
        nameAr: 'شهري',
        price: 400,
        period: 'month',
        periodAr: 'شهر',
        features: [
            'n8n كامل بدون قيود',
            'استضافة سحابية آمنة',
            'دعم فني على مدار الساعة',
            'نسخ احتياطي يومي',
            'شهادة SSL مجانية',
            'تحديثات تلقائية',
        ],
    },
    {
        id: 'yearly',
        name: 'Yearly',
        nameAr: 'سنوي',
        price: 3800,
        period: 'year',
        periodAr: 'سنة',
        features: [
            'جميع مميزات الباقة الشهرية',
            'خصم 20% على السعر',
            'أولوية في الدعم الفني',
            'استشارة مجانية شهرياً',
            'تخصيص متقدم',
            'ضمان استرداد 30 يوم',
        ],
        popular: true,
        savings: 1000,
    },
];

export default function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
    const router = useRouter();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const handleSelectPlan = (planId: string) => {
        router.push(`/checkout?plan=${planId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Header */}
            <header className="container mx-auto px-4 py-6">
                <nav className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
                        <span className="text-3xl">🔄</span>
                        n8n SaaS
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm hover:text-primary transition-colors">
                            تسجيل الدخول
                        </Link>
                        <Link href="/signup" className="btn-primary px-4 py-2 text-sm">
                            ابدأ الآن
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero */}
            <section className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    اختر الخطة المناسبة لك
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    ابدأ أتمتة عملك اليوم مع n8n - أقوى منصة أتمتة مفتوحة المصدر
                </p>

                {/* Billing Toggle */}
                <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg mb-12">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`px-6 py-2 rounded-md font-medium transition-all ${billingPeriod === 'monthly'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        شهري
                    </button>
                    <button
                        onClick={() => setBillingPeriod('yearly')}
                        className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${billingPeriod === 'yearly'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        سنوي
                        <span className="bg-success/10 text-success text-xs px-2 py-0.5 rounded-full">
                            وفر 20%
                        </span>
                    </button>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="container mx-auto px-4 pb-20">
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative card p-8 transition-all hover:scale-105 ${plan.popular
                                    ? 'border-2 border-primary shadow-xl shadow-primary/10'
                                    : 'hover:shadow-lg'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                                        الأكثر شيوعاً
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold mb-2">{plan.nameAr}</h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                                    <span className="text-muted-foreground">/ {plan.periodAr}</span>
                                </div>
                                {plan.savings && (
                                    <p className="text-sm text-success mt-2">
                                        وفر {formatPrice(plan.savings)} سنوياً
                                    </p>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <svg
                                            className="w-5 h-5 text-success flex-shrink-0"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan.id)}
                                className={`w-full py-3 rounded-lg font-medium transition-all ${plan.popular
                                        ? 'btn-primary'
                                        : 'btn-outline'
                                    }`}
                            >
                                اشترك الآن
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-4 pb-20">
                <h2 className="text-3xl font-bold text-center mb-12">لماذا تختارنا؟</h2>
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {[
                        {
                            icon: '🔒',
                            title: 'أمان عالي',
                            description: 'حماية متقدمة لبياناتك مع تشفير SSL وجدار حماية',
                        },
                        {
                            icon: '⚡',
                            title: 'أداء فائق',
                            description: 'سيرفرات سحابية عالية الأداء لضمان سرعة التنفيذ',
                        },
                        {
                            icon: '🛠️',
                            title: 'دعم متميز',
                            description: 'فريق دعم فني متخصص على مدار الساعة',
                        },
                    ].map((feature, index) => (
                        <div key={index} className="text-center p-6">
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="container mx-auto px-4 pb-20">
                <h2 className="text-3xl font-bold text-center mb-12">الأسئلة الشائعة</h2>
                <div className="max-w-3xl mx-auto space-y-4">
                    {[
                        {
                            q: 'هل يمكنني إلغاء اشتراكي في أي وقت؟',
                            a: 'نعم، يمكنك إلغاء اشتراكك في أي وقت. سيظل حسابك نشطاً حتى نهاية فترة الفوترة الحالية.',
                        },
                        {
                            q: 'هل هناك فترة تجريبية؟',
                            a: 'نوفر ضمان استرداد المال خلال 7 أيام من الاشتراك إذا لم تكن راضياً.',
                        },
                        {
                            q: 'كيف يتم الدفع؟',
                            a: 'نقبل جميع بطاقات الائتمان والخصم من خلال بوابة Paymob الآمنة.',
                        },
                        {
                            q: 'هل يمكنني تغيير خطتي؟',
                            a: 'نعم، يمكنك الترقية أو تخفيض خطتك في أي وقت من لوحة التحكم.',
                        },
                    ].map((faq, index) => (
                        <div key={index} className="card p-6">
                            <h4 className="font-bold mb-2">{faq.q}</h4>
                            <p className="text-muted-foreground">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-8">
                <div className="container mx-auto px-4 text-center text-muted-foreground">
                    <p>© 2025 n8n SaaS. جميع الحقوق محفوظة.</p>
                </div>
            </footer>
        </div>
    );
}

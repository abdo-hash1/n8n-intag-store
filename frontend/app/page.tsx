import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b">
                <div className="container-wide">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                                <span className="text-white font-bold text-xl">n8n</span>
                            </div>
                            <span className="font-bold text-xl">SaaS</span>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                                المميزات
                            </Link>
                            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                                الأسعار
                            </Link>
                            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                                كيف يعمل
                            </Link>
                            <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                                الأسئلة الشائعة
                            </Link>
                        </div>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className="btn-ghost px-4 py-2"
                            >
                                تسجيل الدخول
                            </Link>
                            <Link
                                href="/signup"
                                className="btn-primary px-4 py-2"
                            >
                                ابدأ الآن
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="container-wide">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 animate-in">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            متاح الآن في مصر
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            أتمتة أعمالك{' '}
                            <span className="text-gradient">بدون تعقيد</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            احصل على نسختك الخاصة من n8n مع أكثر من 400 تكامل جاهز.
                            أتمتة سير العمل أصبحت أسهل من أي وقت مضى.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/signup"
                                className="btn-primary px-8 py-4 text-lg"
                            >
                                ابدأ تجربتك المجانية
                                <svg className="w-5 h-5 mr-2 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <Link
                                href="#how-it-works"
                                className="btn-outline px-8 py-4 text-lg"
                            >
                                شاهد كيف يعمل
                            </Link>
                        </div>

                        {/* Trust indicators */}
                        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>لا حاجة لبطاقة ائتمان</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>7 أيام تجربة مجانية</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>إلغاء في أي وقت</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 px-4">
                <div className="container-wide">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">خطط بسيطة وشفافة</h2>
                        <p className="text-xl text-muted-foreground">اختر الخطة المناسبة لاحتياجاتك</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Monthly Plan */}
                        <div className="card p-8 card-hover">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold mb-2">الخطة الشهرية</h3>
                                <p className="text-muted-foreground">مرونة كاملة بدون التزام طويل</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-5xl font-bold">400</span>
                                <span className="text-xl text-muted-foreground"> ج.م/شهر</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>نسختك الخاصة من n8n</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>+400 تكامل جاهز</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>نسخ احتياطي يومي</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>دعم فني عبر البريد</span>
                                </li>
                            </ul>
                            <Link
                                href="/signup?plan=monthly"
                                className="btn-outline w-full px-6 py-3 text-center"
                            >
                                اشترك الآن
                            </Link>
                        </div>

                        {/* Annual Plan */}
                        <div className="card p-8 border-2 border-primary relative card-hover">
                            {/* Popular badge */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                                    الأكثر توفيراً
                                </span>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold mb-2">الخطة السنوية</h3>
                                <p className="text-muted-foreground">وفر 20% مع الاشتراك السنوي</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-5xl font-bold">3,800</span>
                                <span className="text-xl text-muted-foreground"> ج.م/سنة</span>
                                <div className="mt-2">
                                    <span className="text-sm text-muted-foreground line-through">4,800 ج.م</span>
                                    <span className="text-sm text-success mr-2">وفر 1,000 ج.م</span>
                                </div>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>كل مميزات الخطة الشهرية</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">دعم فني أولوية</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>سعر ثابت لمدة سنة</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>ضمان استرداد 7 أيام</span>
                                </li>
                            </ul>
                            <Link
                                href="/signup?plan=annual"
                                className="btn-primary w-full px-6 py-3 text-center"
                            >
                                اشترك الآن ووفر 20%
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t">
                <div className="container-wide">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="text-white font-bold">n8n</span>
                            </div>
                            <span className="font-bold">SaaS</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <Link href="/terms" className="hover:text-foreground transition-colors">
                                الشروط والأحكام
                            </Link>
                            <Link href="/privacy" className="hover:text-foreground transition-colors">
                                سياسة الخصوصية
                            </Link>
                            <Link href="/contact" className="hover:text-foreground transition-colors">
                                اتصل بنا
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2024 n8n SaaS. جميع الحقوق محفوظة.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

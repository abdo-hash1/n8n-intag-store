import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'إنشاء حساب جديد',
    description: 'أنشئ حسابك الآن واحصل على نسختك الخاصة من n8n',
};

export default function SignupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

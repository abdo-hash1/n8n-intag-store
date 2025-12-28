import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'تسجيل دخول المدير | n8n SaaS',
    description: 'صفحة تسجيل دخول لوحة إدارة المنصة',
};

export default function AdminLoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

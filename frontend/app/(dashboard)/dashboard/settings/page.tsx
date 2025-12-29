'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    status: string;
    emailVerified?: boolean;
    createdAt: string;
    emailNotifications: boolean;
    marketingEmails: boolean;
}

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

    // Form states
    const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [notificationForm, setNotificationForm] = useState({ emailNotifications: true, marketingEmails: false });

    // Loading/error states
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    const [isNotificationSaving, setIsNotificationSaving] = useState(false);
    const [isVerificationSending, setIsVerificationSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                const userData = data.data.user;
                setUser(userData);
                setProfileForm({
                    fullName: userData.fullName || '',
                    phone: userData.phone || '',
                });
                setNotificationForm({
                    emailNotifications: userData.emailNotifications ?? true,
                    marketingEmails: userData.marketingEmails ?? false,
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsProfileSaving(true);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(profileForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل في تحديث الملف الشخصي');
            }

            setUser(data.data.user);

            // Update localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.fullName = profileForm.fullName;
                localStorage.setItem('user', JSON.stringify(parsed));
            }

            setSuccess('تم تحديث الملف الشخصي بنجاح');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsProfileSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('كلمتا المرور غير متطابقتين');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }

        setIsPasswordSaving(true);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل في تغيير كلمة المرور');
            }

            setSuccess('تم تغيير كلمة المرور بنجاح');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsPasswordSaving(false);
        }
    };

    const handleNotificationUpdate = async () => {
        setError('');
        setSuccess('');
        setIsNotificationSaving(true);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(notificationForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل في تحديث الإعدادات');
            }

            setSuccess('تم تحديث إعدادات الإشعارات');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsNotificationSaving(false);
        }
    };

    const handleResendVerification = async () => {
        setError('');
        setSuccess('');
        setIsVerificationSending(true);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/request-verification`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل في إرسال رابط التأكيد');
            }

            setSuccess('تم إرسال رابط التأكيد إلى بريدك الإلكتروني');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsVerificationSending(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in">
                <div className="skeleton h-8 w-48" />
                <div className="card p-6">
                    <div className="skeleton h-64 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">الإعدادات</h1>
                <p className="text-muted-foreground">إدارة حسابك وتفضيلاتك</p>
            </div>

            {/* Email Verification Banner */}
            {user && !user.emailVerified && (
                <div className="card p-4 border-warning/50 bg-warning/5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium">البريد الإلكتروني غير مؤكد</p>
                                <p className="text-sm text-muted-foreground">
                                    الرجاء تأكيد بريدك للاستفادة من جميع المميزات
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleResendVerification}
                            disabled={isVerificationSending}
                            className="btn-outline px-4 py-2 text-sm disabled:opacity-50"
                        >
                            {isVerificationSending ? 'جاري الإرسال...' : 'إرسال رابط التأكيد'}
                        </button>
                    </div>
                </div>
            )}

            {/* Success/Error Messages */}
            {success && (
                <div className="p-4 bg-success/10 text-success rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {success}
                </div>
            )}

            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                {[
                    { id: 'profile', label: 'الملف الشخصي', icon: '👤' },
                    { id: 'security', label: 'الأمان', icon: '🔒' },
                    { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as typeof activeTab); setError(''); setSuccess(''); }}
                        className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-6">الملف الشخصي</h2>

                    <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="input flex-1 bg-muted cursor-not-allowed"
                                    dir="ltr"
                                />
                                {user?.emailVerified && (
                                    <span className="badge-success text-xs">مؤكد</span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                لا يمكن تغيير البريد الإلكتروني
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
                            <input
                                type="text"
                                value={profileForm.fullName}
                                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                className="input w-full"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
                            <input
                                type="tel"
                                value={profileForm.phone}
                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                placeholder="01xxxxxxxxx"
                                className="input w-full"
                                dir="ltr"
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-2">
                                عضو منذ: {user?.createdAt ? formatDate(user.createdAt) : '-'}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isProfileSaving}
                            className="btn-primary px-6 py-2 disabled:opacity-50"
                        >
                            {isProfileSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </form>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-6">تغيير كلمة المرور</h2>

                    <form onSubmit={handlePasswordChange} className="space-y-6 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium mb-2">كلمة المرور الحالية</label>
                            <input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="input w-full"
                                dir="ltr"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                placeholder="8 أحرف على الأقل"
                                className="input w-full"
                                dir="ltr"
                                minLength={8}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">تأكيد كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="input w-full"
                                dir="ltr"
                                minLength={8}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isPasswordSaving}
                            className="btn-primary px-6 py-2 disabled:opacity-50"
                        >
                            {isPasswordSaving ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t">
                        <h3 className="font-bold mb-4">جلسات تسجيل الدخول</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                            قريباً - إدارة الأجهزة المسجل دخولها
                        </p>
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-6">إعدادات الإشعارات</h2>

                    <div className="space-y-6 max-w-lg">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div>
                                <p className="font-medium">إشعارات البريد الإلكتروني</p>
                                <p className="text-sm text-muted-foreground">
                                    استلام إشعارات الاشتراك والدفع والدعم الفني
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notificationForm.emailNotifications}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, emailNotifications: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div>
                                <p className="font-medium">رسائل التسويق</p>
                                <p className="text-sm text-muted-foreground">
                                    استلام العروض الخاصة والتحديثات والنصائح
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notificationForm.marketingEmails}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, marketingEmails: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>

                        <button
                            onClick={handleNotificationUpdate}
                            disabled={isNotificationSaving}
                            className="btn-primary px-6 py-2 disabled:opacity-50"
                        >
                            {isNotificationSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                        </button>
                    </div>
                </div>
            )}

            {/* Danger Zone */}
            <div className="card p-6 border-destructive/30">
                <h2 className="text-xl font-bold mb-4 text-destructive">منطقة الخطر</h2>
                <p className="text-muted-foreground mb-4">
                    الإجراءات هنا لا يمكن التراجع عنها. كن حذراً.
                </p>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/subscription"
                        className="btn-outline px-4 py-2 text-sm border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                        إلغاء الاشتراك
                    </Link>
                    <button
                        disabled
                        className="btn-outline px-4 py-2 text-sm border-destructive/50 text-destructive opacity-50 cursor-not-allowed"
                        title="غير متاح حالياً"
                    >
                        حذف الحساب
                    </button>
                </div>
            </div>
        </div>
    );
}

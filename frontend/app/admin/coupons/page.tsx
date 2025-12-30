'use client';

import { useState, useEffect } from 'react';
import Pagination from '@/components/Pagination';

interface Coupon {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    maxUses: number | null;
    usedCount: number;
    maxUsesPerUser: number;
    validFrom: string;
    validUntil: string | null;
    isActive: boolean;
    applicablePlans: string | null;
    minOrderAmount: number | null;
    createdAt: string;
    _count: {
        usages: number;
    };
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        page: 1, limit: 20, total: 0, totalPages: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        maxUses: '',
        maxUsesPerUser: '1',
        validUntil: '',
        minOrderAmount: '',
        isActive: true
    });

    useEffect(() => {
        fetchCoupons();
    }, [pagination.page]);

    const fetchCoupons = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/coupons?page=${pagination.page}&limit=${pagination.limit}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error('Failed to fetch coupons');

            const data = await response.json();
            setCoupons(data.data.coupons || []);
            setPagination(prev => ({
                ...prev,
                ...data.data.pagination
            }));
        } catch {
            setError('فشل تحميل أكواد الخصم');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('adminAccessToken');
            const url = editingCoupon
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/coupons/${editingCoupon.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/coupons`;

            const response = await fetch(url, {
                method: editingCoupon ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    code: formData.code,
                    discountType: formData.discountType,
                    discountValue: parseFloat(formData.discountValue),
                    maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
                    maxUsesPerUser: parseInt(formData.maxUsesPerUser),
                    validUntil: formData.validUntil || null,
                    minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
                    isActive: formData.isActive
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'فشل حفظ الكود');
            }

            setShowModal(false);
            resetForm();
            fetchCoupons();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الكود؟')) return;

        try {
            const token = localStorage.getItem('adminAccessToken');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchCoupons();
        } catch {
            alert('فشل حذف الكود');
        }
    };

    const handleToggleActive = async (coupon: Coupon) => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons/${coupon.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !coupon.isActive }),
            });
            fetchCoupons();
        } catch {
            alert('فشل تحديث الحالة');
        }
    };

    const openEditModal = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue.toString(),
            maxUses: coupon.maxUses?.toString() || '',
            maxUsesPerUser: coupon.maxUsesPerUser.toString(),
            validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
            minOrderAmount: coupon.minOrderAmount?.toString() || '',
            isActive: coupon.isActive
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingCoupon(null);
        setFormData({
            code: '',
            discountType: 'percentage',
            discountValue: '',
            maxUses: '',
            maxUsesPerUser: '1',
            validUntil: '',
            minOrderAmount: '',
            isActive: true
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">أكواد الخصم</h1>
                    <p className="text-muted-foreground">إدارة الكوبونات وأكواد الخصم</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn-primary px-4 py-2 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة كود جديد
                </button>
            </div>

            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
            )}

            {/* Coupons Table */}
            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-right p-4 font-medium">الكود</th>
                            <th className="text-right p-4 font-medium">الخصم</th>
                            <th className="text-right p-4 font-medium">الاستخدام</th>
                            <th className="text-right p-4 font-medium">الصلاحية</th>
                            <th className="text-right p-4 font-medium">الحالة</th>
                            <th className="text-right p-4 font-medium">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="p-4"><div className="skeleton h-6 w-24" /></td>
                                    <td className="p-4"><div className="skeleton h-6 w-16" /></td>
                                    <td className="p-4"><div className="skeleton h-6 w-20" /></td>
                                    <td className="p-4"><div className="skeleton h-6 w-24" /></td>
                                    <td className="p-4"><div className="skeleton h-6 w-16" /></td>
                                    <td className="p-4"><div className="skeleton h-6 w-20" /></td>
                                </tr>
                            ))
                        ) : coupons.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                    لا توجد أكواد خصم
                                </td>
                            </tr>
                        ) : (
                            coupons.map((coupon) => (
                                <tr key={coupon.id} className="hover:bg-muted/50">
                                    <td className="p-4">
                                        <span className="font-mono font-bold text-primary">{coupon.code}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-medium">
                                            {coupon.discountType === 'percentage'
                                                ? `${coupon.discountValue}%`
                                                : `${coupon.discountValue} ج.م`}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-muted-foreground">
                                            {coupon.usedCount}
                                            {coupon.maxUses ? ` / ${coupon.maxUses}` : ' (غير محدود)'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {coupon.validUntil
                                            ? formatDate(coupon.validUntil)
                                            : <span className="text-muted-foreground">دائم</span>
                                        }
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleToggleActive(coupon)}
                                            className={`px-3 py-1 rounded-full text-sm ${coupon.isActive
                                                    ? 'bg-success/10 text-success'
                                                    : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            {coupon.isActive ? 'نشط' : 'غير نشط'}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(coupon)}
                                                className="text-primary hover:underline text-sm"
                                            >
                                                تعديل
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-destructive hover:underline text-sm"
                                            >
                                                حذف
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                />
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card p-6 max-w-lg w-full animate-in max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6">
                            {editingCoupon ? 'تعديل كود الخصم' : 'إضافة كود خصم جديد'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">كود الخصم</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="مثال: WELCOME20"
                                    className="input w-full font-mono"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">نوع الخصم</label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="percentage">نسبة مئوية (%)</option>
                                        <option value="fixed">مبلغ ثابت (ج.م)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">قيمة الخصم</label>
                                    <input
                                        type="number"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                        placeholder={formData.discountType === 'percentage' ? '20' : '50'}
                                        className="input w-full"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">الحد الأقصى للاستخدام</label>
                                    <input
                                        type="number"
                                        value={formData.maxUses}
                                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                        placeholder="فارغ = غير محدود"
                                        className="input w-full"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">لكل مستخدم</label>
                                    <input
                                        type="number"
                                        value={formData.maxUsesPerUser}
                                        onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                                        className="input w-full"
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">تاريخ الانتهاء</label>
                                    <input
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">الحد الأدنى للطلب</label>
                                    <input
                                        type="number"
                                        value={formData.minOrderAmount}
                                        onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                        placeholder="فارغ = لا يوجد حد"
                                        className="input w-full"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isActive" className="text-sm">نشط ويمكن استخدامه</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="btn-outline flex-1 py-2"
                                >
                                    إلغاء
                                </button>
                                <button type="submit" className="btn-primary flex-1 py-2">
                                    {editingCoupon ? 'حفظ التعديلات' : 'إضافة الكود'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

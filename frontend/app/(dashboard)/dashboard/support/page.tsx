'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Ticket {
    id: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    _count: {
        messages: number;
    };
}

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showNewTicketForm, setShowNewTicketForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        category: 'technical',
        priority: 'normal',
    });

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/support/tickets`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) {
                // Only show error on initial load
                if (isLoading) {
                    throw new Error('فشل في تحميل التذاكر');
                }
                return;
            }

            const data = await response.json();
            setTickets(data.data?.tickets || []);
            setError(''); // Clear error on success
        } catch (err) {
            if (isLoading) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/support/tickets`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newTicket),
                }
            );

            if (!response.ok) throw new Error('Failed to create ticket');

            setShowNewTicketForm(false);
            setNewTicket({ subject: '', description: '', category: 'technical', priority: 'normal' });
            fetchTickets();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; class: string }> = {
            open: { label: 'جديدة', class: 'badge-primary' },
            waiting_customer: { label: 'بانتظار ردك', class: 'badge-warning' },
            waiting_admin: { label: 'بانتظار الدعم', class: 'badge-secondary' },
            resolved: { label: 'تم الحل', class: 'badge-success' },
            closed: { label: 'مغلقة', class: 'badge-secondary' },
        };
        const config = map[status] || { label: status, class: 'badge-secondary' };
        return <span className={config.class}>{config.label}</span>;
    };

    const getCategoryLabel = (category: string) => {
        const map: Record<string, string> = {
            billing: 'الفواتير',
            technical: 'دعم فني',
            refund: 'استرداد',
            other: 'أخرى',
        };
        return map[category] || category;
    };

    const getPriorityBadge = (priority: string) => {
        const map: Record<string, { label: string; class: string }> = {
            low: { label: 'منخفضة', class: 'text-muted-foreground' },
            normal: { label: 'عادية', class: 'text-foreground' },
            high: { label: 'عالية', class: 'text-warning' },
            urgent: { label: 'عاجلة', class: 'text-destructive font-bold' },
        };
        const config = map[priority] || { label: priority, class: '' };
        return <span className={config.class}>{config.label}</span>;
    };

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">الدعم الفني</h1>
                    <p className="text-muted-foreground">تواصل معنا لأي استفسار أو مشكلة</p>
                </div>
                <button
                    onClick={() => setShowNewTicketForm(true)}
                    className="btn-primary px-4 py-2 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    تذكرة جديدة
                </button>
            </div>

            {/* New Ticket Form Modal */}
            {showNewTicketForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">تذكرة دعم جديدة</h2>
                            <button
                                onClick={() => setShowNewTicketForm(false)}
                                className="p-2 hover:bg-muted rounded-lg"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmitTicket} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">الموضوع</label>
                                <input
                                    type="text"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                    className="input"
                                    placeholder="أدخل موضوع التذكرة"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">نوع التذكرة</label>
                                <select
                                    value={newTicket.category}
                                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                    className="input"
                                >
                                    <option value="technical">دعم فني</option>
                                    <option value="billing">الفواتير</option>
                                    <option value="refund">استرداد</option>
                                    <option value="other">أخرى</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">الوصف</label>
                                <textarea
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    className="input min-h-[120px]"
                                    placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNewTicketForm(false)}
                                    className="btn-outline flex-1 py-2"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary flex-1 py-2"
                                >
                                    {isSubmitting ? 'جاري الإرسال...' : 'إرسال التذكرة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="card p-4 bg-destructive/10 text-destructive">
                    {error}
                </div>
            )}

            {/* Tickets List */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="skeleton h-20 w-full" />
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </div>
                        <h3 className="font-medium mb-1">لا توجد تذاكر</h3>
                        <p className="text-muted-foreground text-sm">لم تقم بإنشاء أي تذاكر دعم بعد</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {tickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/dashboard/support/${ticket.id}`}
                                className="block p-4 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getStatusBadge(ticket.status)}
                                            <span className="text-xs text-muted-foreground">
                                                {getCategoryLabel(ticket.category)}
                                            </span>
                                        </div>
                                        <h3 className="font-medium truncate">{ticket.subject}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                            {ticket.description}
                                        </p>
                                    </div>
                                    <div className="text-left text-sm">
                                        <p className="text-muted-foreground">{formatDate(ticket.createdAt)}</p>
                                        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                            {ticket._count.messages}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Help Section */}
            <div className="card p-6">
                <h2 className="text-lg font-bold mb-4">هل تحتاج مساعدة سريعة؟</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    <a
                        href="mailto:support@n8nsaas.com"
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">البريد الإلكتروني</p>
                            <p className="text-sm text-muted-foreground">support@n8nsaas.com</p>
                        </div>
                    </a>

                    <a
                        href="https://wa.me/201234567890"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">واتساب</p>
                            <p className="text-sm text-muted-foreground">رد سريع</p>
                        </div>
                    </a>

                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">ساعات العمل</p>
                            <p className="text-sm text-muted-foreground">24/7 دعم متواصل</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
    id: string;
    content: string;
    isFromAdmin: boolean;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        role: string;
    };
}

interface Ticket {
    id: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    firstResponseAt: string | null;
    resolvedAt: string | null;
    user: {
        id: string;
        email: string;
        fullName: string;
    };
    assignedAdmin: {
        id: string;
        email: string;
        fullName: string;
    } | null;
    messages: Message[];
}

export default function AdminTicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTicket();

        // Auto-refresh messages every 5 seconds
        const interval = setInterval(() => {
            fetchTicketSilent();
        }, 5000);

        return () => clearInterval(interval);
    }, [params.ticketId]);

    useEffect(() => {
        scrollToBottom();
    }, [ticket?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Silent fetch (no loading state) for auto-refresh
    const fetchTicketSilent = async () => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/support/tickets/${params.ticketId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) return;

            const data = await response.json();
            if (data.data?.ticket) {
                setTicket(data.data.ticket);
            }
        } catch {
            // Silent fail for auto-refresh
        }
    };

    const fetchTicket = async () => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/support/tickets/${params.ticketId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch ticket');

            const data = await response.json();
            setTicket(data.data?.ticket);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            const token = localStorage.getItem('adminAccessToken');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/support/tickets/${params.ticketId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content: newMessage }),
                }
            );

            if (!response.ok) throw new Error('Failed to send message');

            setNewMessage('');
            fetchTicket();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsSending(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/support/tickets/${params.ticketId}/status`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );
            fetchTicket();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
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
            waiting_customer: { label: 'بانتظار العميل', class: 'badge-warning' },
            waiting_admin: { label: 'بانتظار الرد', class: 'badge-destructive' },
            resolved: { label: 'تم الحل', class: 'badge-success' },
            closed: { label: 'مغلقة', class: 'badge-secondary' },
        };
        const config = map[status] || { label: status, class: 'badge-secondary' };
        return <span className={config.class}>{config.label}</span>;
    };

    const getPriorityLabel = (priority: string) => {
        const map: Record<string, string> = {
            low: 'منخفضة',
            normal: 'عادية',
            high: 'عالية',
            urgent: '🔥 عاجلة',
        };
        return map[priority] || priority;
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

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="skeleton h-8 w-48" />
                <div className="card p-6">
                    <div className="skeleton h-6 w-64 mb-4" />
                    <div className="skeleton h-4 w-full mb-2" />
                    <div className="skeleton h-4 w-3/4" />
                </div>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="card p-6 text-center">
                <p className="text-destructive mb-4">{error || 'التذكرة غير موجودة'}</p>
                <Link href="/admin/tickets" className="btn-primary px-4 py-2">
                    العودة للتذاكر
                </Link>
            </div>
        );
    }

    const isClosed = ticket.status === 'closed';

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Link
                    href="/admin/tickets"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(ticket.status)}
                        <span className={`text-sm ${ticket.priority === 'urgent' ? 'text-destructive font-bold' : ticket.priority === 'high' ? 'text-warning' : 'text-muted-foreground'}`}>
                            {getPriorityLabel(ticket.priority)}
                        </span>
                        <span className="text-sm text-muted-foreground">#{ticket.id.slice(0, 8)}</span>
                    </div>
                    <h1 className="text-2xl font-bold">{ticket.subject}</h1>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Messages */}
                    <div className="card">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="font-medium">المحادثة</h2>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                                </span>
                                <span>تحديث تلقائي</span>
                            </div>
                        </div>

                        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                            {/* Original Description */}
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary font-medium">
                                        {ticket.user.fullName.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">{ticket.user.fullName}</span>
                                        <span className="text-xs text-muted-foreground">{formatDate(ticket.createdAt)}</span>
                                    </div>
                                    <div className="bg-muted rounded-lg p-3">
                                        <p className="whitespace-pre-wrap">{ticket.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            {ticket.messages.map((message) => (
                                <div key={message.id} className="flex gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${message.isFromAdmin ? 'bg-success/10' : 'bg-primary/10'
                                        }`}>
                                        <span className={message.isFromAdmin ? 'text-success' : 'text-primary'}>
                                            {message.isFromAdmin ? '👤' : message.user.fullName.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">
                                                {message.isFromAdmin ? message.user.fullName : message.user.fullName}
                                            </span>
                                            {message.isFromAdmin && (
                                                <span className="badge-success text-xs">دعم</span>
                                            )}
                                            <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
                                        </div>
                                        <div className={`rounded-lg p-3 ${message.isFromAdmin ? 'bg-success/10' : 'bg-muted'}`}>
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Form */}
                        {!isClosed && (
                            <form onSubmit={handleSendMessage} className="p-4 border-t">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="اكتب ردك للعميل..."
                                    className="input w-full min-h-[100px]"
                                    required
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        type="submit"
                                        disabled={isSending || !newMessage.trim()}
                                        className="btn-primary px-6 py-2"
                                    >
                                        {isSending ? 'جاري الإرسال...' : 'إرسال الرد'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="card p-4">
                        <h3 className="font-medium mb-4">معلومات العميل</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-primary text-lg font-medium">
                                        {ticket.user.fullName.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium">{ticket.user.fullName}</p>
                                    <p className="text-sm text-muted-foreground">{ticket.user.email}</p>
                                </div>
                            </div>
                            <Link
                                href={`/admin/users/${ticket.user.id}`}
                                className="btn-outline w-full py-2 text-sm"
                            >
                                عرض ملف العميل
                            </Link>
                        </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="card p-4">
                        <h3 className="font-medium mb-4">تفاصيل التذكرة</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">التصنيف</span>
                                <span>{getCategoryLabel(ticket.category)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">الأولوية</span>
                                <span className={ticket.priority === 'urgent' ? 'text-destructive font-bold' : ticket.priority === 'high' ? 'text-warning' : ''}>
                                    {getPriorityLabel(ticket.priority)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">تاريخ الإنشاء</span>
                                <span>{formatDate(ticket.createdAt)}</span>
                            </div>
                            {ticket.firstResponseAt && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">أول رد</span>
                                    <span>{formatDate(ticket.firstResponseAt)}</span>
                                </div>
                            )}
                            {ticket.resolvedAt && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">تم الحل</span>
                                    <span>{formatDate(ticket.resolvedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="card p-4">
                        <h3 className="font-medium mb-4">إجراءات</h3>
                        <div className="space-y-2">
                            <select
                                value={ticket.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="input w-full"
                                disabled={isClosed}
                            >
                                <option value="open">جديدة</option>
                                <option value="waiting_customer">بانتظار العميل</option>
                                <option value="waiting_admin">بانتظار الرد</option>
                                <option value="resolved">تم الحل</option>
                                <option value="closed">مغلقة</option>
                            </select>

                            {!isClosed && (
                                <button
                                    onClick={() => handleStatusChange('resolved')}
                                    className="btn-success w-full py-2"
                                >
                                    ✓ تحديد كمحلول
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

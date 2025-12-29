/**
 * Email Service
 * SendGrid integration for transactional emails
 */

import { logger } from '../config/logger.js';
import { prisma } from '../config/database.js';

// Email templates
const TEMPLATES = {
    WELCOME: 'welcome',
    EMAIL_VERIFICATION: 'email_verification',
    SUBSCRIPTION_CONFIRMED: 'subscription_confirmed',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',
    SUBSCRIPTION_PAUSED: 'subscription_paused',
    SUBSCRIPTION_RESUMED: 'subscription_resumed',
    SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
    SUBSCRIPTION_EXPIRING: 'subscription_expiring',
    PASSWORD_RESET: 'password_reset',
    INSTANCE_READY: 'instance_ready',
    SUPPORT_TICKET_CREATED: 'support_ticket_created',
    SUPPORT_TICKET_REPLY: 'support_ticket_reply',
    REFUND_PROCESSED: 'refund_processed',
} as const;

type TemplateType = keyof typeof TEMPLATES;

interface EmailData {
    to: string;
    subject: string;
    template: TemplateType;
    data: Record<string, unknown>;
}

interface SendGridConfig {
    apiKey: string;
    fromEmail: string;
    fromName: string;
}

class EmailService {
    private config: SendGridConfig;
    private isConfigured: boolean = false;

    constructor() {
        this.config = {
            apiKey: process.env.SENDGRID_API_KEY || '',
            fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@n8n-saas.com',
            fromName: process.env.SENDGRID_FROM_NAME || 'n8n SaaS Platform',
        };

        this.isConfigured = !!this.config.apiKey;

        if (!this.isConfigured) {
            logger.warn('SendGrid is not configured. Emails will be queued but not sent.');
        }
    }

    /**
     * Get email template content in Arabic
     */
    private getTemplate(template: TemplateType, data: Record<string, unknown>): { subject: string; html: string } {
        const templates: Record<TemplateType, { subject: string; html: string }> = {
            WELCOME: {
                subject: 'مرحباً بك في n8n SaaS! 🎉',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">مرحباً ${data.fullName}! 🎉</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px; line-height: 1.8;">شكراً لانضمامك إلى منصة n8n SaaS!</p>
                            <p style="font-size: 16px; line-height: 1.8;">نحن متحمسون لمساعدتك في أتمتة سير عملك.</p>
                            <a href="${data.loginUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px;">تسجيل الدخول</a>
                        </div>
                    </div>
                `,
            },
            EMAIL_VERIFICATION: {
                subject: 'تأكيد البريد الإلكتروني ✉️',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">تأكيد البريد الإلكتروني ✉️</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px; line-height: 1.8;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px; line-height: 1.8;">الرجاء تأكيد بريدك الإلكتروني للاستفادة من جميع مميزات المنصة.</p>
                            <p style="font-size: 14px; color: #94a3b8;">هذا الرابط صالح لمدة 24 ساعة.</p>
                            <a href="${data.verifyUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px;">تأكيد البريد الإلكتروني</a>
                            <p style="font-size: 14px; color: #64748b; margin-top: 20px;">إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد.</p>
                        </div>
                    </div>
                `,
            },
            SUBSCRIPTION_CONFIRMED: {
                subject: 'تم تأكيد اشتراكك ✓',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">تم تأكيد اشتراكك! ✓</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">تم تفعيل اشتراكك بنجاح!</p>
                            <div style="background: #2d2d3d; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>الخطة:</strong> ${data.planType === 'yearly' ? 'سنوية' : 'شهرية'}</p>
                                <p><strong>المبلغ:</strong> ${data.amount} ج.م</p>
                                <p><strong>التجديد التالي:</strong> ${data.nextBillingDate}</p>
                            </div>
                            <a href="${data.dashboardUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none;">الذهاب للوحة التحكم</a>
                        </div>
                    </div>
                `,
            },
            PAYMENT_SUCCESS: {
                subject: 'تم الدفع بنجاح 💳',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">تم الدفع بنجاح! 💳</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">تمت معالجة دفعتك بنجاح.</p>
                            <div style="background: #2d2d3d; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>رقم العملية:</strong> ${data.transactionId}</p>
                                <p><strong>المبلغ:</strong> ${data.amount} ج.م</p>
                                <p><strong>التاريخ:</strong> ${data.date}</p>
                            </div>
                            <a href="${data.invoiceUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none;">عرض الفاتورة</a>
                        </div>
                    </div>
                `,
            },
            PAYMENT_FAILED: {
                subject: 'فشل في عملية الدفع ⚠️',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">فشل في عملية الدفع ⚠️</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">للأسف، فشلت محاولة الدفع الأخيرة.</p>
                            <p style="font-size: 16px;">السبب: ${data.reason}</p>
                            <a href="${data.updatePaymentUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px;">تحديث طريقة الدفع</a>
                        </div>
                    </div>
                `,
            },
            SUBSCRIPTION_PAUSED: {
                subject: 'تم إيقاف اشتراكك مؤقتاً ⏸️',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #d97706, #f59e0b); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">تم إيقاف اشتراكك مؤقتاً ⏸️</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">تم إيقاف اشتراكك مؤقتاً كما طلبت.</p>
                            <p style="font-size: 16px;">يمكنك استئناف اشتراكك في أي وقت.</p>
                            <a href="${data.resumeUrl}" style="display: inline-block; background: #d97706; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px;">استئناف الاشتراك</a>
                        </div>
                    </div>
                `,
            },
            SUBSCRIPTION_RESUMED: {
                subject: 'تم استئناف اشتراكك ▶️',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">تم استئناف اشتراكك ▶️</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">مرحباً بعودتك! تم استئناف اشتراكك بنجاح.</p>
                            <a href="${data.instanceUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px;">الذهاب إلى n8n</a>
                        </div>
                    </div>
                `,
            },
            SUBSCRIPTION_CANCELLED: {
                subject: 'تم إلغاء اشتراكك 😢',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #64748b, #94a3b8); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">تم إلغاء اشتراكك</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">نأسف لرؤيتك تغادر. تم إلغاء اشتراكك بنجاح.</p>
                            <p style="font-size: 16px;">ستبقى بياناتك محفوظة لمدة ${data.retentionDays} يوم.</p>
                            <a href="${data.resubscribeUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px;">إعادة الاشتراك</a>
                        </div>
                    </div>
                `,
            },
            SUBSCRIPTION_EXPIRING: {
                subject: 'اشتراكك ينتهي قريباً ⏰',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #d97706, #f59e0b); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">اشتراكك ينتهي قريباً ⏰</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">اشتراكك سينتهي في ${data.expiryDate}.</p>
                            <p style="font-size: 16px;">تأكد من تحديث طريقة الدفع لضمان استمرار الخدمة.</p>
                            <a href="${data.renewUrl}" style="display: inline-block; background: #d97706; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px;">تجديد الاشتراك</a>
                        </div>
                    </div>
                `,
            },
            PASSWORD_RESET: {
                subject: 'إعادة تعيين كلمة المرور 🔐',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">إعادة تعيين كلمة المرور 🔐</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.</p>
                            <p style="font-size: 14px; color: #94a3b8;">هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
                            <a href="${data.resetUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px;">إعادة تعيين كلمة المرور</a>
                            <p style="font-size: 14px; color: #64748b; margin-top: 20px;">إذا لم تطلب هذا، يمكنك تجاهل هذا البريد.</p>
                        </div>
                    </div>
                `,
            },
            INSTANCE_READY: {
                subject: 'منصة n8n الخاصة بك جاهزة! 🚀',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">منصة n8n الخاصة بك جاهزة! 🚀</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">تم إعداد منصة n8n الخاصة بك وهي جاهزة للاستخدام!</p>
                            <div style="background: #2d2d3d; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>رابط المنصة:</strong> ${data.instanceUrl}</p>
                            </div>
                            <a href="${data.instanceUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none;">الذهاب إلى n8n</a>
                        </div>
                    </div>
                `,
            },
            SUPPORT_TICKET_CREATED: {
                subject: 'تم إنشاء تذكرة دعم جديدة #${data.ticketId}',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">تم إنشاء تذكرة دعم جديدة</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">تم استلام طلب الدعم الخاص بك.</p>
                            <div style="background: #2d2d3d; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>رقم التذكرة:</strong> #${data.ticketId}</p>
                                <p><strong>الموضوع:</strong> ${data.subject}</p>
                            </div>
                            <p style="font-size: 14px; color: #94a3b8;">سنرد عليك في أقرب وقت ممكن.</p>
                            <a href="${data.ticketUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px;">عرض التذكرة</a>
                        </div>
                    </div>
                `,
            },
            SUPPORT_TICKET_REPLY: {
                subject: 'رد جديد على تذكرتك #${data.ticketId}',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">رد جديد على تذكرتك</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">لديك رد جديد على تذكرتك.</p>
                            <div style="background: #2d2d3d; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>رقم التذكرة:</strong> #${data.ticketId}</p>
                                <p><strong>الموضوع:</strong> ${data.subject}</p>
                            </div>
                            <a href="${data.ticketUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none;">عرض الرد</a>
                        </div>
                    </div>
                `,
            },
            REFUND_PROCESSED: {
                subject: 'تم معالجة طلب الاسترداد 💰',
                html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; border-radius: 16px 16px 0 0;">
                            <h1 style="color: white; margin: 0;">تم معالجة طلب الاسترداد 💰</h1>
                        </div>
                        <div style="background: #1e1e2e; color: #e2e8f0; padding: 30px; border-radius: 0 0 16px 16px;">
                            <p style="font-size: 16px;">مرحباً ${data.fullName}،</p>
                            <p style="font-size: 16px;">تم معالجة طلب الاسترداد الخاص بك بنجاح.</p>
                            <div style="background: #2d2d3d; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>المبلغ المسترد:</strong> ${data.amount} ج.م</p>
                                <p><strong>سيظهر المبلغ في حسابك خلال 3-5 أيام عمل.</strong></p>
                            </div>
                        </div>
                    </div>
                `,
            },
        };

        return templates[template];
    }

    /**
     * Send email using SendGrid API
     */
    private async sendWithSendGrid(emailData: EmailData): Promise<boolean> {
        if (!this.isConfigured) {
            logger.warn(`Email not sent (SendGrid not configured): ${emailData.template} to ${emailData.to}`);
            return false;
        }

        const templateContent = this.getTemplate(emailData.template, emailData.data);

        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: emailData.to }] }],
                    from: {
                        email: this.config.fromEmail,
                        name: this.config.fromName,
                    },
                    subject: templateContent.subject,
                    content: [
                        {
                            type: 'text/html',
                            value: templateContent.html,
                        },
                    ],
                }),
            });

            if (response.ok || response.status === 202) {
                logger.info(`Email sent successfully: ${emailData.template} to ${emailData.to}`);
                return true;
            } else {
                const error = await response.text();
                logger.error(`Failed to send email: ${error}`);
                return false;
            }
        } catch (error) {
            logger.error('SendGrid API error:', error);
            return false;
        }
    }

    /**
     * Queue email for sending (with retry logic)
     */
    async queueEmail(emailData: EmailData): Promise<void> {
        const templateContent = this.getTemplate(emailData.template, emailData.data);

        await prisma.emailQueue.create({
            data: {
                to: emailData.to,
                subject: templateContent.subject,
                template: emailData.template,
                data: JSON.stringify(emailData.data),
                status: 'pending',
            },
        });

        // Try to send immediately
        const sent = await this.sendWithSendGrid(emailData);

        if (sent) {
            await prisma.emailQueue.updateMany({
                where: { to: emailData.to, template: emailData.template, status: 'pending' },
                data: { status: 'sent', sentAt: new Date() },
            });
        }
    }

    /**
     * Process email queue (for cron job)
     */
    async processQueue(): Promise<void> {
        const pendingEmails = await prisma.emailQueue.findMany({
            where: { status: 'pending', attempts: { lt: 3 } },
            take: 10,
        });

        for (const email of pendingEmails) {
            const emailData: EmailData = {
                to: email.to,
                subject: email.subject,
                template: email.template as TemplateType,
                data: JSON.parse(email.data),
            };

            const sent = await this.sendWithSendGrid(emailData);

            await prisma.emailQueue.update({
                where: { id: email.id },
                data: {
                    attempts: email.attempts + 1,
                    status: sent ? 'sent' : 'pending',
                    sentAt: sent ? new Date() : undefined,
                    lastError: sent ? null : 'Failed to send',
                },
            });
        }
    }

    // Convenience methods for common emails
    async sendWelcome(email: string, fullName: string): Promise<void> {
        await this.queueEmail({
            to: email,
            subject: 'مرحباً بك في n8n SaaS!',
            template: 'WELCOME',
            data: {
                fullName,
                loginUrl: `${process.env.FRONTEND_URL}/login`,
            },
        });
    }

    async sendSubscriptionConfirmed(
        email: string,
        fullName: string,
        planType: string,
        amount: number,
        nextBillingDate: string
    ): Promise<void> {
        await this.queueEmail({
            to: email,
            subject: 'تم تأكيد اشتراكك',
            template: 'SUBSCRIPTION_CONFIRMED',
            data: {
                fullName,
                planType,
                amount,
                nextBillingDate,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
            },
        });
    }

    async sendPaymentSuccess(
        email: string,
        fullName: string,
        amount: number,
        transactionId: string
    ): Promise<void> {
        await this.queueEmail({
            to: email,
            subject: 'تم الدفع بنجاح',
            template: 'PAYMENT_SUCCESS',
            data: {
                fullName,
                amount,
                transactionId,
                date: new Date().toLocaleDateString('ar-EG'),
                invoiceUrl: `${process.env.FRONTEND_URL}/dashboard/billing`,
            },
        });
    }

    async sendPaymentFailed(email: string, fullName: string, reason: string): Promise<void> {
        await this.queueEmail({
            to: email,
            subject: 'فشل في عملية الدفع',
            template: 'PAYMENT_FAILED',
            data: {
                fullName,
                reason,
                updatePaymentUrl: `${process.env.FRONTEND_URL}/dashboard/billing`,
            },
        });
    }

    async sendInstanceReady(email: string, fullName: string, instanceUrl: string): Promise<void> {
        await this.queueEmail({
            to: email,
            subject: 'منصة n8n الخاصة بك جاهزة!',
            template: 'INSTANCE_READY',
            data: {
                fullName,
                instanceUrl,
            },
        });
    }

    async sendPasswordReset(email: string, fullName: string, resetToken: string): Promise<void> {
        await this.queueEmail({
            to: email,
            subject: 'إعادة تعيين كلمة المرور',
            template: 'PASSWORD_RESET',
            data: {
                fullName,
                resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
            },
        });
    }

    async sendSupportTicketCreated(
        email: string,
        fullName: string,
        ticketId: string,
        subject: string
    ): Promise<void> {
        await this.queueEmail({
            to: email,
            subject: `تم إنشاء تذكرة دعم جديدة #${ticketId.slice(0, 8)}`,
            template: 'SUPPORT_TICKET_CREATED',
            data: {
                fullName,
                ticketId: ticketId.slice(0, 8),
                subject,
                ticketUrl: `${process.env.FRONTEND_URL}/dashboard/support/${ticketId}`,
            },
        });
    }

    async sendSupportTicketReply(
        email: string,
        fullName: string,
        ticketId: string,
        subject: string
    ): Promise<void> {
        await this.queueEmail({
            to: email,
            subject: `رد جديد على تذكرتك #${ticketId.slice(0, 8)}`,
            template: 'SUPPORT_TICKET_REPLY',
            data: {
                fullName,
                ticketId: ticketId.slice(0, 8),
                subject,
                ticketUrl: `${process.env.FRONTEND_URL}/dashboard/support/${ticketId}`,
            },
        });
    }

    async sendEmailVerification(email: string, fullName: string, verificationToken: string): Promise<void> {
        await this.queueEmail({
            to: email,
            subject: 'تأكيد البريد الإلكتروني',
            template: 'EMAIL_VERIFICATION',
            data: {
                fullName,
                verifyUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
            },
        });
    }
}

export const emailService = new EmailService();

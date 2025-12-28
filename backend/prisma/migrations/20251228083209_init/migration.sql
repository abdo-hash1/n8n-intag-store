-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "instance_url" TEXT,
    "container_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "marketing_emails" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "plan_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "amount" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "gateway_subscription_id" TEXT,
    "gateway_customer_id" TEXT,
    "payment_gateway" TEXT,
    "current_period_start" DATETIME NOT NULL,
    "current_period_end" DATETIME NOT NULL,
    "next_billing_date" DATETIME,
    "paused_at" DATETIME,
    "pause_reason" TEXT,
    "resume_date" DATETIME,
    "cancelled_at" DATETIME,
    "cancel_reason" TEXT,
    "credit_balance" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscription_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gateway_transaction_id" TEXT,
    "payment_gateway" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failure_reason" TEXT,
    "refunded_at" DATETIME,
    "refund_amount" REAL,
    "payment_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoice_url" TEXT,
    CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refund_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "additional_details" TEXT,
    "requested_amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "admin_notes" TEXT,
    "processed_by" TEXT,
    "processed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "refund_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refund_requests_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refund_requests_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refund_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assigned_admin_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "resolved_at" DATETIME,
    "closed_at" DATETIME,
    "first_response_at" DATETIME,
    "sla_breached" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "support_tickets_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_from_admin" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "support_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "subscription_id" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "activity_logs_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" DATETIME
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gateway" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processing_error" TEXT,
    "ip_address" TEXT,
    "headers" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" DATETIME
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

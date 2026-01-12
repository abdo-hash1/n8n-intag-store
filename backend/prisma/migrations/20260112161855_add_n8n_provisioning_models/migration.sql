/*
  Warnings:

  - You are about to drop the column `container_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `instance_url` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN "refund_reason" TEXT;

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "discount_type" TEXT NOT NULL,
    "discount_value" REAL NOT NULL,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "max_uses_per_user" INTEGER NOT NULL DEFAULT 1,
    "valid_from" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "applicable_plans" TEXT,
    "min_order_amount" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupon_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "discount_amount" REAL NOT NULL,
    "used_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pricing_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plan_type" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "features" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "n8n_instances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "container_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "allocated_ram" INTEGER NOT NULL DEFAULT 2048,
    "allocated_cpu" INTEGER NOT NULL DEFAULT 1,
    "db_name" TEXT,
    "db_user" TEXT,
    "db_password" TEXT,
    "encryption_key" TEXT,
    "webhook_url" TEXT,
    "worker_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provisioned_at" DATETIME,
    "suspended_at" DATETIME,
    "scheduled_delete_at" DATETIME,
    "deleted_at" DATETIME,
    "last_error" TEXT,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "n8n_instances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "n8n_instances_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "cluster_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cluster_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hetzner_id" TEXT,
    "server_type" TEXT NOT NULL DEFAULT 'cx43',
    "ip_address" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'fsn1',
    "node_type" TEXT NOT NULL DEFAULT 'worker',
    "max_instances" INTEGER NOT NULL DEFAULT 6,
    "current_load" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_health_check" DATETIME,
    "health_status" TEXT NOT NULL DEFAULT 'unknown',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "provisioning_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instance_id" TEXT,
    "node_id" TEXT,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'started',
    "details" TEXT,
    "error" TEXT,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "duration_ms" INTEGER,
    "triggered_by" TEXT,
    CONSTRAINT "provisioning_logs_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "n8n_instances" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "provisioning_logs_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "cluster_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "marketing_emails" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_users" ("created_at", "email", "email_notifications", "full_name", "id", "last_login_at", "marketing_emails", "password", "phone", "role", "status", "updated_at") SELECT "created_at", "email", "email_notifications", "full_name", "id", "last_login_at", "marketing_emails", "password", "phone", "role", "status", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_config_plan_type_key" ON "pricing_config"("plan_type");

-- CreateIndex
CREATE UNIQUE INDEX "n8n_instances_user_id_key" ON "n8n_instances"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "n8n_instances_subdomain_key" ON "n8n_instances"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "cluster_nodes_name_key" ON "cluster_nodes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cluster_nodes_hetzner_id_key" ON "cluster_nodes"("hetzner_id");

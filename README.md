# n8n SaaS Platform - Complete Documentation

> **Version**: 1.0.0  
> **Last Updated**: January 2, 2026  
> **Status**: Development - Phase 1 Complete, Phase 2 Planned

A complete SaaS platform for hosting n8n automation instances with subscription-based billing, designed for the Egyptian market.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Completed Features](#-completed-features)
3. [Technology Stack](#-technology-stack)
4. [Project Structure](#-project-structure)
5. [Database Schema](#-database-schema)
6. [API Endpoints](#-api-endpoints)
7. [Business Logic](#-business-logic)
8. [Admin Panel Features](#-admin-panel-features)
9. [Next Phase: n8n Instance Provisioning](#-next-phase-n8n-instance-provisioning)
10. [Infrastructure Architecture](#-infrastructure-architecture)
11. [Setup Instructions](#-setup-instructions)
12. [Environment Variables](#-environment-variables)
13. [Security Features](#-security-features)

---

## 🎯 Project Overview

This platform enables customers to subscribe to hosted n8n automation instances. The system handles:

- **User Registration & Authentication**
- **Subscription Management** (Monthly/Annual plans)
- **Payment Processing** (Paymob integration for Egyptian payments)
- **Support Ticketing System**
- **Admin Dashboard** for platform management
- **Automated n8n Instance Provisioning** (Next Phase)

### Target Market
- Egyptian businesses needing automation
- Pricing in EGP (Egyptian Pounds)
- Arabic-friendly UI

---

## ✅ Completed Features

### Phase 1 - Core Platform (DONE)

#### Authentication System
- [x] User signup with email verification
- [x] Login with JWT tokens
- [x] Password reset flow
- [x] Session management
- [x] Role-based access (user, admin, super_admin, support_agent)

#### Subscription Management
- [x] Monthly plan (400 EGP/month)
- [x] Annual plan (3,800 EGP/year)
- [x] Plan upgrade/downgrade with proration
- [x] Subscription pause/resume
- [x] Subscription cancellation
- [x] Grace period (7 days) for failed payments

#### Payment System
- [x] Paymob payment gateway integration
- [x] Payment webhook handling
- [x] Invoice generation
- [x] Refund requests workflow
- [x] Payment retry logic

#### Coupon System
- [x] Percentage and fixed-amount discounts
- [x] Validity period (start/end dates)
- [x] Usage limits (total and per-user)
- [x] Plan-specific coupons
- [x] Minimum order amount requirements

#### Support System
- [x] Ticket creation with categories
- [x] Priority levels (low, normal, high, urgent)
- [x] Message threading
- [x] Admin assignment
- [x] Status workflow (open → waiting → resolved → closed)
- [x] SLA tracking

#### Admin Panel
- [x] Dashboard with key metrics
- [x] User management (list, view, edit, suspend)
- [x] Subscription management
- [x] Payment history
- [x] Coupon management (CRUD)
- [x] Pricing configuration (edit plan prices and features)
- [x] Support ticket management
- [x] Activity logs
- [x] **Pagination component** - reusable across all list views
- [x] Search and filtering

#### Email System
- [x] SendGrid integration
- [x] Welcome emails
- [x] Payment confirmation
- [x] Subscription updates
- [x] Password reset
- [x] Support ticket notifications

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 20+** | Runtime environment |
| **Express.js** | Web framework |
| **TypeScript** | Type safety |
| **Prisma ORM** | Database abstraction |
| **SQLite** (dev) / **PostgreSQL** (prod) | Database |
| **JWT** | Authentication tokens |
| **bcrypt** | Password hashing |
| **SendGrid** | Email delivery |
| **Paymob** | Payment gateway |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14+** | React framework (App Router) |
| **TypeScript** | Type safety |
| **TailwindCSS** | Styling |
| **Shadcn/ui** | UI component library |
| **Lucide Icons** | Icon library |
| **React Hook Form** | Form management |
| **Zod** | Validation |

### Infrastructure (Planned)
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Swarm** | Orchestration |
| **Hetzner Cloud** | VPS hosting |
| **Traefik** | Reverse proxy & SSL |
| **PostgreSQL** | Shared database |
| **Redis** | Queue for n8n |

---

## 📁 Project Structure

```
n8n-intag-store/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database models
│   │   ├── seed.ts                # Seed data script
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts        # Prisma client
│   │   │   ├── env.ts             # Environment config
│   │   │   └── swagger.ts         # API docs config
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── subscription.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── support.controller.ts
│   │   │   ├── coupon.controller.ts
│   │   │   ├── admin.controller.ts
│   │   │   └── webhook.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts     # JWT verification
│   │   │   ├── admin.middleware.ts    # Admin role check
│   │   │   ├── validate.middleware.ts # Request validation
│   │   │   ├── error.middleware.ts    # Error handling
│   │   │   └── rateLimiter.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── subscription.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── support.routes.ts
│   │   │   ├── coupon.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── webhook.routes.ts
│   │   │   ├── pricing.routes.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts        # Authentication logic
│   │   │   ├── user.service.ts        # User management
│   │   │   ├── subscription.service.ts # Subscription logic
│   │   │   ├── paymob.service.ts      # Payment gateway
│   │   │   ├── support.service.ts     # Ticketing system
│   │   │   ├── coupon.service.ts      # Coupon management
│   │   │   ├── pricing.service.ts     # Dynamic pricing
│   │   │   ├── admin.service.ts       # Admin operations
│   │   │   ├── email.service.ts       # Email templates & sending
│   │   │   ├── activityLog.service.ts # Audit logging
│   │   │   └── docker.service.ts      # Container management (stub)
│   │   ├── utils/
│   │   │   ├── jwt.ts                 # Token helpers
│   │   │   ├── password.ts            # Hashing utilities
│   │   │   ├── validators.ts          # Input validation
│   │   │   ├── pagination.ts          # Pagination helper
│   │   │   └── date.ts                # Date formatting
│   │   └── server.ts                  # Express app entry
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           # User dashboard
│   │   │       ├── billing/page.tsx
│   │   │       ├── settings/page.tsx
│   │   │       ├── support/page.tsx
│   │   │       └── layout.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx               # Admin dashboard
│   │   │   ├── layout.tsx             # Admin layout with sidebar
│   │   │   ├── users/page.tsx         # User management
│   │   │   ├── subscriptions/page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   ├── coupons/page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   ├── tickets/page.tsx
│   │   │   ├── activity/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        # Shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── Pagination.tsx             # Reusable pagination
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts                     # API client
│   │   ├── auth.ts                    # Auth context
│   │   └── utils.ts                   # Utility functions
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── docker/
│   └── docker-compose.dev.yml
│
├── scripts/
│   ├── setup-dev.ps1                  # Windows dev setup
│   └── setup-dev.sh                   # Linux/Mac dev setup
│
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema

### Core Models

#### User
```prisma
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  password          String    // bcrypt hashed
  fullName          String
  phone             String?
  role              String    @default("user")  // user, admin, super_admin, support_agent
  status            String    @default("active") // active, suspended, deleted
  emailVerified     Boolean   @default(false)
  instanceUrl       String?   // n8n instance URL
  containerId       String?   // Docker container ID
  // ... timestamps and relations
}
```

#### Subscription
```prisma
model Subscription {
  id                    String   @id @default(uuid())
  userId                String
  planType              String   // monthly, yearly
  status                String   // active, paused, cancelled, expired, payment_failed, suspended
  amount                Float
  currency              String   @default("EGP")
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  nextBillingDate       DateTime?
  pausedAt              DateTime?
  cancelledAt           DateTime?
  creditBalance         Float    @default(0)  // For proration
  // ... relations
}
```

#### Payment
```prisma
model Payment {
  id                    String    @id @default(uuid())
  subscriptionId        String
  userId                String
  gatewayTransactionId  String?
  paymentGateway        String    // paymob
  amount                Float
  currency              String    @default("EGP")
  status                String    // success, failed, pending, refunded
  // ... relations
}
```

#### Coupon
```prisma
model Coupon {
  id                String    @id @default(uuid())
  code              String    @unique
  discountType      String    // percentage, fixed
  discountValue     Float
  maxUses           Int?      // null = unlimited
  usedCount         Int       @default(0)
  validFrom         DateTime
  validUntil        DateTime?
  isActive          Boolean   @default(true)
  applicablePlans   String?   // JSON: ["monthly", "yearly"]
  minOrderAmount    Float?
}
```

#### PricingConfig
```prisma
model PricingConfig {
  id              String   @id @default(uuid())
  planType        String   @unique  // monthly, yearly
  price           Float
  currency        String   @default("EGP")
  displayName     String
  description     String?
  features        String   @default("[]")  // JSON array
  isActive        Boolean  @default(true)
}
```

#### SupportTicket & SupportMessage
- Full ticketing system with message threading
- Category: billing, technical, refund, other
- Priority: low, normal, high, urgent
- Status workflow with SLA tracking

#### Other Models
- `RefundRequest` - Refund workflow
- `ActivityLog` - Audit trail
- `EmailQueue` - Reliable email delivery
- `WebhookLog` - Payment webhook debugging
- `SystemSetting` - Admin configuration
- `CouponUsage` - Track coupon redemptions

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | Logout (invalidate token) |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/verify-email/:token` | Verify email address |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get current user profile |
| PUT | `/api/user/profile` | Update profile |
| PUT | `/api/user/password` | Change password |
| PUT | `/api/user/email-preferences` | Update email settings |

### Subscription
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription` | Get user's subscription |
| POST | `/api/subscription/create` | Create new subscription |
| POST | `/api/subscription/pause` | Pause subscription |
| POST | `/api/subscription/resume` | Resume subscription |
| POST | `/api/subscription/cancel` | Cancel subscription |
| POST | `/api/subscription/upgrade` | Upgrade to annual |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | List user's payments |
| GET | `/api/payments/:id` | Get payment details |
| GET | `/api/payments/:id/invoice` | Download invoice |
| POST | `/api/payments/checkout` | Initiate payment |

### Coupons
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coupons/validate` | Validate a coupon code |
| POST | `/api/coupons/apply` | Apply coupon to order |

### Support
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/support/tickets` | List user's tickets |
| POST | `/api/support/tickets` | Create new ticket |
| GET | `/api/support/tickets/:id` | Get ticket details |
| POST | `/api/support/tickets/:id/messages` | Add message |
| PUT | `/api/support/tickets/:id/close` | Close ticket |

### Pricing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pricing` | Get all pricing plans |
| GET | `/api/pricing/:planType` | Get specific plan |

### Webhooks (Paymob)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/paymob` | Payment success/failure |
| POST | `/api/webhooks/paymob/refund` | Refund completed |

### Admin Routes (require admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard metrics |
| GET | `/api/admin/users` | List all users (paginated) |
| GET | `/api/admin/users/:id` | Get user details |
| PUT | `/api/admin/users/:id` | Update user |
| PUT | `/api/admin/users/:id/suspend` | Suspend user |
| GET | `/api/admin/subscriptions` | List all subscriptions |
| GET | `/api/admin/payments` | List all payments |
| GET | `/api/admin/coupons` | List all coupons |
| POST | `/api/admin/coupons` | Create coupon |
| PUT | `/api/admin/coupons/:id` | Update coupon |
| DELETE | `/api/admin/coupons/:id` | Delete coupon |
| GET | `/api/admin/pricing` | Get pricing config |
| PUT | `/api/admin/pricing/:planType` | Update pricing |
| GET | `/api/admin/tickets` | List all tickets |
| PUT | `/api/admin/tickets/:id/assign` | Assign ticket |
| GET | `/api/admin/activity` | Activity logs |
| GET | `/api/admin/refunds` | Refund requests |
| PUT | `/api/admin/refunds/:id` | Process refund |

---

## 💼 Business Logic

### Pricing Plans

| Plan | Price | Billing | Savings |
|------|-------|---------|---------|
| Monthly | 400 EGP | Recurring | - |
| Annual | 3,800 EGP | Upfront | ~20% |

### Subscription Lifecycle

```
New User → Signup → Select Plan → Payment
    ↓
Subscription Active → n8n Instance Created
    ↓
[Payment Due] → Payment Success → Renewal
    ↓           ↓
    ↓       Payment Failed → Grace Period (7 days)
    ↓           ↓
    ↓       Retry Days 3, 5, 7
    ↓           ↓
    ↓       Still Failed → Suspended
    ↓
[User Action] → Pause (max 30 days) → Resume
    ↓
[User Action] → Cancel → Access until period end → Expired
```

### Refund Policy
- **7-day money-back guarantee** on first payment
- Full refund only (no partial refunds)
- One refund per customer lifetime
- Refund processed back to original payment method

### Grace Period
- 7 days for failed payments
- Automatic retry on days 3, 5, 7
- Email notifications at each retry
- Suspension after 7 days if still failed

---

## 🔧 Admin Panel Features

### Dashboard (`/admin`)
- Active subscriptions count
- Monthly revenue (MRR)
- New signups (today/week/month)
- Active users
- Open support tickets
- Recent activity feed
- Revenue chart

### User Management (`/admin/users`)
- List all users with pagination
- Search by email/name
- Filter by status/role
- View user details
- Edit user information
- Suspend/reactivate users

### Subscription Management (`/admin/subscriptions`)
- List all subscriptions with pagination
- Filter by status/plan type
- View subscription details
- Manual status changes

### Payment History (`/admin/payments`)
- List all payments with pagination
- Filter by status/gateway
- View payment details
- Download invoices

### Coupon Management (`/admin/coupons`)
- Create new coupons
- Edit existing coupons
- Set discount type (percentage/fixed)
- Set validity period
- Set usage limits
- Enable/disable coupons
- View usage statistics

### Pricing Configuration (`/admin/pricing`)
- Edit plan prices
- Update plan features (JSON array)
- Toggle plan availability

### Support Tickets (`/admin/tickets`)
- List all tickets with pagination
- Filter by status/priority/category
- Assign to admin
- Reply to tickets
- Close/resolve tickets

### Activity Logs (`/admin/activity`)
- Audit trail of all actions
- Filter by user/action type
- IP address tracking

---

## 🚀 Next Phase: n8n Instance Provisioning

### Architecture Decision: Cluster Model (Cost-Optimized)

After analysis, we decided on a **Docker Swarm cluster** architecture using **Hetzner Cloud ARM64 servers** for maximum cost efficiency.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            INTERNET                                         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER NODE (CAX11 - €3.79/mo)                   │
│                         Traefik + SSL Termination                           │
│                    Routes: customer1.n8n.yoursite.com                       │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────────┐
         │                         │                             │
         ▼                         ▼                             ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────────────┐
│  WORKER NODE #1  │   │  WORKER NODE #2  │   │      SERVICES NODE           │
│   CAX31 ARM64    │   │   CAX31 ARM64    │   │       CAX21 ARM64            │
│ 8 vCPU, 16GB RAM │   │ 8 vCPU, 16GB RAM │   │     4 vCPU, 8GB RAM          │
│    €12.49/mo     │   │    €12.49/mo     │   │        €6.49/mo              │
│ [8 n8n instances]│   │ [8 n8n instances]│   │  PostgreSQL + Redis          │
└──────────────────┘   └──────────────────┘   └──────────────────────────────┘
```

### n8n Resource Requirements (per instance)
- **RAM**: 2GB minimum per instance
- **CPU**: 1 core minimum
- **Storage**: Each instance gets its own PostgreSQL database

### Scaling Cost Table

| Customers | Worker Nodes | Monthly Cost | Cost/Customer |
|-----------|--------------|--------------|---------------|
| 1-8 | 1× CAX31 | €22.77 | €2.85 |
| 9-16 | 2× CAX31 | €35.26 | €2.20 |
| 17-24 | 3× CAX31 | €53.75 | €2.24 |
| 25-40 | 5× CAX31 | €81.43 | €2.04 |

### Provisioning Workflow

```
Customer Subscribes → Payment Confirmed
         │
         ▼
┌─────────────────────────────────────┐
│      PROVISIONING SERVICE           │
│                                     │
│  1. Check cluster capacity          │
│  2. If full: Add worker via Hetzner │
│  3. Create PostgreSQL database      │
│  4. Deploy n8n container to swarm   │
│  5. Configure DNS (Cloudflare)      │
│  6. Wait for health check           │
│  7. Email customer with credentials │
└─────────────────────────────────────┘
```

### Required New Database Models

```prisma
model N8nInstance {
  id               String   @id @default(uuid())
  userId           String   @unique
  subdomain        String   @unique  // customer.n8n.yoursite.com
  status           InstanceStatus @default(PENDING)
  allocatedRam     Int      @default(2048)  // MB
  allocatedCpu     Int      @default(1)
  workerId         String?
  createdAt        DateTime @default(now())
  suspendedAt      DateTime?
  deletedAt        DateTime?
}

model ClusterNode {
  id           String   @id @default(uuid())
  ip           String
  type         String   // manager, worker, services
  hetznerId    String
  capacity     Int      @default(8)  // max n8n instances
  currentLoad  Int      @default(0)
  status       String   @default("active")
}

enum InstanceStatus {
  PENDING
  PROVISIONING
  ACTIVE
  SUSPENDED
  DELETING
  DELETED
  ERROR
}
```

### Required New Services

```typescript
// New services to implement:
├── services/
│   ├── cluster.service.ts       // Manage cluster nodes
│   ├── hetzner.service.ts       // Hetzner Cloud API
│   ├── provisioning.service.ts  // n8n instance lifecycle
│   └── dns.service.ts           // Cloudflare DNS management
```

### Integration Points

When subscription events occur:

| Event | Action |
|-------|--------|
| `subscription.created` + `payment.success` | Provision n8n instance |
| `payment.failed` (after grace period) | Suspend instance (scale to 0) |
| `payment.success` (after failed) | Resume instance (scale to 1) |
| `subscription.cancelled` | Suspend immediately, schedule deletion in 30 days |

---

## 🔧 Setup Instructions

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or SQLite for dev)
- npm or yarn
- Git

### Backend Setup

```bash
# Clone repository
git clone <repository-url>
cd n8n-intag-store/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, JWT_SECRET

# Run database migrations
npx prisma migrate dev

# Seed initial data (optional)
npx prisma db seed

# Start development server
npm run dev
# Server runs on http://localhost:3001
```

### Frontend Setup

```bash
cd n8n-intag-store/frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local
# Required: NEXT_PUBLIC_API_URL=http://localhost:3001

# Start development server
npm run dev
# App runs on http://localhost:3000
```

### Using Docker (Development)

```bash
cd n8n-intag-store

# Start all services
docker-compose -f docker/docker-compose.dev.yml up -d

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f
```

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/n8n_saas?schema=public"
# For SQLite (dev): DATABASE_URL="file:./dev.db"

# JWT Authentication
JWT_SECRET="your-secure-random-string-min-32-chars"
JWT_EXPIRES_IN="1d"

# Server
PORT=3001
NODE_ENV=development

# Payment Gateway (Paymob)
PAYMOB_API_KEY="your-paymob-api-key"
PAYMOB_INTEGRATION_ID="your-integration-id"
PAYMOB_HMAC_SECRET="your-hmac-secret"
PAYMOB_IFRAME_ID="your-iframe-id"

# Email (SendGrid)
SENDGRID_API_KEY="SG.xxxxxxx"
SENDGRID_FROM_EMAIL="noreply@yoursite.com"
SENDGRID_FROM_NAME="n8n SaaS"

# Frontend URL (for emails/redirects)
FRONTEND_URL="http://localhost:3000"

# Admin Credentials (for seeding)
ADMIN_EMAIL="admin@yoursite.com"
ADMIN_PASSWORD="secure-admin-password"

# Future: Hetzner Cloud
HETZNER_API_TOKEN=""

# Future: Cloudflare
CLOUDFLARE_API_TOKEN=""
CLOUDFLARE_ZONE_ID=""
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_NAME="n8n SaaS"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🔒 Security Features

- **HTTPS** enforced in production
- **Passwords** hashed with bcrypt (12 rounds)
- **JWT tokens** with 24-hour expiration
- **Input validation** on all endpoints (Zod)
- **SQL injection prevention** via Prisma ORM
- **XSS prevention** with input sanitization
- **CSRF protection** on state-changing endpoints
- **Rate limiting** on auth endpoints
- **Helmet.js** for secure HTTP headers
- **CORS** configured for allowed origins

---

## 📝 Development Notes

### Running Tests
```bash
cd backend
npm run test

cd frontend
npm run test
```

### Database Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Code Style
- ESLint + Prettier configured
- Run `npm run lint` to check
- Run `npm run format` to auto-fix

---

## 🤝 Contributing

This is a private project. Contact the owner for access.

## 📄 License

Private - All Rights Reserved

---

Built with ❤️ for Egyptian businesses

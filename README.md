# n8n SaaS Platform

A complete SaaS platform for hosting n8n automation instances with subscription-based billing.

## 🚀 Features

- **Subscription Management**: Monthly (400 EGP) and Annual (3,800 EGP) plans
- **User Dashboard**: Manage subscriptions, billing, and n8n instances
- **Admin Panel**: Complete platform oversight and management
- **Payment Integration**: Paymob gateway for Egyptian payments
- **Support System**: Ticket-based customer support
- **Email Communications**: Automated transactional emails

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Shadcn/ui

### Infrastructure
- **Containerization**: Docker
- **Reverse Proxy**: Nginx
- **Email**: SendGrid
- **Payment**: Paymob

## 📁 Project Structure

```
n8n-intag-store/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Type definitions
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── server.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app/                 # Next.js app directory
│   │   ├── (auth)/          # Auth pages (login, signup)
│   │   ├── (dashboard)/     # User dashboard
│   │   ├── (admin)/         # Admin panel
│   │   └── (public)/        # Public pages
│   ├── components/          # React components
│   │   ├── ui/              # Shadcn components
│   │   └── ...
│   ├── lib/                 # Utilities
│   └── package.json
├── docker/                  # Docker configurations
├── scripts/                 # Setup and deployment
└── README.md
```

## 🚦 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# Then run migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/n8n_saas?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1d"

# Server
PORT=3001
NODE_ENV=development

# Payment Gateway (Paymob)
PAYMOB_API_KEY=""
PAYMOB_INTEGRATION_ID=""
PAYMOB_HMAC_SECRET=""

# Email (SendGrid)
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL=""

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_NAME="n8n SaaS"
```

## 📊 Database Schema

The platform uses the following main tables:

- **Users**: Account information
- **Subscriptions**: Subscription lifecycle
- **Payments**: Transaction records
- **RefundRequests**: Refund workflow
- **SupportTickets**: Customer support
- **SupportMessages**: Ticket conversations
- **ActivityLogs**: Audit trail

## 🔒 Security

- HTTPS enforced in production
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 24h expiration
- Input validation on all endpoints
- SQL injection prevention via Prisma ORM
- XSS prevention with input sanitization
- CSRF protection
- Rate limiting on sensitive endpoints
- Secure headers with Helmet.js

## 📈 Business Logic

### Pricing

| Plan | Price | Billing |
|------|-------|---------|
| Monthly | 400 EGP | Recurring |
| Annual | 3,800 EGP | Upfront |

### Refund Policy

- 7-day money-back guarantee
- Full refund only (no partial)
- One refund per customer

### Grace Period

- 7 days for failed payments
- Retries on days 3, 5, 7
- Suspension after 7 days

## 📝 API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Register new user |
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/refresh` | POST | Refresh token |

### User

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/profile` | GET | Get profile |
| `/api/user/profile` | PUT | Update profile |
| `/api/user/password` | PUT | Change password |

### Subscription

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subscription` | GET | Get subscription |
| `/api/subscription/pause` | POST | Pause subscription |
| `/api/subscription/resume` | POST | Resume subscription |
| `/api/subscription/cancel` | POST | Cancel subscription |

## 🤝 Contributing

This is a private project. Contact the owner for access.

## 📄 License

Private - All Rights Reserved

---

Built with ❤️ for Egyptian businesses

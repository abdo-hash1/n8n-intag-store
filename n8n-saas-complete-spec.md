# n8n SaaS Platform - Complete System Specification

## Table of Contents
1. [Project Overview](#project-overview)
2. [Pricing Structure](#pricing-structure)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Landing & Sales Pages](#landing--sales-pages)
6. [Checkout Flow](#checkout-flow)
7. [User Onboarding](#user-onboarding)
8. [User Dashboard](#user-dashboard)
9. [Admin Panel](#admin-panel)
10. [Payment Gateway Integration](#payment-gateway-integration)
11. [Webhook Implementation](#webhook-implementation)
12. [Subscription Management](#subscription-management)
13. [Pause & Resume Logic](#pause--resume-logic)
14. [Refund System](#refund-system)
15. [Email Communication](#email-communication)
16. [Support System](#support-system)
17. [Technical Requirements](#technical-requirements)

---

## Project Overview

**Goal:** Build a SaaS platform to host n8n instances for external users with a subscription-based payment model.

**Business Model:**
- Monthly subscription: 400 EGP
- Annual subscription: 3,800 EGP
- Each user gets their own isolated n8n instance

**Core Requirements:**
- Payment gateway integration (Paymob/Fawry/Stripe)
- Recurring billing management
- User dashboard for subscription control
- Admin panel for oversight
- n8n instance provisioning and management

---

## Pricing Structure

### Monthly Plan
- **Price:** 400 EGP/month
- **Billing:** Recurring monthly
- **Features:** Full n8n access, regular backups, email support

### Annual Plan
- **Price:** 3,800 EGP/year (equivalent to 316.67 EGP/month)
- **Savings:** ~20% discount vs monthly
- **Billing:** Upfront annual payment
- **Features:** Same as monthly + priority support

### Free Trial (Optional)
- **Duration:** 7 days
- **Access:** Limited workflows or executions
- **Purpose:** Let users test before committing

---

## System Architecture

### Three Main Components

1. **Payment Gateway Integration**
   - Handles recurring billing
   - Processes initial and renewal payments
   - Sends webhooks for payment events

2. **Backend Subscription Management**
   - Your control logic
   - Manages subscription lifecycle
   - Handles n8n instance provisioning

3. **User-Facing Dashboard**
   - Customer interface
   - Subscription management
   - n8n instance access

### Technology Stack Recommendations

**Frontend:**
- Next.js / React for dashboard
- TailwindCSS for styling
- Responsive design

**Backend:**
- Node.js / Python
- PostgreSQL or MySQL for database
- Docker for n8n instance isolation

**Infrastructure:**
- Linux VPS (Hetzner, DigitalOcean, etc.)
- Nginx reverse proxy
- Docker Compose for orchestration
- Coolify for deployment (optional)

---

## Database Schema

### Required Data Models

The system needs the following data entities. The coding agent should implement these in the database:

#### Users
**Purpose:** Store all user account information

**Required Fields:**
- Unique user identifier
- Email (unique, for login)
- Password (hashed and secured)
- Full name
- Phone number
- Associated n8n instance URL
- Associated n8n Docker container ID
- Account creation timestamp
- Last update timestamp
- Last login timestamp
- Account status (active, suspended, deleted)

**Business Rules:**
- Email must be unique across all users
- Password must be hashed using industry-standard algorithms (bcrypt, argon2)
- Status defaults to 'active' upon creation
- When user is suspended, their n8n instance should be stopped
- When user is deleted, their data should be soft-deleted (not permanently removed immediately)

---

#### Subscriptions
**Purpose:** Manage subscription lifecycle for each user

**Required Fields:**
- Unique subscription identifier
- Associated user ID (links to Users table)
- Plan type (monthly or yearly)
- Current status (active, paused, cancelled, expired, payment_failed, suspended)
- Payment gateway subscription ID (from Paymob/Fawry/Stripe)
- Payment gateway customer ID
- Which payment gateway is being used
- Current billing period start date
- Current billing period end date
- Next scheduled billing date
- Subscription amount
- Currency (default EGP)
- Pause timestamp (when was it paused, if applicable)
- Pause reason
- Scheduled resume date (if paused)
- Cancellation timestamp
- Cancellation reason
- Creation and update timestamps

**Business Rules:**
- Each user can only have ONE active subscription at a time
- When subscription is paused, the next_billing_date should be adjusted forward
- When subscription is cancelled, set status to 'cancelled' but keep the record
- Payment failures should trigger a grace period (7 days) before suspension
- Annual subscriptions cannot be paused (business decision - can be changed)

---

#### Payments
**Purpose:** Track all payment transactions

**Required Fields:**
- Unique payment identifier
- Associated subscription ID
- Payment gateway transaction ID (from the gateway)
- Which payment gateway processed this
- Payment amount
- Currency
- Payment status (success, failed, pending, refunded)
- Failure reason (if failed)
- Payment date/timestamp
- Refund date (if refunded)
- Refund amount (if partial refund)
- Creation timestamp

**Business Rules:**
- Every subscription charge attempt should create a payment record
- Failed payments should store the failure reason for troubleshooting
- Successful payments should update the subscription's current_period_end
- Refunds should create a new payment record with negative amount OR update the original record

---

#### Refund Requests
**Purpose:** Manage refund workflow

**Required Fields:**
- Unique refund request identifier
- User ID (who requested)
- Subscription ID
- Associated payment ID
- Refund reason (required from user)
- Requested refund amount
- Request status (pending, approved, rejected, processed)
- Admin notes (internal comments)
- Who processed it (admin user ID)
- When it was processed
- Creation timestamp

**Business Rules:**
- Users can request refunds within 7 days of payment
- Each refund request goes through approval workflow
- Admin must review and approve/reject
- Once approved, system should trigger gateway refund API
- After gateway confirms refund, status becomes 'processed'

---

#### Support Tickets
**Purpose:** Customer support system

**Required Fields:**
- Unique ticket identifier
- User ID (who created the ticket)
- Subject/title
- Description
- Category (billing, technical, refund, other)
- Priority (low, normal, high, urgent)
- Status (open, waiting_customer, waiting_admin, resolved, closed)
- Assigned admin user ID
- Creation timestamp
- Last update timestamp
- Resolution timestamp
- Close timestamp

**Business Rules:**
- New tickets default to 'open' status and 'normal' priority
- When user replies, status changes to 'waiting_admin'
- When admin replies, status changes to 'waiting_customer'
- Payment-related tickets should auto-escalate to 'high' priority
- Tickets can only be closed after being resolved for 48+ hours

---

#### Support Messages
**Purpose:** Store ticket conversation history

**Required Fields:**
- Unique message identifier
- Associated ticket ID
- User ID (who sent the message)
- Message content
- Is this message from admin (boolean)
- Creation timestamp

**Business Rules:**
- Messages are appended chronologically
- Both users and admins can send messages
- Email notifications should be sent when new messages are added
- Messages cannot be deleted, only the entire ticket can be archived

---

#### Activity Log
**Purpose:** Audit trail for all important actions

**Required Fields:**
- Unique log identifier
- User ID (who performed the action)
- Associated subscription ID (if applicable)
- Action type (signup, payment_success, payment_failed, pause, resume, cancel, refund_request, login, etc.)
- Additional details (JSON format for flexibility)
- IP address
- Creation timestamp

**Business Rules:**
- Log EVERY significant action in the system
- Logs are immutable (never delete or modify)
- Store IP address for security tracking
- Use JSON field for action-specific details
- Important actions to log: login, payment attempts, subscription changes, refund requests, admin actions

**Example actions to track:**
- user_signup
- user_login  
- payment_success
- payment_failed
- subscription_paused
- subscription_resumed
- subscription_cancelled
- refund_requested
- refund_approved
- refund_rejected
- ticket_created
- ticket_resolved
- admin_login
- instance_started
- instance_stopped

---

### Database Relationships

**Important relationships the coding agent must implement:**

1. **One User → One Active Subscription** (at a time)
   - Users can have multiple subscriptions over time, but only ONE active
   - When creating new subscription, check if active subscription exists

2. **One Subscription → Many Payments**
   - Track all payment attempts for each subscription
   - Link successful and failed payments to subscription

3. **One User → Many Refund Requests**
   - Users can request multiple refunds over their lifetime
   - Each refund request links to specific payment

4. **One User → Many Support Tickets**
   - Users can create unlimited support tickets
   - Each ticket can have many messages

5. **One Ticket → Many Messages**
   - Conversation thread for each ticket
   - Chronological order maintained

6. **All Actions → Activity Log**
   - Every table should trigger activity log entries
   - Use database triggers or application-level logging

---

## Landing & Sales Pages

The coding agent should build the following public-facing pages:

### Homepage / Landing Page

**Purpose:** First impression, explain value proposition, drive signups

**Required Sections:**
1. **Hero Section**
   - Headline: "أتمتة أعمالك بدون تعقيد - n8n بالعربية"
   - Subheadline: Brief explanation of what n8n is
   - CTA button: "ابدأ تجربتك المجانية" → goes to signup
   - Hero image/video showing n8n in action

2. **Features Section**
   - List key benefits (automation, no-code, integration with 400+ apps)
   - Icons and short descriptions
   - Visual examples of workflows

3. **Pricing Section**
   - Show both plans side by side
   - Monthly: 400 EGP/month
   - Annual: 3,800 EGP/year (save 20%)
   - Highlight savings on annual plan
   - CTA button for each plan → checkout

4. **How It Works**
   - Step 1: Sign up
   - Step 2: Choose your plan
   - Step 3: Get instant access to your n8n instance
   - Step 4: Build automations
   - Simple visual flow diagram

5. **Social Proof**
   - Testimonials (if available)
   - Number of active users
   - Trust badges

6. **FAQ Section**
   - Common questions about billing, cancellation, support
   - Expandable accordion format

7. **Footer**
   - Links to: Pricing, Support, Terms of Service, Privacy Policy
   - Contact information
   - Social media links

**Design Requirements:**
- Clean, modern design
- Mobile-responsive
- Fast loading
- Arabic language optimized
- Clear CTAs throughout

---

### Pricing Page

**Purpose:** Detailed pricing comparison, address concerns, drive conversions

**Required Elements:**
1. **Pricing Comparison Table**
   - Feature-by-feature comparison
   - Columns: Free Trial (if offered) | Monthly | Annual
   - Rows: All features, support level, backup frequency, etc.
   - Highlight recommended plan

2. **FAQ Specific to Pricing**
   - "Can I switch plans?"
   - "What happens if I cancel?"
   - "Do you offer refunds?"
   - "What payment methods do you accept?"
   - "Is my data safe?"

3. **Money-Back Guarantee**
   - 7-day refund policy
   - Clear explanation of how refunds work

4. **Trust Signals**
   - Secure payment badges
   - SSL certificate indicator
   - Accepted payment methods (Visa, Mastercard, etc.)

5. **CTAs**
   - Each plan has "اشترك الآن" button
   - Goes to checkout with plan pre-selected

---

### Features Page

**Purpose:** Deep dive into what n8n can do

**Required Sections:**
1. **Core Features**
   - Visual workflow builder
   - 400+ integrations
   - Custom code execution
   - Scheduling and triggers
   - Error handling and monitoring

2. **Use Cases**
   - Marketing automation
   - Data synchronization
   - API integration
   - Report generation
   - Customer onboarding workflows
   - Each use case with real example

3. **Integration Showcase**
   - Grid of popular app logos (Google Sheets, Slack, Telegram, etc.)
   - "وأكثر من 400 تطبيق آخر"

4. **Demo Video**
   - Embedded video showing n8n in action
   - Arabic narration preferred

---

## Checkout Flow

The coding agent must implement a smooth, conversion-optimized checkout process:

### Step 1: Plan Selection

**If user arrives from landing page:**
- Show plan options again
- Pre-select if they clicked a specific plan
- User can change selection

**Elements:**
- Monthly plan card (400 EGP/month)
- Annual plan card (3,800 EGP/year) - show "وفر 800 جنيه"
- Selected plan is highlighted
- Continue button → Step 2

---

### Step 2: Account Creation

**If user is not logged in, collect:**
- Full name
- Email address (will be username)
- Phone number (with Egypt +20 pre-selected)
- Password
- Password confirmation

**Validation:**
- Email must be unique
- Strong password requirements
- Phone number format validation

**Also show:**
- Checkbox: "أوافق على الشروط والأحكام" (required, links to Terms)
- Optional: Newsletter signup checkbox

**Security:**
- HTTPS required
- CSRF protection
- ReCAPTCHA or similar anti-bot

**Button:** "المتابعة للدفع" → Step 3

---

### Step 3: Payment

**Display:**
- Order summary box (sticky sidebar)
  - Plan name
  - Billing frequency
  - Price breakdown
  - Total amount
  - Next billing date

**Payment form:**
- Integrate chosen payment gateway (Paymob/Fawry/Stripe)
- Embedded payment form (iFrame or redirect)
- Support credit/debit cards
- Support local payment methods (Fawry kiosks, wallets if available)

**During payment processing:**
- Loading spinner
- "جاري معالجة الدفع..."
- Disable all buttons

---

### Step 4: Success/Failure

**On Successful Payment:**
- Redirect to success page
- Show confirmation message
- Display:
  - Order number/subscription ID
  - Receipt (downloadable PDF)
  - n8n instance URL
  - Login credentials (temporary password if auto-generated)
  - "ابدأ الاستخدام الآن" button → n8n instance

**Send email:**
- Welcome email with all details
- Receipt attached
- Getting started guide

**On Payment Failure:**
- Redirect to failure page
- Show error message (generic, not technical)
- "حدث خطأ في عملية الدفع"
- Reason (if available from gateway)
- "حاول مرة أخرى" button → back to payment step
- "تحتاج مساعدة؟" link → support

---

## User Onboarding

After successful signup and payment, guide users to success:

### Welcome Email Sequence

**Email 1: Immediate (payment confirmation)**
- Subject: "مرحباً بك في [Platform Name]"
- Thank you for subscribing
- Order details and receipt
- n8n instance URL and credentials
- CTA: "ادخل إلى لوحة التحكم"

**Email 2: Day 1**
- Subject: "ابدأ أول أتمتة لك في 5 دقائق"
- Quick start guide
- Link to tutorial video
- Example simple workflow
- CTA: "شاهد الفيديو"

**Email 3: Day 3**
- Subject: "3 أفكار لأتمتة أعمالك اليوم"
- 3 use case examples relevant to their potential needs
- Link to workflow templates
- CTA: "استكشف القوالب"

**Email 4: Day 7**
- Subject: "كيف حالك مع [Platform Name]؟"
- Check-in email
- "هل تحتاج مساعدة؟"
- Link to support
- Link to community/resources
- Optional: Request feedback/testimonial

---

### First Login Experience

**When user first logs into dashboard:**
1. **Welcome Modal/Tour**
   - "مرحباً [User Name]!"
   - Brief 3-step tutorial overlay
   - Skip button available

2. **Quick Actions**
   - Access my n8n instance
   - View subscription details
   - Watch getting started video
   - Contact support

3. **Dashboard shows:**
   - Subscription status card
   - n8n instance status (Running)
   - Quick links
   - Latest activity

---

## User Dashboard

The main interface where users manage everything. The coding agent should build:

### Dashboard Home (Overview)

**Top Section:**
- Welcome message: "مرحباً، [User Name]"
- Current plan badge (Monthly/Annual)
- Subscription status indicator (Active/Paused/etc.)

**Main Cards:**

1. **Subscription Overview Card**
   - Plan type
   - Status
   - Next billing date
   - Amount
   - "إدارة الاشتراك" button

2. **n8n Instance Card**
   - Instance URL (clickable)
   - Status indicator (🟢 Running / 🔴 Stopped)
   - "فتح n8n" button (opens in new tab)
   - "إعادة التشغيل" button
   - Uptime counter

3. **Usage Card** (optional, future feature)
   - Number of workflows
   - Executions this month
   - Storage used

4. **Recent Activity**
   - Last 5 actions from activity log
   - Timestamps
   - "عرض الكل" link

---

### Subscription Management Page

**Current Subscription Section:**
- Plan name (Monthly/Annual)
- Status
- Started on: [date]
- Current period: [start] to [end]
- Next billing: [date] - [amount]
- Payment method on file

**Available Actions:**

1. **Upgrade/Downgrade**
   - Button: "تغيير الخطة"
   - Modal showing current vs other plan
   - Prorated calculation explained
   - Confirm button

2. **Pause Subscription** (Monthly only)
   - Button: "إيقاف مؤقت"
   - Opens modal with explanation
   - Select pause duration (1-3 months)
   - Warning: "سيتم إيقاف خدمة n8n خلال فترة الإيقاف"
   - Confirm button

3. **Resume Subscription** (if paused)
   - Shows: "الاشتراك متوقف مؤقتاً"
   - Resume date displayed
   - Button: "استئناف الآن"
   - Confirmation modal

4. **Cancel Subscription**
   - Button: "إلغاء الاشتراك" (in subtle color, not prominent)
   - Opens modal with retention attempt:
     - "نأسف لرؤيتك تغادر..."
     - Reason selection dropdown (required)
     - Optional feedback text
     - Explain what happens: access until period end
     - Data retention policy
   - "تأكيد الإلغاء" button

5. **Request Refund** (if within 7 days)
   - Button: "طلب استرداد"
   - Opens modal/form
   - Reason selection (required)
   - Additional details (optional)
   - Refund amount calculated automatically
   - Submit button

---

### Billing History Page

**List of all payments:**
- Table format
- Columns: Date | Description | Amount | Status | Invoice
- Sortable and filterable
- Status badges (Success 🟢 | Failed 🔴 | Refunded 🟡)
- Each row has "تحميل الفاتورة" button (PDF)

**Summary stats:**
- Total paid this year
- Upcoming payment (date + amount)
- Payment method on file

---

### Payment Method Page

**Current payment method:**
- Card type and last 4 digits (if applicable)
- Expiry date
- "هذه هي وسيلة الدفع النشطة" indicator

**Update payment method:**
- Button: "تحديث وسيلة الدفع"
- Redirects to gateway's update flow
- On return, confirm update
- Send email notification

**Important note:**
- "التغييرات ستطبق على الدفعات المستقبلية"

---

### Account Settings Page

**Profile Information:**
- Full name (editable)
- Email (display only, with note: "للتغيير تواصل مع الدعم")
- Phone (editable)
- Save button

**Password Change:**
- Current password (required)
- New password
- Confirm new password
- "تغيير كلمة المرور" button
- On success: send confirmation email

**Preferences:**
- Email notifications toggles:
  - Payment confirmations
  - Subscription reminders
  - Product updates and news
  - Support ticket updates
- Language (Arabic/English if supported)
- Save button

**Danger Zone:**
- "حذف الحساب" button (red, prominent warning)
- Opens modal with serious warnings
- Requires password confirmation
- Checkbox: "أفهم أن هذا الإجراء لا يمكن التراجع عنه"
- "حذف حسابي نهائياً" button

---

### Support Page

**Create New Ticket:**
- Button: "فتح تذكرة جديدة"
- Form:
  - Subject (required)
  - Category dropdown (Billing / Technical / Refund / Other)
  - Description (required, textarea)
  - Attach file (optional, for screenshots)
  - Priority (Normal selected by default)
  - Submit button

**My Tickets:**
- List of all tickets
- Table: Ticket # | Subject | Category | Status | Last Updated
- Status badges (Open 🟡 | Waiting 🔵 | Resolved 🟢 | Closed ⚪)
- Click ticket to view conversation

**Ticket Detail View:**
- Ticket subject and metadata
- Conversation thread (chronological)
- Reply box at bottom
- "إرسال" button
- "إغلاق التذكرة" button (if resolved)

**Help Center Link:**
- "مركز المساعدة" button
- Links to FAQ/knowledge base (if available)

---

### n8n Instance Management Page

**Instance Information:**
- Instance URL (copyable)
- Container ID (for reference)
- Status: Running / Stopped
- Uptime
- Created on: [date]

**Actions:**
1. **Open n8n**
   - Big prominent button
   - Opens instance in new tab
   - Auto-login if possible (SSO)

2. **Restart Instance**
   - Button: "إعادة التشغيل"
   - Confirmation modal
   - Use case: if n8n becomes unresponsive
   - Shows progress indicator during restart

3. **View Logs** (advanced feature)
   - Button: "عرض السجلات"
   - Shows last 100 lines of container logs
   - Helpful for debugging
   - Refresh button

4. **Request Backup** (future feature)
   - Button: "طلب نسخة احتياطية"
   - Downloads workflows as JSON
   - Async process

**Warning Messages:**
- If subscription is paused: "الخدمة متوقفة مؤقتاً - لن تتمكن من الوصول لـ n8n"
- If payment failed: "فشلت آخر محاولة دفع - يرجى تحديث وسيلة الدفع"

---

## Admin Panel

Comprehensive backend for platform management. Coding agent should implement:

### Admin Dashboard Home

**Key Metrics (Top Cards):**
1. **Monthly Recurring Revenue (MRR)**
   - Total MRR in EGP
   - Growth % vs last month
   - Trend graph (last 12 months)

2. **Active Subscriptions**
   - Total count
   - Breakdown: Monthly vs Annual
   - New this month

3. **Churn Rate**
   - Cancellations this month
   - Churn %
   - Comparison to last month

4. **Revenue This Month**
   - Total collected
   - vs. projected
   - Payment success rate %

**Activity Feed:**
- Real-time feed of important events
- New signups
- Payment successes/failures
- Cancellations
- Refund requests
- Support tickets
- Last 20 events, with "Load more"

**Quick Links:**
- View all users
- View all subscriptions
- Pending refund requests
- Open support tickets
- System health check

---

### User Management Page

**User List:**
- Searchable and filterable table
- Columns: Name | Email | Plan | Status | Joined | Actions
- Filters:
  - Status (Active / Paused / Cancelled / Suspended)
  - Plan type (All / Monthly / Annual)
  - Date range
- Sort by: Joined date, Name, Email
- Pagination

**User Actions (per row):**
- View details (opens user detail page)
- Edit
- Suspend/Unsuspend
- Delete (soft delete with confirmation)

**Bulk Actions:**
- Select multiple users
- Send email
- Export to CSV

---

### User Detail Page (Admin View)

**User Information:**
- Full profile (name, email, phone)
- Account status
- Joined date
- Last login
- n8n instance details

**Subscription Details:**
- Current plan
- Status
- Billing history (all payments)
- Upcoming payment

**Quick Admin Actions:**
- Extend trial (if applicable)
- Apply manual discount
- Grant free month
- Suspend account
- Delete account
- Reset password
- Send email to user

**Activity Timeline:**
- All actions by this user
- Chronological feed from activity log

**Support Tickets:**
- All tickets created by this user
- Quick view of open tickets

---

### Subscription Management Page (Admin)

**All Subscriptions List:**
- Table with filters
- Columns: User | Plan | Status | Next Billing | Amount | Actions
- Filters:
  - Status (All / Active / Paused / Cancelled / Payment Failed)
  - Plan type
  - Billing date range
- Export to CSV

**Actions per subscription:**
- View details
- Modify billing date
- Apply discount
- Cancel manually
- Refund

**Bulk Actions:**
- Send reminder emails
- Export selected

---

### Refund Management Page

**Pending Refund Requests:**
- Table showing all pending requests
- Columns: User | Request Date | Amount | Reason | Actions
- Sortable

**Refund Details (modal or detail page):**
- User information
- Subscription details
- Payment that's being refunded
- Reason provided by user
- Additional notes from user

**Admin Actions:**
1. **Approve Refund**
   - Confirm button
   - Add admin notes (optional)
   - Triggers refund in payment gateway
   - Updates subscription status
   - Sends email to user

2. **Reject Refund**
   - Reason required
   - Send email to user explaining rejection
   - Option to offer alternative (discount, extension)

**Processed Refunds:**
- Separate tab for approved/rejected requests
- Filter by status
- Date range filter
- Export to CSV

---

### Revenue Analytics Page

**Revenue Charts:**
1. **MRR Over Time**
   - Line graph
   - Last 12 months
   - Breakdown by plan type

2. **Revenue by Plan**
   - Pie chart: Monthly vs Annual revenue
   - Percentage breakdown

3. **Payment Success Rate**
   - Bar chart by month
   - Success vs failure %

**Financial Stats:**
- Total lifetime revenue
- Average revenue per user (ARPU)
- Customer lifetime value (CLV)
- Refund rate

**Downloadable Reports:**
- Monthly revenue report (PDF)
- Transaction log (CSV)
- Subscription report (Excel)

---

### Support Ticket Management (Admin)

**Ticket Queue:**
- List of all tickets
- Tabs: All | Open | Waiting for Admin | Resolved | Closed
- Columns: Ticket # | User | Subject | Category | Priority | Status | Last Update
- Sortable and filterable

**Ticket Assignment:**
- Assign to admin users
- Unassigned tickets highlighted
- Load balancing (auto-assign to least busy admin)

**Ticket Detail (Admin View):**
- Full conversation thread
- User information sidebar
- Admin reply box with rich text editor
- Quick actions:
  - Change status
  - Change priority
  - Assign to different admin
  - Mark as resolved
  - Close ticket

**Admin Notes:**
- Internal notes section (not visible to user)
- Collaboration between admin team

**Canned Responses:**
- Pre-written responses for common issues
- Insert with one click
- Customizable templates

---

### n8n Instance Monitoring Page

**All Instances List:**
- Table: User | Instance URL | Status | Uptime | Actions
- Filters:
  - Status (All / Running / Stopped / Error)
  - Search by user

**Instance Health:**
- CPU usage (if monitored)
- Memory usage
- Storage used
- Last activity

**Admin Actions per Instance:**
- View logs
- Restart
- Stop
- Start
- Access instance (admin login)
- Force backup
- Delete instance

**System-Wide Stats:**
- Total instances
- Average uptime
- Resource usage across all instances

---

### System Settings Page

**Payment Gateway Configuration:**
- Which gateway is active (Paymob / Fawry / Stripe)
- API keys (masked)
- Webhook URL
- Test mode toggle
- Save button

**Email Configuration:**
- SMTP settings
- From email address
- From name
- Test email button

**Pricing Settings:**
- Monthly plan price (editable)
- Annual plan price (editable)
- Currency
- Trial period duration (days)
- Refund policy (days)

**Feature Flags:**
- Enable/disable free trial
- Enable/disable pause feature
- Enable/disable refunds
- Maintenance mode toggle

**Legal Pages:**
- Upload/edit Terms of Service
- Upload/edit Privacy Policy
- Upload/edit Refund Policy

---

### Admin User Management

**Admin Users List:**
- Table of all admin accounts
- Columns: Name | Email | Role | Last Login
- Roles: Super Admin / Admin / Support Agent

**Role Permissions:**
- Super Admin: Full access
- Admin: All except system settings
- Support Agent: Only tickets and user view (no edit)

**Actions:**
- Add new admin
- Edit permissions
- Deactivate admin
- View activity log

---

## Payment Gateway Integration

Detailed instructions for the coding agent on integrating with payment gateways.

### Gateway Selection Strategy

**Recommended for Egypt:**
1. **Primary:** Paymob (best local option, supports cards + wallets)
2. **Backup:** Fawry (cash payments at kiosks)
3. **International:** Stripe (if you want to expand beyond Egypt)

**Implementation approach:**
- Build abstraction layer to support multiple gateways
- Switch between gateways without code changes
- Store gateway type in subscription record

---

### Integration Requirements

The coding agent must implement these functions for each gateway:

#### 1. Create Customer
**When:** During user signup
**Input:** User email, name, phone
**Output:** Gateway customer ID
**Action:** Store customer ID in user/subscription record

#### 2. Create Subscription
**When:** User completes checkout
**Input:**
- Customer ID
- Plan type (monthly/annual)
- Amount
- Currency
**Output:** Subscription ID, first payment status
**Actions:**
- Store subscription ID in subscription record
- If payment successful → activate subscription
- If payment failed → show error, retry

#### 3. Update Payment Method
**When:** User updates credit card
**Implementation:**
- Generate update URL from gateway
- Redirect user to gateway page
- User updates card on secure gateway page
- Gateway redirects back with success/failure
- Update subscription record if successful

#### 4. Cancel Subscription
**When:** User cancels or admin cancels manually
**Action:** Call gateway API to cancel recurring billing
**Important:** Don't immediately delete subscription in gateway - cancel at period end so user retains access

#### 5. Process Refund
**When:** Admin approves refund request
**Input:**
- Payment transaction ID
- Refund amount (full or partial)
**Output:** Refund transaction ID, status
**Actions:**
- Call gateway refund API
- Update payment record with refund details
- Send confirmation email

#### 6. Pause Subscription
**When:** User requests pause (monthly plans only)
**Implementation options:**
- **Option A:** Cancel in gateway, store resume date, create new subscription when resuming
- **Option B:** If gateway supports pause feature, use it
**Recommended:** Option A for simplicity

#### 7. Upgrade/Downgrade
**When:** User switches plans
**Process:**
1. Calculate proration
2. Cancel current subscription
3. Create new subscription
4. Charge/credit prorated amount
5. Update user's subscription record

---

### Webhook Implementation

**CRITICAL:** Webhooks are how the gateway notifies your system of events.

#### Webhook Endpoint Setup

**Create endpoint:** `POST /api/webhooks/[gateway-name]`
- Example: `/api/webhooks/paymob`
- Must be publicly accessible (HTTPS required)
- Register this URL in gateway dashboard

#### Security

**Webhook verification:**
- Each gateway sends signature/token in headers
- Verify signature using gateway's secret key
- Reject requests with invalid signature
- Log all webhook attempts

**IP whitelisting (if gateway supports):**
- Only accept webhooks from gateway's IP addresses

---

#### Webhook Events to Handle

The coding agent must implement handlers for these events:

**1. Payment Successful**
- Event name varies by gateway: `payment.succeeded`, `charge.succeeded`, etc.
- Actions:
  - Update payment record to 'success'
  - Update subscription status to 'active'
  - Set next_billing_date
  - Start/keep n8n instance running
  - Send payment confirmation email
  - Log activity

**2. Payment Failed**
- Event: `payment.failed`, `charge.failed`
- Actions:
  - Update payment record to 'failed'
  - Store failure reason
  - Update subscription status to 'payment_failed'
  - Send urgent email to user
  - Send WhatsApp notification (if integrated)
  - Start grace period countdown
  - Log activity

**3. Subscription Cancelled**
- Event: `subscription.cancelled`
- Could be cancelled by user or by gateway (multiple payment failures)
- Actions:
  - Update subscription status to 'cancelled'
  - Set cancelled_at timestamp
  - Send cancellation confirmation email
  - Don't stop n8n instance yet (user has until period end)
  - Schedule instance stop for period_end date
  - Log activity

**4. Subscription Renewed**
- Event: `subscription.renewed`, `invoice.paid`
- Happens automatically every billing cycle
- Actions:
  - Create new payment record
  - Update current_period_start and current_period_end
  - Set next_billing_date
  - Send renewal confirmation email
  - Log activity

**5. Payment Method Updated**
- Event: `customer.source.updated`
- User changed credit card
- Actions:
  - Log the update
  - Send confirmation email
  - Update payment method display in dashboard

**6. Refund Processed**
- Event: `charge.refunded`
- Initiated by your refund API call, confirmed by gateway
- Actions:
  - Update payment record with refund details
  - Update refund request status to 'processed'
  - Send refund confirmation email
  - Log activity

---

#### Webhook Processing Best Practices

**Idempotency:**
- Gateways may send same webhook multiple times
- Check if event already processed (by transaction ID)
- Don't duplicate actions

**Async processing:**
- Webhook endpoint should return 200 OK quickly
- Queue actual processing for background job
- Don't make gateway wait

**Error handling:**
- If processing fails, log error
- Return 500 error to gateway
- Gateway will retry webhook
- Have retry limit (don't process forever)

**Logging:**
- Log every webhook received (raw payload)
- Log processing outcome
- Store in database for debugging
- Retain for at least 90 days

---

### Payment Retry Logic

**When payment fails, implement automatic retries:**

**Retry Schedule (recommended):**
- First retry: 3 days after failure
- Second retry: 5 days after failure
- Third retry: 7 days after failure
- After 7 days: Suspend subscription

**Implementation:**
- Use scheduled jobs (cron)
- Check for subscriptions with status 'payment_failed'
- Call gateway API to retry payment
- Update based on result

**User communication during retries:**
- Day 0 (failure): "Payment failed - we'll retry in 3 days"
- Day 3: "Retry attempt 1 - please check your card"
- Day 5: "Retry attempt 2 - update payment method to avoid service interruption"
- Day 7: "Final retry - service will be suspended in 24 hours"
- Day 8: "Service suspended - renew to restore access"

---

### Testing Payment Integration

**Use gateway test/sandbox mode:**
- All gateways provide test environments
- Use test API keys during development
- Test cards don't charge real money

**Test scenarios to cover:**
1. Successful payment
2. Failed payment (declined card)
3. Failed payment (insufficient funds)
4. 3D Secure authentication flow
5. Refund (full)
6. Refund (partial)
7. Subscription renewal
8. Payment method update
9. Subscription cancellation
10. Webhook delivery failures

**Only switch to production mode after thorough testing**

---

## Subscription Management

Detailed business logic for subscription lifecycle management.

### Subscription States

**The coding agent must handle these states correctly:**

1. **Active**
   - User has paid and has access
   - n8n instance is running
   - Upcoming payment scheduled

2. **Payment Failed**
   - Last payment attempt failed
   - User still has access (grace period)
   - System attempting retries
   - Show warning in dashboard

3. **Suspended**
   - Grace period expired, payment still failed
   - OR admin suspended manually
   - n8n instance stopped
   - User cannot access, but data preserved
   - Can reactivate by paying

4. **Paused**
   - User requested temporary pause (monthly plans)
   - n8n instance stopped
   - No billing during pause
   - Resume date scheduled
   - Auto-resumes on resume date

5. **Cancelled**
   - User or admin cancelled subscription
   - Still has access until current_period_end
   - No future billing
   - n8n instance will stop after period ends

6. **Expired**
   - Subscription period ended and wasn't renewed
   - n8n instance stopped
   - User can resubscribe to access data

---

### Pause & Resume Logic

**Business Rules:**
- Only monthly plans can be paused
- Annual plans cannot pause (already discounted)
- Pause duration: 1-3 months max
- During pause: no billing, no access
- Data is preserved

#### Pause Flow

**User initiates pause:**
1. User clicks "Pause Subscription"
2. System checks: is this a monthly plan? (If annual → show error)
3. Show modal: "Pause for how long?"
   - 1 month
   - 2 months
   - 3 months
4. User selects duration and confirms
5. System calculates resume_date = current_period_end + pause_duration
6. Calls gateway API to cancel subscription
7. Updates subscription:
   - status = 'paused'
   - paused_at = now
   - resume_date = calculated date
8. Stops n8n instance immediately
9. Sends confirmation email: "Paused until [resume_date]"
10. Logs activity

**Auto-resume on resume date:**
- Scheduled job runs daily
- Checks for subscriptions where resume_date = today AND status = 'paused'
- For each:
  1. Create new subscription in gateway
  2. Attempt first payment
  3. If payment successful:
     - Update status to 'active'
     - Start n8n instance
     - Send "Welcome back" email
  4. If payment failed:
     - Update status to 'payment_failed'
     - Send payment failed email
     - Start retry logic

**Manual resume (user wants to come back early):**
- User clicks "Resume Now"
- Immediate resume process (same as auto-resume)
- Next billing starts from today

---

### Cancellation Logic

**Business Rules:**
- User can cancel any time
- Access continues until end of current paid period
- No partial refunds (unless within 7-day window)
- After period ends, data retained for 30 days then deleted

#### Cancellation Flow

**User initiates:**
1. User clicks "Cancel Subscription"
2. Show modal with retention attempt:
   - "We're sorry to see you go!"
   - Reason dropdown (required): Cost too high / Not using enough / Found alternative / Technical issues / Other
   - Optional: Free-text feedback
   - Explain: "Access until [period_end], then data deleted after 30 days"
3. User confirms cancellation
4. System calls gateway API to cancel subscription (at period end)
5. Updates subscription:
   - status = 'cancelled'
   - cancelled_at = now
   - cancel_reason = user's reason
6. Sends confirmation email:
   - "Cancelled - access until [date]"
   - "Miss us? Reactivate anytime"
7. Logs activity

**On period_end date:**
- Scheduled job runs daily
- Checks for cancelled subscriptions where current_period_end = today
- For each:
  1. Stop n8n instance
  2. Update status to 'expired'
  3. Send final email: "Service ended - data will be deleted in 30 days"
  4. Schedule data deletion for +30 days

**After 30 days:**
- Delete n8n instance and all data
- Update subscription status to include data_deleted flag
- Send final email: "Data permanently deleted"

---

### Upgrade/Downgrade Logic

**Business Rules:**
- Users can switch between monthly and annual anytime
- Proration is calculated
- Immediate access to new plan features

#### Upgrade (Monthly → Annual)

**Example scenario:**
- User is on monthly plan: 400 EGP/month
- Paid on Dec 1, wants to upgrade on Dec 15
- Has 15 days left in current period

**Calculation:**
1. Calculate unused time value:
   - Daily rate = 400 / 30 = 13.33 EGP/day
   - Days remaining = 15 days
   - Credit = 15 × 13.33 = 200 EGP

2. Calculate amount to charge now:
   - Annual plan = 3,800 EGP
   - Minus credit = 3,800 - 200 = 3,600 EGP

3. New period:
   - Starts today (Dec 15)
   - Ends Dec 15 next year

**Implementation:**
1. User clicks "Upgrade to Annual"
2. System shows calculation modal
3. User confirms
4. System:
   - Cancels current monthly subscription in gateway
   - Creates new annual subscription
   - Charges 3,600 EGP immediately
   - If payment successful:
     - Update subscription to annual plan
     - Reset billing period
     - Send confirmation email
   - If payment failed:
     - Rollback to monthly plan
     - Show error message

#### Downgrade (Annual → Monthly)

**Example scenario:**
- User is on annual plan: 3,800 EGP/year (paid upfront)
- Paid on Jan 1, wants to downgrade on June 1
- Has 7 months left in annual period

**Two options:**

**Option A: Apply credit to future months (Recommended)**
1. Calculate remaining value:
   - Monthly equivalent = 3,800 / 12 = 316.67 EGP/month
   - Months remaining = 7 months
   - Credit = 7 × 316.67 = 2,216.67 EGP

2. Convert to monthly:
   - Monthly rate = 400 EGP
   - Free months = 2,216.67 / 400 = 5.5 months
   - User gets 5 free months, then pays 400 EGP/month

**Option B: Partial refund**
1. Calculate and refund unused portion
2. Switch to monthly billing immediately

**Recommendation: Use Option A** (credits, no refunds)
- Easier to implement
- Less payment processing fees
- Retains revenue

**Implementation:**
1. User clicks "Downgrade to Monthly"
2. System shows:
   - "You have 2,216 EGP credit"
   - "You'll get 5 free months, then resume paying 400 EGP/month"
3. User confirms
4. System:
   - Cancels annual subscription
   - Creates monthly subscription with 5-month pause
   - Sets next_billing_date to +5 months
   - Sends confirmation email

---

## Refund System

**Business Policy:**
- 7-day money-back guarantee
- Full refund only (no partial refunds)
- One refund per customer
- Valid only if no excessive usage (optional check)

### Refund Request Flow

#### User Side

1. **Eligibility check:**
   - Within 7 days of payment
   - Subscription is active (not already cancelled)
   - No previous refunds

2. **User clicks "Request Refund"**
   - If not eligible: show error message
   - If eligible: show refund request form

3. **Refund request form:**
   - Payment to refund (auto-selected if only one)
   - Amount (calculated automatically)
   - Reason (required dropdown):
     - Not satisfied with service
     - Technical issues
     - Found better alternative
     - Changed my mind
     - Other
   - Additional details (optional text)
   - Submit button

4. **On submit:**
   - Create refund_request record (status = 'pending')
   - Send confirmation email to user: "Request received, will process within 24 hours"
   - Send notification to admin
   - Show success message: "Request submitted"

#### Admin Side

**Admin receives notification:**
- Email alert
- Dashboard shows pending refund count

**Admin reviews request:**
1. Go to Refund Management page
2. See pending requests
3. Click request to view details:
   - User information
   - Subscription details
   - Usage stats (if available)
   - Reason provided

**Admin makes decision:**

**If APPROVE:**
1. Click "Approve Refund"
2. Optional: Add admin notes
3. System:
   - Calls gateway refund API
   - Updates refund_request status to 'approved'
   - Updates payment record with refund details
   - Cancels subscription immediately
   - Stops n8n instance
   - Sends email to user: "Refund approved - 3-5 business days"
   - Logs activity

**If REJECT:**
1. Click "Reject Refund"
2. Required: Add rejection reason
3. Optional: Offer alternative (discount, extension)
4. System:
   - Updates refund_request status to 'rejected'
   - Sends email to user with reason
   - Keeps subscription active
   - Logs activity

---

### Automated Refund Processing

**For auto-approved cases (optional):**
- If subscription is brand new (<24 hours) and zero usage
- Can auto-approve without manual review
- Set status directly to 'approved' and process

**Gateway webhook:**
- When gateway confirms refund processed
- Updates refund_request status to 'processed'
- Final confirmation email to user

---

## Email Communication

**Critical:** Every important action must trigger an email.

### Required Email Templates

The coding agent must implement these transactional emails:

#### 1. Welcome Email
**Trigger:** Successful payment + account creation
**Subject:** "مرحباً بك في [Platform Name]"
**Content:**
- Thank you message
- Order confirmation (subscription ID, plan, amount)
- n8n instance URL and login credentials
- Quick start guide link
- CTA: "Go to Dashboard"
**Attachments:** Receipt (PDF)

#### 2. Payment Confirmation
**Trigger:** Every successful payment (including renewals)
**Subject:** "تم استلام دفعتك بنجاح"
**Content:**
- Payment amount and date
- Subscription period covered
- Next billing date
- Receipt link
**Attachments:** Invoice (PDF)

#### 3. Payment Failed
**Trigger:** Payment attempt failed
**Subject:** "⚠️ فشلت عملية الدفع - إجراء مطلوب"
**Content:**
- Alert that payment failed
- Reason (if available)
- "We'll retry in 3 days"
- CTA: "Update Payment Method"
- Warning: Service will suspend if not resolved
**Urgency:** High priority email

#### 4. Subscription Paused
**Trigger:** User successfully pauses subscription
**Subject:** "تم إيقاف اشتراكك مؤقتاً"
**Content:**
- Confirmation of pause
- Pause duration
- Resume date
- "No billing during pause"
- "Come back early anytime"

#### 5. Subscription Resumed
**Trigger:** Subscription resumes (auto or manual)
**Subject:** "مرحباً بعودتك!"
**Content:**
- Welcome back message
- Payment confirmation for resumed billing
- Next billing date
- CTA: "Access Your n8n"

#### 6. Subscription Cancelled
**Trigger:** User cancels subscription
**Subject:** "تأكيد إلغاء الاشتراك"
**Content:**
- Confirmation of cancellation
- Access remains until [period_end]
- Data deletion after 30 days
- "Changed your mind? Reactivate anytime"
- CTA: "Reactivate Subscription"

#### 7. Service Suspended
**Trigger:** Payment failed, grace period expired
**Subject:** "🔴 تم إيقاف خدمتك"
**Content:**
- Service suspended due to payment failure
- n8n instance stopped
- Data preserved for now
- CTA: "Pay Now to Restore Access"
**Urgency:** Critical

#### 8. Refund Request Received
**Trigger:** User submits refund request
**Subject:** "تم استلام طلب الاسترداد"
**Content:**
- Confirmation we received request
- Processing time: 24 hours
- What happens next

#### 9. Refund Approved
**Trigger:** Admin approves refund
**Subject:** "تم الموافقة على طلب الاسترداد"
**Content:**
- Refund approved
- Amount to be refunded
- Timeline: 3-5 business days
- Subscription cancelled
- Sorry to see you go

#### 10. Refund Rejected
**Trigger:** Admin rejects refund
**Subject:** "بخصوص طلب الاسترداد"
**Content:**
- Unfortunately cannot approve
- Reason (from admin)
- Alternative offer (if any)
- Subscription remains active

#### 11. Support Ticket Created
**Trigger:** User creates ticket
**Subject:** "تذكرة دعم جديدة #[ID]"
**Content:**
- Ticket ID
- Subject
- "We'll respond within 24 hours"
- View ticket link

#### 12. Support Ticket Reply (Admin)
**Trigger:** Admin replies to ticket
**Subject:** "رد جديد على تذكرتك #[ID]"
**Content:**
- Notification of admin response
- Preview of response
- CTA: "View and Reply"

#### 13. Support Ticket Resolved
**Trigger:** Ticket marked resolved
**Subject:** "تم حل تذكرتك #[ID]"
**Content:**
- Ticket resolved
- "If issue persists, reopen ticket"
- Request feedback

---

### Email Design Requirements

**All emails should:**
- Be mobile-responsive
- Include company logo and branding
- Have clear CTA buttons
- Be bilingual (Arabic primary, English secondary) or Arabic only
- Include footer with:
  - Unsubscribe link (for marketing emails)
  - Contact information
  - Links to Terms & Privacy Policy
- Use professional email service (SendGrid, Mailgun, etc.) not local SMTP

---

### Email Automation System

**The coding agent should implement:**
1. Email queue system (for reliability)
2. Template engine (Handlebars, Mustache, etc.)
3. Retry logic for failed sends
4. Email logs (track delivery status)
5. Unsubscribe management
6. Test mode (send to test email instead of user)

---

## Support System

Detailed ticket management workflow.

### Ticket Lifecycle

**States:** Open → Waiting for Admin → Waiting for Customer → Resolved → Closed

#### State Transitions

**Open:**
- Initial state when ticket created
- Admin has not yet responded
- Visible in admin queue

**Waiting for Admin:**
- Customer has replied
- Ball is in admin's court
- Highlighted in admin queue

**Waiting for Customer:**
- Admin has replied
- Ball is in customer's court
- Not urgent in admin queue

**Resolved:**
- Admin marked as resolved
- Customer asked to confirm
- If customer agrees → Closed
- If customer disagrees → back to Open

**Closed:**
- Final state
- No further action needed
- Archived

---

### Auto-Assignment Logic

**For new tickets:**
1. Check if ticket category matches admin expertise (if configured)
2. Assign to admin with fewest open tickets
3. If all admins busy equally, round-robin assignment
4. Send email to assigned admin

---

### SLA (Service Level Agreement)

**Response time targets:**
- Critical priority: 2 hours
- High priority: 6 hours
- Normal priority: 24 hours
- Low priority: 48 hours

**The coding agent should implement:**
- SLA timer on each ticket
- Visual indicator when SLA approaching
- Alert admins when SLA breached
- Report on SLA performance

---

### Escalation Rules

**Auto-escalate if:**
1. Payment dispute ticket open >48 hours
2. Technical bug ticket open >72 hours
3. Any ticket with no admin response in 24 hours
4. User replies to "Resolved" ticket (reopen)

**Escalation actions:**
- Increase priority
- Assign to senior admin
- Send alert email
- Log escalation

---

## Technical Requirements

Instructions for the coding agent on system architecture and deployment.

### Infrastructure Requirements

**Server Specifications (Minimum for MVP):**
- 4 vCPU
- 8 GB RAM
- 80 GB SSD storage
- Linux (Ubuntu 22.04 LTS recommended)

**Scaling considerations:**
- Each n8n instance needs ~500MB - 1GB RAM
- With 8GB server, can run 5-7 instances comfortably
- For 50+ users, upgrade to 16 vCPU / 32 GB RAM server

**Network:**
- Fixed public IP address
- Domain name with SSL certificate
- Firewall configured (only necessary ports open)

---

### n8n Instance Management

**Deployment strategy: Docker Containers**

Each user gets their own isolated n8n container:

**Container naming convention:**
- `n8n-user-[user_id]`
- Example: `n8n-user-123e4567-e89b-12d3-a456-426614174000`

**Container configuration:**
- Each container on separate port (starting from 5000)
- Reverse proxy (Nginx) routes traffic based on subdomain/path
- Isolated data volume per container
- Environment variables for n8n configuration

**URL structure options:**

**Option A: Subdomains**
- User 1: `user1.n8n.yourplatform.com`
- User 2: `user2.n8n.yourplatform.com`
- Requires wildcard SSL certificate
- Cleaner looking

**Option B: Paths**
- User 1: `n8n.yourplatform.com/user1`
- User 2: `n8n.yourplatform.com/user2`
- Single SSL certificate
- Easier setup

**Recommended: Option A** for better user experience

---

### Container Lifecycle Management

**On subscription created:**
1. Generate unique container name
2. Create Docker volume for persistence
3. Start container with n8n image
4. Configure environment variables:
   - N8N_BASIC_AUTH_ACTIVE=true
   - N8N_BASIC_AUTH_USER=[unique_username]
   - N8N_BASIC_AUTH_PASSWORD=[generated_password]
   - N8N_PROTOCOL=https
   - N8N_HOST=[user_subdomain]
5. Configure reverse proxy to route traffic
6. Wait for container to be healthy
7. Store container_id and instance_url in database
8. Send credentials to user

**On subscription paused/cancelled/suspended:**
1. Stop container (don't delete)
2. Container and data remain for potential resume
3. Update database status

**On subscription resumed:**
1. Start existing container
2. Verify it's healthy
3. Update database status

**On subscription deleted (after 30 days):**
1. Stop container
2. Delete container
3. Delete data volume
4. Remove from reverse proxy config
5. Free up resources

---

### Deployment with Coolify (Optional but Recommended)

**Coolify simplifies deployment:**
- Handles Docker orchestration
- Manages SSL certificates automatically
- Built-in monitoring
- Easy scaling

**Setup with Coolify:**
1. Install Coolify on server
2. Connect GitHub repository
3. Configure environment variables
4. Set up automated deployments
5. Coolify handles the rest

**For n8n instances:**
- Can use Coolify's service templates
- Or manage containers via Docker API

---

### Database Backup Strategy

**Automated backups:**
- Daily backup at 2 AM server time
- Retain last 7 days
- Weekly backup retained for 4 weeks
- Monthly backup retained for 12 months

**Backup storage:**
- Store on separate server/cloud storage
- Encrypted backups
- Test restore procedure monthly

**What to backup:**
- Application database (PostgreSQL/MySQL)
- n8n data volumes (all user containers)
- Application code and configuration
- Payment gateway logs
- Email logs

---

### Monitoring & Alerting

**System health monitoring:**
- Server CPU, RAM, disk usage
- Database performance
- Container statuses
- Application error rate
- Payment gateway connection

**Application monitoring:**
- User signups per day
- Active subscriptions count
- Payment success rate
- Failed payment alerts
- Refund request alerts
- Support ticket backlog

**Alerting rules:**
- Email/SMS admin if:
  - Server disk >80% full
  - Database connection failure
  - Payment gateway down
  - Any container crashed
  - More than 5 failed payments in 1 hour

**Recommended tools:**
- Uptime monitoring: UptimeRobot or Better Uptime
- Server monitoring: Netdata or Prometheus
- Application monitoring: Sentry for error tracking
- Log aggregation: Loki or ELK stack

---

### Security Requirements

**Application security:**
- HTTPS everywhere (force redirect from HTTP)
- Strong password requirements (min 8 chars, mixed case, numbers, symbols)
- Password hashing with bcrypt or Argon2
- CSRF protection on all forms
- SQL injection prevention (use ORM, prepared statements)
- XSS prevention (sanitize all user inputs)
- Rate limiting on login, signup, API endpoints

**n8n container isolation:**
- Each container runs as non-root user
- Resource limits per container (CPU, RAM)
- Network isolation where possible
- No shared volumes between user containers

**Payment security:**
- Never store credit card numbers
- PCI compliance not needed (gateway handles cards)
- Store only gateway customer/subscription IDs
- Log payment attempts but mask sensitive data

**Data protection:**
- Encrypt database backups
- Encrypt sensitive fields in database (optional)
- GDPR compliance:
  - Data export feature for users
  - Data deletion on request
  - Privacy policy clearly stated

**Admin access:**
- Two-factor authentication (2FA) for admin accounts
- Audit log of all admin actions
- Separate admin panel URL (not /admin)
- IP whitelisting for admin panel (optional)

---

### API Design (If Building API)

**RESTful endpoints:**
- `/api/auth/login` - User login
- `/api/auth/signup` - User registration
- `/api/auth/logout` - User logout
- `/api/user/profile` - Get/Update user profile
- `/api/subscription` - Get subscription details
- `/api/subscription/pause` - Pause subscription
- `/api/subscription/resume` - Resume subscription
- `/api/subscription/cancel` - Cancel subscription
- `/api/subscription/upgrade` - Upgrade/downgrade
- `/api/payments` - Payment history
- `/api/refund/request` - Request refund
- `/api/tickets` - Support tickets CRUD
- `/api/instance/status` - Get n8n instance status
- `/api/instance/restart` - Restart n8n instance

**Authentication:**
- JWT tokens for API authentication
- Token refresh mechanism
- Expire tokens after reasonable time (1 day)

**Rate limiting:**
- 100 requests per minute per user
- 1000 requests per hour per user
- Stricter limits on expensive operations

---

### Development Workflow

**Recommended stack:**
- **Frontend:** Next.js (React) or Vue.js
- **Backend:** Node.js (Express/Fastify) or Python (FastAPI/Django)
- **Database:** PostgreSQL (preferred) or MySQL
- **ORM:** Prisma (Node.js) or SQLAlchemy (Python)
- **Hosting:** Hetzner, DigitalOcean, Linode
- **Domain:** Namecheap, Cloudflare
- **Email:** SendGrid, Mailgun, Amazon SES
- **Payment:** Paymob (Egypt), Stripe (international)

**Development stages:**
1. Local development
2. Staging environment (test server)
3. Production environment

**Version control:**
- Git repository (GitHub, GitLab)
- Branches: main, develop, feature/*
- Pull requests for code review
- Automated tests before merge

**Testing:**
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Load testing before launch

---

## Implementation Roadmap

**The coding agent should follow this implementation order:**

### Phase 1: Foundation (Week 1-2)
- [ ] Set up development environment
- [ ] Initialize database and create schema
- [ ] Implement user authentication (signup, login, logout)
- [ ] Build basic user dashboard skeleton
- [ ] Deploy to staging server

### Phase 2: Payment Integration (Week 3)
- [ ] Integrate payment gateway (Paymob or chosen gateway)
- [ ] Implement checkout flow
- [ ] Set up webhook endpoint
- [ ] Handle webhook events (payment success/failure)
- [ ] Test payment flow end-to-end with test cards

### Phase 3: Subscription Management (Week 4)
- [ ] Build subscription creation logic
- [ ] Implement pause/resume functionality
- [ ] Implement cancellation logic
- [ ] Build upgrade/downgrade flows
- [ ] Set up subscription renewal automation

### Phase 4: n8n Integration (Week 5)
- [ ] Set up Docker environment
- [ ] Build container provisioning system
- [ ] Configure reverse proxy (Nginx)
- [ ] Implement instance start/stop/restart
- [ ] Test with multiple user instances

### Phase 5: User Dashboard (Week 6)
- [ ] Complete all dashboard pages
- [ ] Subscription management page
- [ ] Billing history page
- [ ] Payment method update
- [ ] Account settings
- [ ] Support ticket creation

### Phase 6: Admin Panel (Week 7-8)
- [ ] Admin authentication
- [ ] Dashboard with metrics
- [ ] User management
- [ ] Subscription management
- [ ] Refund processing
- [ ] Support ticket management
- [ ] Analytics/reporting

### Phase 7: Communication (Week 9)
- [ ] Set up email service (SendGrid/Mailgun)
- [ ] Create all email templates
- [ ] Implement email triggers
- [ ] Test all email flows
- [ ] Optional: WhatsApp integration for critical alerts

### Phase 8: Polish & Testing (Week 10)
- [ ] Comprehensive testing
- [ ] Bug fixes
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

### Phase 9: Launch Preparation (Week 11)
- [ ] Set up production server
- [ ] Configure DNS and SSL
- [ ] Deploy to production
- [ ] Final testing on production
- [ ] Prepare marketing materials
- [ ] Create help documentation

### Phase 10: Launch & Monitor (Week 12)
- [ ] Soft launch to limited users
- [ ] Monitor for issues
- [ ] Collect user feedback
- [ ] Make quick fixes
- [ ] Full public launch

---

## Success Metrics

**Track these KPIs to measure success:**

### Financial Metrics
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (CLV)
- Payment success rate
- Refund rate

### Growth Metrics
- New signups per month
- Conversion rate (visitors → paying customers)
- Monthly vs Annual plan ratio
- Upgrade rate
- Churn rate (cancellations / total users)

### Operational Metrics
- Average support ticket resolution time
- Support ticket volume
- n8n instance uptime %
- Server resource usage
- Payment processing time

### User Satisfaction
- Net Promoter Score (NPS)
- Customer Satisfaction Score (CSAT)
- Feature usage statistics
- User feedback sentiment

---

## Final Notes for Coding Agent

**CRITICAL REMINDERS:**

1. **Security first:** Never compromise on security. Hash passwords, validate inputs, use HTTPS.

2. **User experience:** Every flow should be intuitive. If you need to explain it, it's too complex.

3. **Error handling:** Never show technical errors to users. Log them, show friendly messages.

4. **Testing:** Test every flow manually before marking as complete.

5. **Documentation:** Comment complex logic. Future you will thank you.

6. **Mobile-first:** Design for mobile, enhance for desktop.

7. **Performance:** Users expect fast load times. Optimize database queries, cache where appropriate.

8. **Scalability:** Design for 100 users, architect for 10,000.

9. **Backups:** Automate backups from day 1. Not if disaster strikes, but when.

10. **Monitoring:** You can't fix what you can't see. Monitor everything.

---

**Good luck building! This spec should give you everything you need to create a robust, production-ready n8n SaaS platform.**

---

## Questions? Issues?

If the coding agent encounters any ambiguity or needs clarification, prioritize:
1. User experience and simplicity
2. Security and data integrity
3. Scalability and maintainability

When in doubt, implement the conservative, secure option first. Features can be added, but trust is hard to rebuild.

# Clinic Audit SaaS - Multi-User Platform

A production-ready, multi-tenant SaaS application for clinic performance auditing with secure authentication, role-based access control, and complete data isolation per clinic.

## 🎯 Overview

This is a **complete rewrite** of the single-HTML clinic audit app into a scalable SaaS platform with:

- ✅ **Real user authentication** (email + password, forgot password flow)
- ✅ **Cloud database** (PostgreSQL with multi-tenant architecture)
- ✅ **True data isolation** (each clinic's data is completely separate)
- ✅ **Role-based access control** (Admin vs Member permissions)
- ✅ **Team collaboration** (invite teammates via email)
- ✅ **Accessible anywhere** (cloud-based, not localStorage)
- ✅ **Production-ready** (secure, scalable foundation for SaaS business)

## 🏗️ Architecture

### Database Schema (Multi-Tenant)

```
clinics (top-level tenant)
├── users (each user belongs to one clinic)
├── global_goals (clinic-wide goals)
├── monthly_audits (monthly data entries)
│   ├── payroll_items
│   ├── additional_expenses
│   └── services
├── invitations (email invitations)
└── password_reset_tokens
```

**Critical Security Features:**
- All queries filtered by `clinic_id`
- Row-level data isolation enforced at database level
- Users can ONLY access their own clinic's data
- JWT tokens include clinic_id for validation

### Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL database
- JWT authentication
- bcrypt password hashing
- Nodemailer for emails

**Frontend:**
- React 18
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- Recharts for trend visualizations

## 📁 Project Structure

```
clinic-audit-saas/
├── backend/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection
│   ├── middleware/
│   │   └── auth.js               # JWT auth + role checking
│   ├── routes/
│   │   ├── auth.js               # Signup, login, password reset
│   │   ├── audits.js             # CRUD for monthly audits
│   │   ├── goals.js              # Global goals management
│   │   └── users.js              # User & invitation management
│   ├── utils/
│   │   └── email.js              # Email sending utility
│   ├── server.js                 # Express server
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.js
│   │   │   │   ├── Signup.js
│   │   │   │   ├── ForgotPassword.js
│   │   │   │   └── AcceptInvitation.js
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── KPICards.js
│   │   │   │   ├── FunnelVisual.js
│   │   │   │   ├── ScoreCards.js
│   │   │   │   └── Recommendations.js
│   │   │   ├── DataEntry/
│   │   │   │   ├── DataEntryForm.js
│   │   │   │   ├── ServicesList.js
│   │   │   │   ├── PayrollList.js
│   │   │   │   └── ExpensesList.js
│   │   │   ├── Goals/
│   │   │   │   └── GlobalGoals.js
│   │   │   ├── History/
│   │   │   │   └── HistoryTable.js
│   │   │   ├── Trends/
│   │   │   │   └── TrendsCharts.js
│   │   │   ├── Admin/
│   │   │   │   ├── TeamManagement.js
│   │   │   │   └── InviteUser.js
│   │   │   └── Layout/
│   │   │       ├── Navbar.js
│   │   │       └── ProtectedRoute.js
│   │   ├── services/
│   │   │   ├── api.js            # Axios instance
│   │   │   ├── authService.js    # Auth API calls
│   │   │   └── auditService.js   # Audit API calls
│   │   ├── utils/
│   │   │   └── calculations.js   # All audit calculations
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── DATABASE_SCHEMA.sql           # Full database schema
```

## 🚀 Quick Start

### 1. Database Setup

```bash
# Install PostgreSQL (if not installed)
# Create database
createdb clinic_audit_saas

# Run schema
psql clinic_audit_saas < DATABASE_SCHEMA.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings:
# - DATABASE_URL
# - JWT_SECRET (generate random string)
# - SMTP settings (for emails)

# Start backend
npm run dev
# Server runs on http://localhost:3001
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start frontend
npm start
# App runs on http://localhost:3000
```

## 🔐 Authentication Flow

### New Clinic Signup
1. User visits `/signup`
2. Fills: Email, Password, Name, Clinic Name
3. System creates:
   - New clinic record
   - Admin user account
   - Default global goals
4. User auto-logged in with JWT token

### Team Member Invitation
1. Admin goes to Team Management
2. Enters email + role (Admin/Member)
3. System sends invitation email with unique token
4. Invitee clicks link → `/accept-invitation?token=xxx`
5. Creates account → auto-joins clinic

### Login
1. Email + password
2. JWT token returned (includes user_id, clinic_id, role)
3. Token stored in localStorage
4. Included in all API requests via Authorization header

### Forgot Password
1. Enter email
2. Receives reset link with token
3. Creates new password
4. Token marked as used

## 👥 Roles & Permissions

### Admin
- ✅ View all data
- ✅ Enter/edit monthly audits
- ✅ Edit global goals
- ✅ Invite team members
- ✅ Deactivate users
- ✅ View team list

### Member
- ✅ View all data
- ✅ Enter/edit monthly audits
- ❌ Cannot edit goals
- ❌ Cannot invite users
- ❌ Cannot manage team

## 📊 Features (Same as Original App)

All original functionality is preserved:

### Dashboard
- KPI cards (Revenue, Profit, Margin, Capacity, Clients, Client Value)
- Client acquisition funnel with conversion tracking
- 4-bucket scoring system (Financial, Capacity, New Client Flow, Marketing)
- Smart recommendations based on performance

### Data Entry
- Monthly audit entry form
- Dynamic services (add/remove)
- Dynamic payroll items
- Dynamic additional expenses
- Client funnel metrics (website visits, conversions, new clients)

### Goals
- Global clinic-wide goals (Revenue, Profit Margin, Capacity)
- Used for scoring across all months
- Admin-only editing

### History
- View all past months
- Click to load and edit
- Month-over-month comparisons

### Trends
- Line graphs with goal lines
- 8 trend charts:
  - Revenue vs Goal
  - Profit Margin vs Goal
  - Capacity vs Goal
  - Website Visits
  - Website Conversion Rate
  - New Client Visits
  - Treatment Plan Conversion
  - Total Score

### Service Economics
- Per-service profitability analysis
- Capacity utilization by service
- Revenue per hour calculations

## 🔒 Security Features

### Data Isolation
- Every query includes `WHERE clinic_id = $user_clinic_id`
- Database foreign keys enforce referential integrity
- Middleware validates clinic access on every request

### Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 24 hours
- Tokens validated on every protected route

### Authorization
- Role-based middleware (`requireAdmin`)
- Clinic access middleware (`ensureClinicAccess`)
- Self-deactivation prevented

### SQL Injection Protection
- All queries use parameterized statements
- Input validation with express-validator

## 📧 Email Configuration

The app sends emails for:
- Team invitations
- Password reset links

### Setup Gmail SMTP (Recommended for Testing)

1. Create a Gmail account
2. Enable 2FA
3. Generate App Password
4. Use in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Production Email Services
- SendGrid
- AWS SES
- Mailgun
- Postmark

## 🎨 Frontend Pages

### Public (Unauthenticated)
- `/login` - Login page
- `/signup` - Create new clinic account
- `/forgot-password` - Request password reset
- `/reset-password?token=xxx` - Set new password
- `/accept-invitation?token=xxx` - Accept team invitation

### Protected (Authenticated)
- `/dashboard` - Main dashboard
- `/data-entry` - Monthly data entry form
- `/goals` - Global goals (Admin only editing)
- `/history` - Past months table
- `/trends` - Trend visualizations
- `/service-economics` - Service profitability
- `/team` - Team management (Admin only)

## 🧮 Calculations (Unchanged)

All calculation logic from the original app is preserved:

```javascript
// Financial metrics
const totalPayroll = sum(payroll.map(p => p.amount));
const totalExpenses = operatingExpenses + sum(expenses);
const profit = revenue - totalExpenses - totalPayroll - cogs;
const profitMargin = (profit / revenue) * 100;

// Capacity
const capacity = totalBookedHours / totalProviderHours;

// Conversions
const websiteConversionRate = websiteConversionRate / 100; // manual input
const treatmentPlanConversionRate = clientsConverting / newClientVisits;

// Scoring (0-100 total)
// - Financial: 0-25 (revenue goal + margin goal)
// - Capacity: 0-25 (vs capacity goal)
// - New Client Flow: 0-25 (volume + conversion quality)
// - Marketing: 0-25 (traffic + web conversion + results)
```

## 📦 Deployment Options

### Option 1: Creao Platform (Recommended)
1. Upload backend + frontend to Creao
2. Configure PostgreSQL database
3. Set environment variables
4. Deploy

### Option 2: Heroku
```bash
# Backend
heroku create clinic-audit-api
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main

# Frontend
# Build and deploy to Heroku or Netlify
```

### Option 3: AWS/DigitalOcean
- EC2/Droplet for backend
- RDS/Managed PostgreSQL for database
- S3 + CloudFront for frontend

## 👤 Managing Users in Production

### As Platform Owner (You)

**Option 1: Direct Database Access**
```sql
-- View all clinics
SELECT * FROM clinics;

-- View all users
SELECT u.*, c.name as clinic_name FROM users u JOIN clinics c ON u.clinic_id = c.id;

-- Make someone admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- Deactivate a clinic
UPDATE clinics SET is_active = false WHERE id = 'clinic-uuid';
```

**Option 2: Admin API Endpoints (Create These)**
- `POST /api/admin/clinics` - Create clinic manually
- `GET /api/admin/stats` - Platform-wide stats
- `PUT /api/admin/clinics/:id/suspend` - Suspend clinic

### As Clinic Admin (Your Customers)

Admins use the frontend UI:
1. Go to Team Management page
2. Click "Invite Team Member"
3. Enter email + select role (Admin/Member)
4. Teammate receives email with invitation link
5. They create account → auto-joined to clinic

## 🎯 Onboarding Your First Paying Clinic

### Step 1: Clinic Signs Up
1. They visit your app URL
2. Click "Sign Up"
3. Fill form:
   - Email
   - Password
   - First Name, Last Name
   - Clinic Name
   - Location (optional)
4. Redirected to dashboard

### Step 2: Set Goals
1. Navigate to Goals tab
2. Set their targets:
   - Monthly Revenue Goal (e.g., $100,000)
   - Profit Margin Goal (e.g., 30%)
   - Capacity Goal (e.g., 80%)
3. Save

### Step 3: Enter First Month
1. Navigate to Data Entry
2. Select current month
3. Fill in all metrics
4. Add services, payroll, expenses
5. Save → View Dashboard

### Step 4: Invite Team (Optional)
1. Admin navigates to Team Management
2. Invites staff members
3. Staff receive emails → create accounts

## 🔧 Customization Guide

### Branding
**Logo:** Replace in `frontend/src/assets/logo.png`
**Colors:** Edit `frontend/tailwind.config.js`
**App Name:** Search/replace "Clinic Audit" across codebase

### Add New Metrics
1. Add column to `monthly_audits` table
2. Update `POST /api/audits` route to accept new field
3. Add input field in DataEntryForm.js
4. Update calculations if needed

### Add New Features
- Export to PDF: Add jsPDF library + export button
- CSV Import: Add file upload + parser
- SMS Notifications: Add Twilio integration
- Custom Reports: Create new API endpoint + frontend page

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql clinic_audit_saas

# Check .env DATABASE_URL format
DATABASE_URL=postgresql://user:password@localhost:5432/clinic_audit_saas
```

### Email Not Sending
- Check SMTP credentials in .env
- For Gmail, ensure App Password (not regular password)
- Check firewall allows SMTP port (587/465)
- Test with: `node -e "require('./utils/email').sendEmail({to:'test@example.com',subject:'Test',html:'Test'})"`

### JWT Token Errors
- Ensure JWT_SECRET is set in .env
- Check token in browser localStorage
- Verify token hasn't expired (24h default)

### CORS Issues
- Ensure backend `cors()` middleware is enabled
- Check FRONTEND_URL in backend .env matches actual frontend URL

## 📞 Support & Questions

This codebase includes:
- Full database schema with indexes and triggers
- Complete authentication system with password reset
- Multi-tenant data isolation
- Role-based access control
- Email invitation system
- All original app features migrated to cloud

**What's NOT included (by your request):**
- Billing/subscriptions (add Stripe later)
- Multi-clinic-per-user mode (one clinic per user for now)
- Advanced permissions beyond Admin/Member
- White-labeling features

## 🎉 You Now Have

✅ A **sellable SaaS product** ready for real customers
✅ **Secure authentication** with proper password handling
✅ **Multi-tenant architecture** with complete data isolation
✅ **Team collaboration** with role-based permissions
✅ **Production-ready foundation** that scales

Next steps:
1. Deploy to production (Creao/Heroku/AWS)
2. Add billing (Stripe) when ready
3. Market to clinics!
4. Iterate based on customer feedback

---

**Built with security, scalability, and real-world SaaS best practices.**

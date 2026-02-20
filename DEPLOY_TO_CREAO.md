# 🚀 Deploying Clinic Audit SaaS to Creao Platform

This guide shows you how to deploy your multi-user Clinic Audit SaaS application to the Creao platform.

## 📋 Prerequisites

- [ ] Creao account with deployment access
- [ ] PostgreSQL database provisioned
- [ ] SMTP email service configured
- [ ] Domain name (optional, for production)

## 🗄️ Step 1: Set Up Database

### Create PostgreSQL Database in Creao

1. **Navigate to Database Section**
   - Log into Creao dashboard
   - Go to `Databases` → `Create New Database`
   - Select: PostgreSQL 14+
   - Name: `clinic-audit-db`

2. **Note Connection Details**
   ```
   Host: your-db-host.creao.io
   Port: 5432
   Database: clinic_audit_saas
   Username: your_username
   Password: [generated password]
   ```

3. **Run Database Schema**
   - Open database terminal/client in Creao
   - Copy contents of `DATABASE_SCHEMA.sql`
   - Paste and execute
   - Verify tables created:
   ```sql
   \dt  -- List all tables
   ```

4. **Expected Tables**
   ```
   ✅ clinics
   ✅ users
   ✅ global_goals
   ✅ monthly_audits
   ✅ payroll_items
   ✅ additional_expenses
   ✅ services
   ✅ invitations
   ✅ password_reset_tokens
   ✅ audit_logs
   ```

## ⚙️ Step 2: Configure Backend

### Upload Backend Code

1. **In Creao Dashboard**
   - Go to `Applications` → `Create New App`
   - Type: Node.js API
   - Name: `clinic-audit-api`

2. **Upload Backend Files**
   ```
   backend/
   ├── config/
   ├── middleware/
   ├── routes/
   ├── utils/
   ├── server.js
   ├── package.json
   └── .env
   ```

3. **Set Environment Variables**
   In Creao App Settings → Environment Variables:

   ```env
   # Database (from Step 1)
   DATABASE_URL=postgresql://user:pass@host:5432/clinic_audit_saas

   # JWT Secret (generate strong random string)
   JWT_SECRET=your-super-secret-256-bit-key-change-this

   # Server
   PORT=3001
   NODE_ENV=production

   # Email (example with Gmail)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-app-email@gmail.com
   SMTP_PASS=your-app-specific-password
   FROM_EMAIL=noreply@clinicaudit.com
   FROM_NAME=Clinic Audit

   # Frontend URL (will update after frontend deployment)
   FRONTEND_URL=https://your-app.creao.app

   # Tokens
   SESSION_TIMEOUT=24h
   INVITATION_EXPIRY_HOURS=72
   PASSWORD_RESET_EXPIRY_HOURS=1
   ```

4. **Install Dependencies & Deploy**
   - Creao will automatically run `npm install`
   - Start command: `npm start`
   - Health check: `GET /health`

5. **Verify Backend**
   - Visit: `https://your-api.creao.app/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

## 🎨 Step 3: Configure Frontend

### Upload Frontend Code

1. **In Creao Dashboard**
   - Go to `Applications` → `Create New App`
   - Type: React App
   - Name: `clinic-audit-frontend`

2. **Upload Frontend Files**
   ```
   frontend/
   ├── public/
   ├── src/
   ├── package.json
   └── .env
   ```

3. **Set Environment Variables**
   Create `frontend/.env.production`:
   ```env
   REACT_APP_API_URL=https://your-api.creao.app/api
   ```

4. **Build & Deploy**
   - Creao runs: `npm install && npm run build`
   - Serves from `build/` directory
   - Your app URL: `https://your-app.creao.app`

5. **Update Backend FRONTEND_URL**
   - Go back to backend app settings
   - Update `FRONTEND_URL` to your actual frontend URL
   - Restart backend app

## 📧 Step 4: Configure Email

### Option 1: Gmail (Development/Testing)

1. **Create Gmail Account**
   - Use dedicated email (e.g., `noreply.clinicaudit@gmail.com`)

2. **Enable 2FA**
   - Google Account → Security → 2-Step Verification

3. **Generate App Password**
   - Google Account → Security → App Passwords
   - Select: Mail + Custom name
   - Copy 16-character password

4. **Add to Backend ENV**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=noreply.clinicaudit@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### Option 2: SendGrid (Production Recommended)

1. **Create SendGrid Account**
   - Free tier: 100 emails/day

2. **Create API Key**
   - Settings → API Keys → Create API Key
   - Permissions: Full Access (Mail Send)

3. **Configure in Backend**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Verify Sender**
   - SendGrid → Settings → Sender Authentication
   - Verify your email/domain

### Test Email

```bash
# SSH into backend container or use Creao terminal
node -p "require('./utils/email').sendEmail({
  to: 'your-test-email@gmail.com',
  subject: 'Test Email',
  html: '<h1>It works!</h1>'
})"
```

## 👥 Step 5: Create First Admin User

### Method 1: Via Signup Page (Easiest)

1. Visit: `https://your-app.creao.app/signup`
2. Fill form:
   - Email: `admin@yourclinic.com`
   - Password: (strong password)
   - Name: Your Name
   - Clinic Name: Your Clinic
3. Submit → Auto-logged in

### Method 2: Via Database (Alternative)

```sql
-- Insert clinic
INSERT INTO clinics (id, name) VALUES
('11111111-1111-1111-1111-111111111111', 'Demo Clinic');

-- Insert admin user (password: "password123")
-- Generate hash: node -p "require('bcrypt').hashSync('password123', 10)"
INSERT INTO users (email, password_hash, first_name, last_name, role, clinic_id) VALUES
('admin@demo.com', '$2b$10$...', 'Admin', 'User', 'admin', '11111111-1111-1111-1111-111111111111');

-- Create default goals
INSERT INTO global_goals (clinic_id) VALUES
('11111111-1111-1111-1111-111111111111');
```

## 🔐 Step 6: Secure Your Deployment

### SSL/HTTPS
- Creao automatically provides SSL certificates
- All traffic encrypted via HTTPS
- Force HTTPS redirects enabled

### Database Security
- [ ] Database firewall: Only allow backend IP
- [ ] Strong database password
- [ ] Regular backups enabled
- [ ] Connection pooling configured

### Application Security
- [ ] Strong JWT_SECRET (min 32 characters)
- [ ] CORS restricted to your frontend domain
- [ ] Rate limiting enabled (if available)
- [ ] Environment variables never committed to code

### Monitoring
- [ ] Enable application logs
- [ ] Set up error notifications
- [ ] Monitor database performance
- [ ] Track failed login attempts

## 🧪 Step 7: Test Your Deployment

### 1. Test Authentication

**Signup:**
```bash
curl -X POST https://your-api.creao.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "clinicName": "Test Clinic"
  }'
```

**Login:**
```bash
curl -X POST https://your-api.creao.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "role": "admin",
    "clinicId": "..."
  }
}
```

### 2. Test Data Isolation

1. Create 2 test clinics via signup
2. Login to Clinic A → Create monthly audit
3. Login to Clinic B → Verify cannot see Clinic A's data
4. Try to manually access Clinic A's audit via API → Should fail

### 3. Test Team Invitations

1. Login as admin
2. Navigate to Team Management
3. Invite email: `teammate@example.com`
4. Check teammate's email inbox
5. Click invitation link
6. Create account → Verify auto-joined to clinic

### 4. Test Forgot Password

1. Go to `/forgot-password`
2. Enter email
3. Check email inbox
4. Click reset link
5. Set new password
6. Login with new password

## 📊 Step 8: Monitor & Maintain

### Daily Checks
- [ ] Check error logs for issues
- [ ] Monitor API response times
- [ ] Verify email delivery working

### Weekly Checks
- [ ] Review user growth
- [ ] Check database size/performance
- [ ] Review failed login attempts

### Monthly Checks
- [ ] Database backup verification
- [ ] Update dependencies (`npm audit fix`)
- [ ] Review SSL certificate expiry
- [ ] Performance optimization review

## 🎯 Managing Users as Platform Owner

### View All Clinics & Users

```sql
-- All clinics
SELECT id, name, created_at,
       (SELECT COUNT(*) FROM users WHERE clinic_id = c.id) as user_count,
       (SELECT COUNT(*) FROM monthly_audits WHERE clinic_id = c.id) as audit_count
FROM clinics c
ORDER BY created_at DESC;

-- All users across all clinics
SELECT u.email, u.first_name, u.last_name, u.role, u.is_active,
       c.name as clinic_name, u.last_login_at
FROM users u
JOIN clinics c ON u.clinic_id = c.id
ORDER BY u.created_at DESC;
```

### Common Admin Tasks

**Deactivate a user:**
```sql
UPDATE users SET is_active = false WHERE email = 'user@example.com';
```

**Make someone admin:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

**Delete a clinic (cascades to all data):**
```sql
DELETE FROM clinics WHERE id = 'clinic-uuid';
```

**View platform stats:**
```sql
SELECT
  (SELECT COUNT(*) FROM clinics) as total_clinics,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM monthly_audits) as total_audits,
  (SELECT COUNT(*) FROM users WHERE last_login_at > NOW() - INTERVAL '7 days') as active_users_7d;
```

## 🚀 Onboarding Your First Paying Customer

### Step 1: Send Them the App URL
```
Hi [Customer],

Your Clinic Audit account is ready!

🌐 Visit: https://your-app.creao.app

1. Click "Sign Up"
2. Create your clinic account
3. Start tracking your performance

Need help? Reply to this email.

Best,
[Your Name]
```

### Step 2: They Sign Up
- They create account → become clinic admin
- Auto-redirected to dashboard

### Step 3: Onboarding Checklist (Send Them This)
```
✅ Set Your Goals (Goals tab)
   - Monthly Revenue Target
   - Profit Margin Goal
   - Capacity Goal

✅ Enter Your First Month (Data Entry tab)
   - Select current month
   - Fill in financial metrics
   - Add services, payroll, expenses
   - Save & view dashboard

✅ Invite Your Team (Team Management)
   - Add clinic staff
   - Set roles (Admin vs Member)

✅ Review Your Performance
   - Check dashboard scores
   - Read recommendations
   - View trends over time
```

### Step 4: Support
- Provide email support
- Create help docs
- Schedule onboarding call (optional)

## 🔧 Troubleshooting Common Issues

### "Database connection failed"
- Check DATABASE_URL format
- Verify database firewall allows backend IP
- Test connection from backend container:
  ```bash
  psql $DATABASE_URL
  ```

### "Email not sending"
- Verify SMTP credentials
- Check email service status
- Test email manually (see Step 4)
- Check spam folder

### "Token invalid or expired"
- JWT tokens expire after 24h (default)
- User needs to log in again
- Check JWT_SECRET is consistent across restarts

### "Access denied to clinic data"
- Multi-tenant isolation working correctly
- User trying to access different clinic's data
- Verify user's clinic_id in database

### "Frontend not connecting to backend"
- Check REACT_APP_API_URL in frontend env
- Verify CORS enabled in backend
- Check browser console for errors

## 📞 Getting Help

### Creao Platform Support
- Documentation: [Creao Docs]
- Support Email: support@creao.io
- Community Forum: [Creao Community]

### Application Issues
- Check logs in Creao dashboard
- Review database for data consistency
- Test API endpoints directly with curl
- Enable debug logging: `NODE_ENV=development`

## ✅ Deployment Checklist

Before going live:

**Backend:**
- [ ] Database schema executed successfully
- [ ] All environment variables configured
- [ ] Health check endpoint returning OK
- [ ] Email sending tested and working
- [ ] JWT authentication working
- [ ] API endpoints tested with Postman/curl

**Frontend:**
- [ ] Built successfully (`npm run build`)
- [ ] API URL configured correctly
- [ ] Can sign up new user
- [ ] Can log in
- [ ] Can create monthly audit
- [ ] Can view dashboard
- [ ] Can invite team member

**Security:**
- [ ] SSL/HTTPS enabled
- [ ] Strong JWT_SECRET set
- [ ] Database firewall configured
- [ ] CORS restricted to frontend domain
- [ ] Environment variables not in code

**Monitoring:**
- [ ] Error logging enabled
- [ ] Database backups scheduled
- [ ] Performance monitoring active

---

**You're now running a production-ready, multi-tenant SaaS application!** 🎉

Next steps:
1. Add billing (Stripe/Paddle) when ready
2. Market to clinics
3. Gather feedback and iterate
4. Scale as you grow

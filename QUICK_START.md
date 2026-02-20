# ⚡ Quick Start Guide - Get Running in 15 Minutes

This guide gets your Clinic Audit SaaS running locally for testing/development.

## ⏱️ Prerequisites (5 minutes)

### 1. Install Required Software

**macOS:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js & PostgreSQL
brew install node postgresql
brew services start postgresql
```

**Windows:**
```bash
# Download and install:
# - Node.js LTS: https://nodejs.org/
# - PostgreSQL: https://www.postgresql.org/download/windows/
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Verify Installations

```bash
node --version   # Should be v18+ or v20+
npm --version    # Should be v9+ or v10+
psql --version   # Should be v14+ or v15+
```

---

## 🗄️ Database Setup (3 minutes)

### 1. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE clinic_audit_saas;

# Exit psql
\q
```

### 2. Load Schema

```bash
# From the clinic-audit-saas/ directory
psql clinic_audit_saas < DATABASE_SCHEMA.sql
```

### 3. Verify

```bash
psql clinic_audit_saas -c "\dt"
# Should show 10 tables
```

---

## 🔧 Backend Setup (4 minutes)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env (use nano, vim, or any text editor)
nano .env
```

**Minimal .env for local testing:**
```env
DATABASE_URL=postgresql://localhost:5432/clinic_audit_saas
JWT_SECRET=your-random-secret-key-at-least-32-characters-long
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email (optional for testing, required for invites)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@clinicaudit.com
FROM_NAME=Clinic Audit
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start Backend

```bash
npm start
```

**Expected output:**
```
🚀 Clinic Audit SaaS API running on port 3001
📊 Environment: development
🌐 Health check: http://localhost:3001/health
```

### 4. Test Backend

Open new terminal:
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

✅ Backend is running!

---

## 🎨 Frontend Setup (3 minutes)

**Open new terminal** (keep backend running)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
# Create .env file
echo "REACT_APP_API_URL=http://localhost:3001/api" > .env
```

### 3. Start Frontend

```bash
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view clinic-audit-saas-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

Browser should auto-open to `http://localhost:3000`

✅ Frontend is running!

---

## 🎯 Test Your Setup

### 1. Create First Account

1. Navigate to `http://localhost:3000/signup`
2. Fill form:
   - **Email:** `admin@test.com`
   - **Password:** `password123`
   - **First Name:** `Admin`
   - **Last Name:** `User`
   - **Clinic Name:** `Test Clinic`
   - **Location:** `San Francisco` (optional)
3. Click "Sign Up"
4. Should redirect to dashboard

✅ Account created!

### 2. Set Goals

1. Navigate to "Goals" tab
2. Set:
   - **Revenue Goal:** `100000`
   - **Profit Margin Goal:** `30`
   - **Capacity Goal:** `80`
3. Click "Save"

✅ Goals configured!

### 3. Enter First Month

1. Navigate to "Data Entry" tab
2. Select current month (e.g., 2025-02)
3. Fill sample data:
   - **Revenue:** `85000`
   - **Operating Expenses:** `20000`
   - **COGS:** `5000`
   - Click "+ Add Employee" → Name: `Dr. Smith`, Amount: `8000`
   - Click "+ Add Service" → Name: `Chiropractic`, Hours: `160`, Booked: `120`, Revenue: `50000`
   - **Website Visits:** `1000`
   - **Website Conversion Rate:** `2` (means 2%)
   - **New Client Visits:** `25`
   - **Clients Converting to Treatment:** `15`
   - **Total Clients:** `100`
   - **Total Appointments:** `350`
4. Click "Save & View Dashboard"

✅ First month created!

### 4. View Dashboard

Should see:
- KPI cards (Revenue, Profit, etc.)
- Client funnel visualization
- Performance scores (0-100 total)
- Recommendations

✅ App working perfectly!

### 5. Test Team Invitation (Optional)

**Note:** Requires email configured in backend .env

1. Navigate to "Team" tab (admin only)
2. Click "Invite Team Member"
3. Enter:
   - **Email:** `teammate@test.com`
   - **Role:** `Member`
4. Click "Send Invitation"
5. Check email inbox
6. Click invitation link
7. Create account
8. Verify joined your clinic

✅ Team collaboration working!

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `Database connection failed`
```bash
# Check PostgreSQL is running
pg_isready

# If not running:
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Check Services app
```

**Error:** `Port 3001 already in use`
```bash
# Kill process on port 3001
# macOS/Linux:
lsof -ti:3001 | xargs kill -9

# Windows:
netstat -ano | findstr :3001
taskkill /PID [process_id] /F
```

### Frontend won't start

**Error:** `Port 3000 already in use`
```bash
# Option 1: Use different port
PORT=3001 npm start

# Option 2: Kill process
# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

**Error:** `Cannot connect to API`
- Verify backend is running on port 3001
- Check `REACT_APP_API_URL` in frontend/.env
- Check browser console for CORS errors

### Database issues

**Error:** `role "postgres" does not exist`
```bash
# Create postgres user
createuser -s postgres
```

**Error:** `peer authentication failed`
```bash
# Edit pg_hba.conf to use md5 instead of peer
# Find file: pg_config --sysconfdir
# Change: local all all peer → local all all md5
# Restart PostgreSQL
```

---

## 🎉 Success!

You now have:
- ✅ Multi-tenant database running
- ✅ Secure API server running
- ✅ React frontend running
- ✅ Full authentication working
- ✅ Sample clinic created
- ✅ Ready to test all features

---

## 🚀 Next Steps

### For Development
1. **Make changes** to code
2. **Auto-reload** is enabled (both backend and frontend)
3. **Test features** as you build
4. **Check browser console** for errors

### For Production
1. **Follow deployment guide:** See `DEPLOY_TO_CREAO.md`
2. **Configure production database**
3. **Set production environment variables**
4. **Build frontend:** `npm run build`
5. **Deploy to cloud** (Creao/Heroku/AWS)

---

## 📚 Learn More

- **Full documentation:** `README.md`
- **Deployment guide:** `DEPLOY_TO_CREAO.md`
- **Frontend details:** `FRONTEND_GUIDE.md`
- **Package overview:** `PACKAGE_SUMMARY.md`

---

## ⏰ Time Breakdown

- Prerequisites: 5 min
- Database setup: 3 min
- Backend setup: 4 min
- Frontend setup: 3 min
- **Total: ~15 minutes** ⚡

---

**You're up and running! Start building your SaaS business! 🎉**

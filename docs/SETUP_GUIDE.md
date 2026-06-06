# SYNCOPTRAC — Complete Setup Guide

## Project Structure

```
coaching-cms/
├── backend/                    # Node.js + Express API
│   ├── models/
│   │   ├── Admin.js            # Admin account model
│   │   ├── Institute.js        # Institute account + billing model
│   │   └── Lead.js             # Website contact form leads
│   ├── routes/
│   │   ├── auth.js             # Login routes (admin + institute)
│   │   ├── admin.js            # Admin CRUD: institutes, leads, dashboard
│   │   ├── institute.js        # Institute profile routes
│   │   ├── sheets.js           # Proxy routes → Google Apps Script
│   │   └── leads.js            # Public contact form submission
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── server.js               # Express app entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # Next.js + Tailwind CSS
│   ├── pages/
│   │   ├── index.js            # Homepage
│   │   ├── services.js         # Services page
│   │   ├── pricing.js          # Pricing page
│   │   ├── about.js            # About page
│   │   ├── contact.js          # Contact / lead capture page
│   │   ├── admin/
│   │   │   ├── login.js        # Admin login
│   │   │   ├── dashboard.js    # Admin dashboard
│   │   │   ├── institutes.js   # Institute management
│   │   │   └── leads.js        # Lead management
│   │   └── institute/
│   │       ├── login.js        # Institute login
│   │       ├── dashboard.js    # Institute dashboard
│   │       ├── students.js     # Student management
│   │       ├── attendance.js   # Attendance marking + history
│   │       ├── fees.js         # Fee management
│   │       └── enquiries.js    # Enquiry management
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.js       # Public site navbar
│   │   │   ├── Footer.js       # Public site footer
│   │   │   ├── AdminLayout.js  # Admin sidebar layout
│   │   │   └── InstituteLayout.js # Institute sidebar layout
│   │   └── ui/
│   │       ├── Modal.js        # Reusable modal
│   │       └── StatCard.js     # Dashboard stat card
│   ├── lib/
│   │   └── api.js              # Axios client + auth helpers
│   └── styles/
│       └── globals.css         # Tailwind + custom CSS
│
└── apps-script/
    └── Code.gs                 # Google Apps Script (all CRUD + email)
```

---

## Step 1 — Google Sheets Setup

### 1A. Create a Google Sheet for each institute

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: `[Institute Name] - SYNCOPTRAC`
4. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

The Apps Script will automatically create these 4 sheets on first use:
- **Students** — Student records
- **Attendance** — Daily attendance
- **Fees** — Fee tracking
- **Enquiries** — Enquiry pipeline

### 1B. Set up Google Apps Script

1. In the Google Sheet, go to **Extensions → Apps Script**
2. Delete all existing code
3. Paste the entire contents of `apps-script/Code.gs`
4. Click **Save** (Ctrl+S)

### 1C. Initialize the sheets

1. In Apps Script editor, select function `setupSheets` from the dropdown
2. Click **Run**
3. Grant permissions when prompted (allow Gmail + Sheets access)
4. You should see "Setup complete!" in the logs

### 1D. Deploy as Web App

1. Click **Deploy → New Deployment**
2. Choose type: **Web App**
3. Settings:
   - Description: `SYNCOPTRAC API`
   - Execute as: **Me**
   - Who has access: **Anyone** (or "Anyone with Google Account" for extra security)
4. Click **Deploy**
5. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycbXXXXXXXXX/exec
   ```
6. You'll need this URL when creating an institute in the admin panel

> ⚠️ Every time you modify the Apps Script code, you must create a **New Deployment** (not update existing) or the old version will keep running.

---

## Step 2 — Backend Setup

### 2A. Install dependencies

```bash
cd backend
npm install
```

### 2B. Create .env file

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coachingcms
JWT_SECRET=your-super-secret-key-minimum-32-characters
FRONTEND_URL=https://your-frontend.vercel.app
SMTP_USER=syncoptrac@gmail.com
SMTP_PASS=your-gmail-app-password
ADMIN_EMAIL=syncoptrac@gmail.com
PORT=5000
```

#### Getting Gmail App Password:
1. Go to your Google Account → Security
2. Enable 2-Factor Authentication
3. Search "App passwords"
4. Create one for "Mail" → "Other (Custom name)"
5. Use the 16-character password generated

### 2C. Create MongoDB Database

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Get the connection string
5. Replace `username` and `password` in your MONGODB_URI

### 2D. Create the first admin account

Start the server, then make a one-time POST request:

```bash
# Start server
npm run dev

# Create admin (only works if no admin exists yet)
curl -X POST http://localhost:5000/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"syncoptrac@gmail.com","password":"YourSecurePassword123"}'
```

### 2E. Run locally

```bash
npm run dev
# Server runs on http://localhost:5000
```

---

## Step 3 — Frontend Setup

### 3A. Install dependencies

```bash
cd frontend
npm install
```

### 3B. Create .env.local file

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
```

### 3C. Run locally

```bash
npm run dev
# Frontend runs on http://localhost:3000
```

---

## Step 4 — Testing Locally

1. Backend running on `http://localhost:5000`
2. Frontend running on `http://localhost:3000`
3. Login at `http://localhost:3000/admin/login`
4. Use the credentials you set in Step 2D

### Create a test institute:
1. Login as admin
2. Go to Institutes → Add Institute
3. Fill in institute details
4. Add the Google Sheet ID and Apps Script URL from Step 1
5. Copy the generated Login ID and Password
6. Test institute login at `/institute/login`

---

## Step 5 — Deployment

### Backend → Render

1. Push backend code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add all environment variables from `.env`
6. Click Deploy
7. Copy the Render URL (e.g., `https://coachcms-api.onrender.com`)

### Frontend → Vercel

1. Push frontend code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Settings:
   - Root Directory: `frontend`
   - Framework Preset: Next.js
5. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` = your WhatsApp number with country code
6. Click Deploy

### Update CORS

After deploying frontend, update the backend `.env` on Render:
```env
FRONTEND_URL=https://your-project.vercel.app
```

---

## Step 6 — Security Checklist

- [ ] JWT_SECRET is at least 32 random characters
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Admin setup endpoint only works once (no admin exists)
- [ ] All API routes use JWT authentication
- [ ] Institute data is isolated — each institute only sees its own Google Sheet
- [ ] Passwords are bcrypt hashed (12 rounds)
- [ ] CORS is restricted to frontend URL only

---

## How the System Works

```
[Institute User]
      ↓ Login
[Frontend (Vercel)]
      ↓ JWT Token
[Backend API (Render)]
      ↓ Fetch data
[Google Apps Script Web App]
      ↓ Read/Write
[Google Sheets]

[Admin]
      ↓ Login
[Frontend]
      ↓ JWT Token
[Backend API]
      ↓ Read/Write
[MongoDB Atlas]  ← stores: Institute accounts, Leads, Admin accounts
```

---

## Email Templates (Apps Script)

The Apps Script sends 3 types of emails via Gmail:

| Type | Trigger | To |
|------|---------|-----|
| `absentee` | "Send Absent Reminders" button | Student/Parent email |
| `feeReminder` | "📧" button on Fees page | Student/Parent email |
| `enquiryResponse` | "📧" button on Enquiries page | Enquiry email |

To customize templates, edit the `EMAIL_TEMPLATES` object in `Code.gs` and redeploy.

---

## Troubleshooting

### "Apps Script error: 401"
→ The Apps Script Web App isn't set to "Anyone" access. Redeploy with correct settings.

### "Apps Script error: 302"  
→ Redirect following issue. Make sure `redirect: 'follow'` is in the fetch options (already set in `sheets.js`).

### Students not appearing
→ Check the Google Sheet ID is correct. Sheet must be shared with the Apps Script owner's Google account.

### Email not sending
→ 1) Check Gmail App Password is correct. 2) Make sure "Less secure app access" is not needed (use App Passwords instead). 3) Verify the Apps Script has Gmail permission granted.

### "Invalid token" on login
→ JWT_SECRET must be the same in `.env` and on Render. Restart the server after changing.

---

## API Reference

### Auth
| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/api/auth/admin/login` | `{username, password}` | None |
| POST | `/api/auth/institute/login` | `{loginId, password}` | None |
| GET | `/api/auth/verify` | — | Bearer |

### Admin
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/admin/dashboard` | Admin JWT |
| GET | `/api/admin/institutes` | Admin JWT |
| POST | `/api/admin/institutes` | Admin JWT |
| PUT | `/api/admin/institutes/:id` | Admin JWT |
| DELETE | `/api/admin/institutes/:id` | Admin JWT |
| PATCH | `/api/admin/institutes/:id/reset-password` | Admin JWT |
| GET | `/api/admin/leads` | Admin JWT |
| PATCH | `/api/admin/leads/:id` | Admin JWT |

### Sheets (Institute)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/sheets/students` | Institute JWT |
| POST | `/api/sheets/students` | Institute JWT |
| PUT | `/api/sheets/students/:id` | Institute JWT |
| DELETE | `/api/sheets/students/:id` | Institute JWT |
| GET | `/api/sheets/attendance?date=DD/MM/YYYY` | Institute JWT |
| POST | `/api/sheets/attendance` | Institute JWT |
| GET | `/api/sheets/fees` | Institute JWT |
| PUT | `/api/sheets/fees/:studentId` | Institute JWT |
| GET | `/api/sheets/enquiries` | Institute JWT |
| POST | `/api/sheets/enquiries` | Institute JWT |
| PUT | `/api/sheets/enquiries/:id` | Institute JWT |
| POST | `/api/sheets/send-email` | Institute JWT |
| GET | `/api/sheets/dashboard-summary` | Institute JWT |

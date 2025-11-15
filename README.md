<h1 align="center">🦷 Medibook – Doctor Appointment Booking Platform with AI Voice Agent 🦷</h1>



**Medibook** is a comprehensive doctor appointment booking platform that allows patients to book appointments with doctors, get AI-powered dental advice, and manage their healthcare appointments seamlessly.

Highlights:

- 🏠 Modern Landing Page with gradients & images
- 🔐 Authentication via Clerk (Google, GitHub, Email & Password)
- 🔑 Email Verification (6-digit code)
- 📅 Doctor Appointment Booking System
- 🦷 3-Step Booking Flow (Doctor → Service & Time → Confirm)
- 📩 Email Notifications for Doctor Appointments (Nodemailer)
- 📊 Admin Dashboard for Managing Doctor Appointments
- 👨‍⚕️ Role-Based Access Control (Patient, Doctor, Admin)
- 🗣️ AI Voice Agent powered by Vapi
- 📂 PostgreSQL for Data Persistence
- 🎨 Styling with Tailwind CSS + Shadcn
- ⚡ Data Fetching with TanStack Query
- 🤖 CodeRabbit for PR Optimizations
- 🧑‍💻 Git & GitHub Workflow (branches, PRs, merges)
- 🚀 Deployment on Sevalla (free-tier friendly)

---

## 🧪 .env Setup

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

DATABASE_URL=your_postgres_database_url

NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key

ADMIN_EMAIL=your_admin_email

# SMTP Configuration for Nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user_email
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=Medibook <your_smtp_user_email>

NEXT_PUBLIC_APP_URL=your_app_url

```

## Run the app

```bash
1- npm install
2- npm run dev
```

# 🚀 Billflow 2.0 — AI-Powered SaaS Subscription & Revenue Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB%20Atlas-Cloud-47A248.svg)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-Orange%20Theme-f97316.svg)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test%20Gateway-02042B.svg)](https://razorpay.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Intelligence-8E75C2.svg)](https://ai.google.dev/)

A modern, production-ready, full-stack SaaS Subscription Management, Recurring Billing, and Revenue Intelligence platform built with high performance, enterprise security, and an **Orange (`#f97316`)** design system inspired by Stripe, Linear, and Vercel.

---

## 🎨 Design System & UI Highlights

- **Brand Theme:** Signature Vibrant Orange (`#f97316` / `orange-500` / `orange-600`) with smooth glassmorphism and subtle glows.
- **Theme Support:** 100% Dark and Light mode toggle with persistent state across pages.
- **Micro-Interactions:** Smooth Framer-like transitions, animated metric cards, interactive Recharts graphs, and responsive tables.
- **Responsive Layout:** Optimized for mobile phones, tablets, laptops, and ultra-wide desktop monitors.

---

## 🔑 Demo Accounts & Pre-Seeded Logins

All accounts have pre-configured passwords: `Password@123`. Clickable 1-click login buttons are also available on the `/login` screen.

| Role | Email | Password | Details & Status |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@subflow.io` | `Password@123` | Master system control, revenue analytics, staff admin, AI settings |
| **Staff Member** | `staff@subflow.io` | `Password@123` | Billing analyst, customer management, invoice generator, refund processor |
| **Customer 1** | `acme@corp.com` | `Password@123` | **Enterprise Tier (Active, INR)** — 8 seats, multiple recurring invoices |
| **Customer 2** | `jane@novatech.io` | `Password@123` | **Professional Tier (Active, INR)** — 5 seats + Webhook API Mesh Add-on |
| **Customer 3** | `ryan@growthscale.co` | `Password@123` | **At-Risk Customer (Past Due, INR)** — High churn score (74%), failed retry |
| **Customer 4** | `elena@apexfin.com` | `Password@123` | **Enterprise Scale Tier (Active, USD)** — Annual commitment ($5,652/yr) |
| **Customer 5** | `vikram@cloudmatrix.dev` | `Password@123` | **In Grace Period (INR)** — 4 days remaining in grace period + AI Addon |
| **Customer 6** | `david@zephyrstudio.design` | `Password@123` | **14-Day Free Trial (EUR)** — Trial active (€0 initial invoice) |

---

## ✨ Key Feature Modules

### 1. Secure Authentication & Email OTP Verification
- **Two-Step Registration with 6-Digit OTP:** Upon registration, a 6-digit numeric OTP code is generated, sent via Nodemailer email template, and verified before account activation.
- **Demo Quick-Fill Helper:** In test environments, a 1-click helper badge auto-populates the OTP for seamless evaluations.
- **Google OAuth Login:** One-click Google Sign-in simulation with instant profile creation.
- **Role-Based Access Control (RBAC):** Strict isolation between `super_admin`, `staff`, and `customer`. Customers can never view another customer's invoices or subscriptions.
- **Audit Logging:** Every login, registration, password update, and permission change is recorded in the immutable audit trail.

### 2. Profile Photo & Avatar Manager
- **Photo Upload:** Upload local image files (JPG, PNG, WebP) with instant preview and Cloudinary CDN cloud integration.
- **Curated Avatar Gallery:** 8 high-resolution persona avatars for instant 1-click selection.
- **Direct Image URL Option:** Paste custom image links with live preview.
- **Integrated Profile Settings:** Accessible both from the top navbar user dropdown and the customer self-service settings view.

### 3. Products, Variants & Tiered Pricing Plans
- Full CRUD operations on products, variants, and plans.
- Flexible billing frequencies: **Daily**, **Weekly**, **Monthly**, and **Yearly**.
- Multi-currency pricing in **INR (₹)**, **USD ($)**, and **EUR (€)**.
- Team and seat-based plans with customizable per-seat pricing and minimum seat limits.
- Plan upgrade and downgrade pathways with automatic proration calculation.

### 4. Advanced Subscription Lifecycle Management
- Unique, human-readable IDs (`SUB-2026-XXXX`).
- Lifecycle status state machine: `active`, `paused`, `in_grace_period`, `past_due`, `trialing`, `cancelled`, and `expired`.
- **Automated Lifecycle Controls:** One-click Pause, Resume, Renew, Upgrade, Downgrade, and Cancel with reason tracking.
- Team member invite and seat allocation management.
- Metered usage records tracking API queries, cloud compute hours, and storage.

### 5. Smart Invoicing & GST Tax System
- Automated recurring invoice generation via scheduled cron (`0 0 * * *`).
- Automatic GST (18%) and regional tax computations with line item breakdowns.
- Idempotency keys (`INV-REC-...`) preventing duplicate invoice creation.
- **Server-Side PDF Generation:** Instant vector PDF download using PDFKit with orange-branded headers and itemized tables.
- Discount coupons system: Fixed amount discounts (`ANNUAL50`) and percentage discounts (`SUBFLOW20`, `LOYALTY25`).

### 6. Razorpay Test Payment Gateway
- Complete Razorpay integration for Cards, UPI, Net Banking, and Wallets.
- Server-side order creation and cryptographic HMAC SHA256 signature verification.
- Dunning management with automated payment retry scheduling for failed attempts.
- Refund processing with ledger transaction logging.

### 7. Google Gemini AI Business Intelligence
- **Revenue Forecasting:** 6-month predictive revenue projection with statistical upper/lower confidence bounds and CAGR analysis.
- **Customer Churn Risk Scoring:** Algorithmic and Gemini-based churn risk categorization (`Low`, `Medium`, `High`) with root-cause factors.
- **AI Business Copilot Chatbot:** Real-time conversational financial assistant answering queries about MRR, ARR, overdue accounts, and marketing retention tactics.
- **Smart Retention Offers:** Targeted discounts dynamically suggested for at-risk accounts based on lifetime value.

### 8. Real-Time Analytics & Renewal Calendar
- Central metrics: Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), Lifetime Value (LTV), Churn Rate, Collection Velocity.
- Interactive Recharts charts for 12-month revenue trajectory, cohort comparisons, and top-performing plans.
- Visual monthly renewal calendar showing upcoming renewals, grace periods, and overdue collections.
- Export options: Export reports to **PDF**, **Excel/CSV**, and **JSON**.

---

## 🛠️ Technology Stack

```
Subscription_Management_System/
├── server/                     # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/             # MongoDB Atlas connection & environment
│   │   ├── controllers/        # 15 REST controllers (Auth, Subscriptions, AI, etc.)
│   │   ├── middleware/         # JWT Auth, RBAC, Audit Logging, Rate Limiter
│   │   ├── models/             # 19 Mongoose Schemas & Database Indexes
│   │   ├── routes/             # Express API routes
│   │   ├── seed/               # Database seeder with realistic test records
│   │   └── services/           # Gemini AI, Razorpay, PDFKit, Nodemailer, Cron
│   └── package.json
└── client/                     # Frontend Application (React 18 + Vite + Tailwind CSS)
    ├── src/
    │   ├── components/         # Shared layouts, Header, Sidebar, Modals
    │   ├── context/            # Auth, Theme, Currency, Language, Notifications
    │   ├── pages/
    │   │   ├── admin/          # 13 Admin/Staff Management & Analytics Pages
    │   │   ├── auth/           # Login, Register with OTP, Password Reset
    │   │   └── portal/         # 7 Customer Self-Service Portal Pages
    │   ├── services/           # REST API client & CSV/JSON export utilities
    │   └── types/              # Comprehensive TypeScript interfaces
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or v20+)
- npm or pnpm
- MongoDB Atlas cluster URI (configured in `.env`)

### 1. Backend Setup
```powershell
cd server

# Install dependencies
npm install

# Build TypeScript
npm run build

# Seed database with sample customers, plans & subscriptions
npm run seed

# Start backend server (runs on http://localhost:5001)
npm run start
# Or for live reload during development:
npm run dev
```

### 2. Frontend Setup
```powershell
cd client

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev

# Or compile production bundle:
npm run build
```

---

## 📡 API Endpoint Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new account & dispatch 6-digit email OTP |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP and activate account |
| `POST` | `/api/auth/resend-otp` | Dispatch a fresh OTP code |
| `POST` | `/api/auth/login` | Email/password login returning JWT token |
| `POST` | `/api/auth/upload-avatar` | Upload profile photo to Cloudinary / storage |
| `PUT` | `/api/auth/change-password` | Update account password |
| `GET` | `/api/docs` | Interactive Swagger / OpenAPI 3.0 API Documentation UI |
| `GET` | `/api/docs/spec.json` | OpenAPI 3.0 JSON specification schema |
| `GET` | `/api/analytics/dashboard` | Dashboard MRR, ARR, LTV, Aging Report (0-30, 31-60, 60+ days) & Top Customers |
| `GET` | `/api/ai/revenue-forecast` | 6-Month Gemini AI predictive revenue model |
| `GET` | `/api/ai/churn-prediction` | AI churn risk scoring and customer risk list |
| `POST` | `/api/ai/chat` | AI Business Copilot conversational chatbot (GPT-4o-mini & Gemini) |
| `GET` | `/api/subscriptions` | List subscriptions with filters & pagination |
| `POST` | `/api/subscriptions/:id/preview-proration` | Live calculation of unused credit and net charge for plan switch |
| `POST` | `/api/subscriptions/:id/change-plan` | Upgrade/Downgrade plan with mathematical proration |
| `GET` | `/api/subscriptions/:id/timeline` | Subscription activity event timeline & audit history |
| `POST` | `/api/subscriptions/:id/pause` | Pause an active subscription |
| `POST` | `/api/subscriptions/:id/resume` | Resume a paused subscription |
| `GET` | `/api/invoices` | List invoices with status & search |
| `GET` | `/api/invoices/:id/pdf` | Download itemized GST PDF invoice |
| `POST` | `/api/credit-notes` | Issue Credit Note or refund adjustment on invoices |
| `GET` | `/api/credit-notes` | List credit notes and proration credit records |
| `POST` | `/api/payments/create-order` | Create Razorpay order |
| `POST` | `/api/payments/verify` | Verify payment HMAC signature |
| `POST` | `/api/billing/run-cycle` | Trigger recurring billing cycle (Dunning, renewals & trial expirations) |

---

## 🐳 Docker Deployment & Automated Tests

### Run with Docker Compose
```bash
docker-compose up --build
```
- Backend runs on `http://localhost:5001`
- Frontend runs on `http://localhost:3000`

### Automated Business Logic Test Suite
Run the 14-point automated test suite covering Proration, GST tax split, Dunning retries, and OTP verification:
```bash
cd server
npm test
```

---

## 🔒 Security & Best Practices
- **Password Protection:** Salted hashes generated with bcrypt.
- **API Guard:** Bearer JWT authorization with role verification on every privileged route.
- **Idempotency:** Unique keys on billing cycles ensure subscriptions are never double-charged.
- **Sensitive Data:** Payment card details are never saved directly; transactions rely on gateway tokens and server-verified webhooks.
- **Data Isolation:** Customer API requests automatically scope database queries to `req.user._id`.

---

## 📜 License
MIT License. Built for modern enterprise SaaS subscription workflows.

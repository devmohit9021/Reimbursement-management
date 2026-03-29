# ReimburseHQ — Expense Management System

A modern SaaS web application that enables companies to manage employee expense reimbursements in a fully automated, structured, and transparent way.

## Features
- **Multi-Level Approval Workflows:** Configure percentage-based, specific-user, or hybrid conditional rules for expense approvals.
- **OCR Receipt Parsing:** Auto-fills merchant, date, and amount from uploaded receipt images via Tesseract.js.
- **Dynamic Currency Rate Conversion:** Automatic real-time currency conversion cache integration.
- **Real-Time Analytics Dashboard:** KPI metrics, interactive Recharts, pending workflows queue, and budget analytics.
- **Role-Based Access Control (RBAC):** Distinct dashboards and access scopes for Admins, Managers, and Employees.
- **Premium UI:** Dark mode support, glassmorphism UI components, fluid animations, and mobile-responsive App Shell.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS v4, Lucide Icons, Recharts, React Query
- **Backend:** Node.js, Express v5, Prisma ORM, MySQL
- **Tooling:** Zod (Validation), Sharp (Image Prep), JWT (Auth), BcryptJS

## Getting Started

1. Set up your MySQL database and adjust your connection string in `server/.env`
2. Run database migrations:
   ```bash
   cd server
   npx prisma migrate dev
   ```
3. To seed demo data:
   ```bash
   npm run db:seed
   ```
4. Start development servers:
   ```bash
   # Terminal 1
   cd client
   npm run dev

   # Terminal 2
   cd server
   npm run dev
   ```

## Demo Accounts
If the database was seeded, you can login with: (Password for all: `password123`)
- **Admin:** `admin@acme.com`
- **Manager:** `manager@acme.com`
- **Employee:** `employee@acme.com`

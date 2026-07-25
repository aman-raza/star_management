# Lead Management Platform

A production-ready, security-first Lead Management Platform designed as an internal sales tool. This application enforces granular role-based access control (RBAC), features an append-only lead timeline (Activity Trail) wrapped in database transactions, and includes a public lead capture system.

## 🚀 Key Features

1. **Public Lead Capture**: Unauthenticated public landing page/form validating leads and automatically registering them in the pipeline.
2. **Dynamic Lead Pipeline**: Complete lifecycle flow (`new` → `contacted` → `qualified` → `proposal` → `won` / `lost`).
3. **Granular RBAC**: 
   - **Admin**: Full control to view all leads, assign leads to any member, create team members, and review user activity logs.
   - **Member**: Limited to viewing, editing, and adding notes for leads assigned to them.
4. **Append-Only Timeline**: Notes are immutable. Every status update, lead assignment, and note addition is logged atomically.
5. **Robust Security & Validation**: 
   - Full Zod schemas on API endpoints.
   - Server-side route authorization + Next.js Middleware route guards.

---

## 🛠️ Architecture & Tech Stack Rationale

- **Next.js 14+ (App Router)**: Leverage React Server Components (RSC) for fast loading, API Routes as backend endpoints, and Client Components for dynamic pipeline interaction.
- **NextAuth.js v5 (Auth.js)**: Configured with Credentials Provider, customized session callback to track user ID & role, and JWT token strategy.
- **PostgreSQL & Prisma ORM v7**: 
  - Relational mapping allows clean structure between `User`, `Lead`, `Note`, and `ActivityLog`.
  - Used Prisma Transactions (`$transaction`) inside services to enforce data integrity (e.g. logging activity atomically alongside every lead update).
  - Configured with the new Prisma v7 **Driver Adapters** (`@prisma/adapter-pg` + `pg`) for modern serverless deployment compatibility.

---

## 🔒 Security & Access Control Matrix

| Feature / Action | Admin | Member (Owner) | Member (Non-Owner) | Public |
| :--- | :---: | :---: | :---: | :---: |
| **Submit Public Lead** | ✅ | ✅ | ✅ | ✅ |
| **View Lead Listing** | ✅ (All) | ✅ (Own) | ❌ | ❌ |
| **View Lead Detail** | ✅ | ✅ | ❌ | ❌ |
| **Update Lead Status** | ✅ | ✅ | ❌ | ❌ |
| **Assign/Reassign Lead**| ✅ | ❌ | ❌ | ❌ |
| **Add Notes** | ✅ | ✅ | ❌ | ❌ |
| **Manage Users** | ✅ | ❌ | ❌ | ❌ |

---

## 🏃 Local Setup & Run Instructions

### 1. Prerequisites
- Node.js 18+
- npm or pnpm

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
AUTH_SECRET="your-super-secret-auth-secret-key-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Spin Up Local Database & Sync
This project utilizes the experimental **Prisma Postgres** local dev server to provision a Postgres instance directly in your workspace without manual installation:
```bash
# 1. Spin up the local database server in a separate terminal window
npx prisma dev

# 2. Sync database schema
npx prisma db push
```

### 4. Seed Database
Seed the database with sample leads, notes, activities, and user roles (Admin & Members):
```bash
npx tsx prisma/seed.ts
```

**Seed User Credentials:**
- **Admin**: `admin@starmanagement.com` / `admin123!`
- **Member 1**: `alice@starmanagement.com` / `member123!`
- **Member 2**: `bob@starmanagement.com` / `member123!`

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Running the Test Suite
The project includes a comprehensive test suite in `tests/` using **Vitest** to verify role-based permissions and E2E lifecycles.

To run the tests:
```bash
npx vitest run
```

### Test Coverage Highlights:
- **`permissions.test.ts`**: Ensures unauthenticated requests, member limitations, and admin privileges are correctly enforced across all endpoints.
- **`lifecycle.test.ts`**: Simulates the E2E lifecycle: capturing a public lead → admin assigning it → member updating the status → adding notes → verifying the activity log trail matches.

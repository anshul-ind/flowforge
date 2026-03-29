# FlowForge ⚡

A **Multi-Tenant Project Delivery Platform** built with Next.js 16 + React 19.

Manage projects, milestones, and tasks across multiple teams — all in one place.

## Features

- 🏗️ **Multi-Tenant Architecture** — Isolated workspaces per organization with role-based access
- 📋 **Project Management** — Create and track projects with status and progress metrics
- 🏁 **Milestone Tracking** — Break projects into milestones with due dates
- ✅ **Task Management** — Track individual tasks with priority and status
- 🔐 **Authentication** — JWT-based sessions with httpOnly cookies
- ⚡ **Server Actions** — Full-stack mutations using React 19 Server Actions
- 🎨 **Modern UI** — Clean design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Database**: SQLite via Prisma v7 + better-sqlite3 adapter
- **Auth**: JWT sessions with `jose` + bcrypt password hashing
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Database Setup

```bash
# Create the database tables
npx prisma migrate dev

# Seed with sample data
npx tsx prisma/seed.ts
```

> **Note:** If the DB file is empty after `migrate dev`, run:
> ```bash
> sqlite3 prisma/dev.db < prisma/migrations/$(ls prisma/migrations | head -1)/migration.sql
> npx tsx prisma/seed.ts
> ```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Credentials

After seeding, you can sign in with:

| Email | Password | Role |
|-------|----------|------|
| alice@example.com | password123 | Owner |
| bob@example.com | password123 | Member |

Both users are members of the **Acme Corp** workspace (`/acme/dashboard`).

## Project Structure

```
src/
├── app/
│   ├── [tenant]/           # Multi-tenant routes
│   │   ├── layout.tsx      # Tenant sidebar layout
│   │   ├── dashboard/      # Stats overview
│   │   └── projects/       # Project management
│   │       └── [projectId]/
│   │           └── milestones/
│   │               └── [milestoneId]/
│   │                   └── tasks/
│   ├── api/
│   │   ├── [tenant]/       # REST API routes
│   │   └── auth/           # Auth endpoints
│   ├── auth/               # Sign in/up pages
│   └── tenants/            # Workspace management
├── components/             # Reusable UI components
├── generated/prisma/       # Generated Prisma client
├── lib/
│   ├── actions.ts          # Server Actions
│   ├── auth.ts             # Password utilities
│   ├── db.ts               # Prisma client singleton
│   └── session.ts          # JWT session management
└── proxy.ts                # Next.js 16 request proxy (auth guard)
```

## Architecture

### Multi-Tenancy

Tenants are identified by their URL slug: `/[tenant]/dashboard`. The tenant layout verifies that the authenticated user is a member before rendering any content.

### Authentication Flow

1. User signs up → user record created + personal workspace created
2. User signs in → JWT token set as httpOnly cookie (7-day expiry)
3. `proxy.ts` (Next.js 16's middleware replacement) checks for the session cookie on all protected routes
4. Server components and Server Actions call `getSession()` to verify identity

### Server Actions

All data mutations use React 19 Server Actions (defined in `src/lib/actions.ts`). Forms directly call these actions, which handle validation, database writes, cache revalidation, and redirects.

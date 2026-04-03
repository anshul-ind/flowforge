# 🚀 FlowForge

FlowForge is a multi-tenant project management platform built with modern Next.js.

The goal of this project was to build something close to a real-world SaaS system — where multiple teams can manage projects, tasks, approvals, and collaborate in one place.

---

## 🌐 Live Demo

https://flowforge-ivory.vercel.app

---

## 📸 Screenshots

<img width="1908" height="995" alt="Screenshot 2026-04-03 190349" src="https://github.com/user-attachments/assets/36cd157a-9300-499a-8c3c-82822146c856" />
<img width="1908" height="995" alt="Screenshot 2026-04-03 190349" src="https://github.com/user-attachments/assets/36cd157a-9300-499a-8c3c-82822146c856" />

  


### 🏠 Landing Page

Clean landing page with a simple and focused UI.

### 🔐 Authentication

Basic signup/login flow with validation and error handling.

---

## ✨ Features

* Authentication (Sign up / Sign in)
* Workspace-based multi-tenancy
* Role-based access (Owner, Member, etc.)
* Project and task management
* Comments and collaboration
* Approval workflow system
* Notifications
* Dashboard analytics
* Search and filters
* Optimistic UI updates

---

## 🎯 Why I built this

This project was mainly built to understand how real SaaS products are structured.

I wanted to explore:

* how multi-tenancy works
* how to structure a full-stack app using Next.js
* handling auth, roles, and permissions properly
* building something closer to production instead of just UI projects

---

## 🏗️ Tech Stack

* Next.js 16 (App Router)
* React 19 + TypeScript
* Tailwind CSS + shadcn/ui
* PostgreSQL (Prisma ORM)
* Zod for validation

---

## 🧠 How it’s built

Instead of having a separate backend, everything runs inside Next.js.

* Server Components → for fetching data
* Server Actions → for handling mutations
* Route Handlers → for APIs like search/analytics
* Proxy → for auth and route protection
* Prisma → database layer

---

## 📁 Project Structure (simplified)

```bash
app/
components/
lib/
prisma/
modules/
```

Nothing fancy — just tried to keep things organized and scalable.

---

## ⚙️ Running locally

### 1. Clone

```bash
git clone https://github.com/anshul-ind/flowforge.git
cd flowforge
```

### 2. Install

```bash
npm install
```

### 3. Add env file

Create `.env`:

```env
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup DB

```bash
npx prisma generate
npx prisma migrate dev
```

Make sure your database is running.

### 5. Start

```bash
npm run dev
```

---

## 🔐 Some things I focused on

* Keeping tenant data isolated (workspaces)
* Not relying only on frontend for permissions
* Validating everything on server
* Avoiding over-complication while still keeping structure clean

---

## ⚡ Key flows

* Creating tasks → handled via server actions
* Comments → optimistic UI (instant feedback)
* Approvals → tracked and logged properly

---

## 📚 What I learned

* Structuring a real full-stack app (not just UI)
* Working with Next.js App Router properly
* Designing RBAC systems
* Managing state with server actions
* Thinking in terms of system design, not just components

---

## 🚀 Deployment

Deployed on Vercel.

---

## 🤝 Contributors

* Anshul Chouhan
* Vedansh Wagh

---

## 📌 Future plans

* Add real-time updates
* Improve notifications
* Add file uploads
* Explore AI-based task suggestions

---

## 📄 License

MIT License

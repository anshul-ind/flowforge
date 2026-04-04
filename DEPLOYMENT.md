# FlowForge deployment guide — same-machine Next.js + PostgreSQL

This document is for running FlowForge where **Node (Next.js)** and **PostgreSQL** run on **the same machine** — either a **Windows Server or Windows PC** (dev/staging/production) or a **Linux VPS**. No external managed database is required.

---

## 1. Root cause (why auth “breaks” after deploy)

- **`127.0.0.1` / `localhost` always means “this machine.”** On your laptop it is that laptop; on a deployed server it is **only that server**. There is no automatic link to another computer’s Postgres.
- **Credentials auth** uses Prisma to read/write `User` rows. If Prisma cannot connect to Postgres, you get **`P1001`** (or similar) and sign-in/sign-up fail.
- **Fix:** Run Postgres on the **same host** as the Next.js process and set **`DATABASE_URL`** to that instance (typically `127.0.0.1:5432`).

---

## 2. Recommended low-resource architecture

| Layer | Linux VPS | Windows (Server or PC) |
|--------|-----------|-------------------------|
| Host | One Linux VPS | One Windows machine |
| Database | PostgreSQL (apt/Docker) on host | PostgreSQL (installer or Docker) on **same** Windows machine |
| App | `npm run build` → `npm run start` | Same; use **PowerShell** or **cmd** |
| Process manager | systemd, PM2 | Windows **Service**, **PM2** (Windows), **NSSM**, or **Task Scheduler** |
| Migrations | `npm run build` runs `prisma migrate deploy` | Same |
| Config | `.env` or systemd env | **`.env`** in project root (or system env vars) |

---

## 3. Windows — PostgreSQL + FlowForge (same machine)

### 3.1 Install PostgreSQL on Windows

**Option A — Installer (common)**

1. Download PostgreSQL for Windows from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/) (or use the EDB installer).
2. Run the installer. Note the **port** (default **5432**) and **superuser password** (often user `postgres`).
3. Finish install; the **`postgresql-x64-…`** **Windows Service** should be **Running** (`services.msc` → verify).

**Option B — Winget (if available)**

```powershell
winget install PostgreSQL.PostgreSQL
```

Adjust service name and `psql` path if the installer puts them under `C:\Program Files\PostgreSQL\<version>\bin\`.

**Option C — Docker on Windows**

If you use Docker Desktop, you can run Postgres in a container; then `DATABASE_URL` must use the **mapped host port** (e.g. `127.0.0.1:5432`). FlowForge stays on the host; only Postgres is in Docker.

### 3.2 Verify Postgres is listening

**PowerShell:**

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 5432
```

`TcpTestSucceeded : True` means something is accepting connections on that port.

From the repo root you can also run:

```powershell
.\scripts\check-postgres-windows.ps1                             # normal
powershell -ExecutionPolicy Bypass -File .\scripts\check-postgres-windows.ps1   # if execution policy blocks scripts
```

### 3.3 Create database user and database

Open **SQL Shell (psql)** from the Start Menu *or* run `psql` from the PostgreSQL `bin` folder (adjust version path):

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```

In `psql`, run (replace the password):

```sql
CREATE USER flowforge WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE flowforge OWNER flowforge;
GRANT ALL PRIVILEGES ON DATABASE flowforge TO flowforge;
\c flowforge
GRANT ALL ON SCHEMA public TO flowforge;
GRANT ALL ON ALL TABLES IN SCHEMA public TO flowforge;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO flowforge;
\q
```

You can do the same from **pgAdmin** (GUI) if you prefer.

### 3.4 App environment on Windows

In the FlowForge project folder (same folder as `package.json`), create **`.env`** or **`.env.local`** (local dev often uses `.env.local`; Next.js loads both — do **not** commit secrets):

```env
DATABASE_URL="postgresql://flowforge:choose-a-strong-password@127.0.0.1:5432/flowforge"
AUTH_SECRET="paste-output-of-openssl-or-generate-below"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate `AUTH_SECRET` in PowerShell:**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

Or use OpenSSL if installed: `openssl rand -base64 32`

**Important on Windows:** `localhost` / `127.0.0.1` here means **this Windows machine** — the same place PostgreSQL must be running.

### 3.5 Prisma and build (Windows)

From the repository root in **PowerShell**:

```powershell
cd C:\path\to\flowforge
npm install
npm run build
```

`npm run build` runs: **`prisma migrate deploy`** → **`prisma generate`** → **`next build`**.  
You need **`DATABASE_URL`** set (via `.env.local` / `.env`) so `migrate deploy` can reach Postgres.

### 3.6 Run the production server (Windows)

```powershell
npm run start
```

Default URL: **http://localhost:3000**  
Another port:

```powershell
$env:PORT = "3001"; npm run start
```

Leave this window open, or run under **PM2** / **NSSM** / a **Windows Service** for a long-running deployment.

### 3.7 Windows firewall (only if Postgres is remote)

For **same-machine** FlowForge + Postgres, the app connects to `127.0.0.1` and you usually **do not** need to open PostgreSQL to the LAN. If you intentionally expose Postgres, you must allow TCP **5432** inbound — **not recommended** for simple setups; keep DB on localhost only.

### 3.8 Optional: run Node as a Windows background process

- **PM2** (Windows): `npm install -g pm2` → `pm2 start npm --name flowforge -- start`
- **NSSM**: wrap `node` or `npm` as a service
- **Task Scheduler**: trigger “At startup” to run `npm run start` in the project directory (set “Start in” folder and env vars)

Restart the Node process after changing **`DATABASE_URL`** or **pulling new migrations**.

---

## 4. Linux (VPS) — PostgreSQL + FlowForge (same machine)

### 4.1 Install PostgreSQL

Example Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

### 4.2 Create role and database

```bash
sudo -u postgres psql <<'SQL'
CREATE USER flowforge WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE flowforge OWNER flowforge;
GRANT ALL PRIVILEGES ON DATABASE flowforge TO flowforge;
SQL
sudo -u postgres psql -d flowforge -c 'GRANT ALL ON SCHEMA public TO flowforge;'
```

### 4.3 Confirm port

```bash
sudo ss -lntp | grep 5432
```

### 4.4 Build and start

```bash
export DATABASE_URL="postgresql://flowforge:choose-a-strong-password@127.0.0.1:5432/flowforge"
export AUTH_SECRET="$(openssl rand -base64 32)"
npm run build
npm run start
```

Optional: **PM2** — `pm2 start npm --name flowforge -- start`

---

## 5. Shared configuration reference

### 5.1 Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma + `@prisma/adapter-pg` |
| `AUTH_SECRET` or `NEXTAUTH_SECRET` | Auth.js / NextAuth v5 signing |
| `NEXTAUTH_URL` or `AUTH_URL` | Public origin (e.g. `http://localhost:3000` or `https://app.example.com`) |
| `NEXT_PUBLIC_APP_URL` | Optional; invites and absolute links |

Same-machine example:

```env
DATABASE_URL="postgresql://flowforge:YOUR_PASSWORD@127.0.0.1:5432/flowforge"
```

### 5.2 Prisma: `migrate dev` vs `migrate deploy`

| Command | When |
|---------|------|
| `npx prisma migrate dev` | **Developer PC only** — creates/edits migration files |
| `npx prisma migrate deploy` | **Deploy target** — applies committed migrations (also run inside **`npm run build`**) |
| `npx prisma generate` | Part of **`npm run build`** |

### 5.3 Authentication

Sign-in/sign-up use Prisma to read/write users. **No auth code changes** are needed if the database is reachable and migrated.

---

## 6. Deploy checklist

### Windows

- [ ] PostgreSQL Windows **Service** is **Running**
- [ ] `Test-NetConnection 127.0.0.1 -Port 5432` succeeds
- [ ] Database **`flowforge`** and user **`flowforge`** exist; password matches **`DATABASE_URL`**
- [ ] **`.env`** / **`.env.local`** in project root with **`DATABASE_URL`**, **`AUTH_SECRET`**
- [ ] **`npm run build`** completed without migration errors
- [ ] **`npm run start`** (or PM2/NSSM) running
- [ ] Browser: sign up → sign in OK

### Linux

- [ ] `systemctl status postgresql` active
- [ ] DB/user created; **`DATABASE_URL`** set for shell or systemd/PM2
- [ ] **`npm run build`** then **`npm run start`**
- [ ] Smoke test auth

---

## 7. NPM scripts

| Script | What it does |
|--------|----------------|
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate:deploy` | `prisma migrate deploy` only |
| `npm run build` | `migrate deploy` + `generate` + `next build` |
| `npm run start` / `npm run start:prod` | `next start` |

---

## 8. Local development vs “deployed” machine

| | This PC (Windows/Linux) | Another server |
|---|-------------------------|----------------|
| `localhost` | **This** PC | **That** server only |
| Postgres | Must run **here** for `127.0.0.1` in `DATABASE_URL` | Must run **there** |

---

## 9. Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `Can't reach database server at 127.0.0.1:5432` | PostgreSQL service **stopped** on Windows (check **Services**) or wrong port |
| `P1001` / `DatabaseNotReachable` | Same; or typo in **`DATABASE_URL`** (user/password/db name) |
| `P2021` / missing table | Run **`npm run build`** or **`npm run db:migrate:deploy`** |
| Build fails on `migrate deploy` | `DATABASE_URL` missing in env when running the build |

Server logs: look for **`[flowforge]`**, **`Authentication error`**, **`Signup error`**. User-facing DB hints: **`lib/db/prisma-user-errors.ts`**.

---

## 10. Security notes

- Do not commit **`.env`** / **`.env.local`** with real passwords.
- Prefer Postgres bound to **127.0.0.1** only on the app server; expose **HTTPS** for the Next app, not raw Postgres to the internet.

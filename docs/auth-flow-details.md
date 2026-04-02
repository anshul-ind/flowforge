# Phase-3.5 Auth Flow & Security Model

## Visual Authentication Flows

### Complete Sign-Up Flow

```
┌─────────────────┐
│  Sign-Up Page   │  /sign-up
│ (App Component) │
└────────┬────────┘
         │
         │ User enters email, password, confirm, name
         │ Client UI validation check
         ↓
┌─────────────────────────────────────────┐
│ Browser → POST /api/auth/callback/       │  signUp(formData)
│ FormData → signUp() server action        │  Server asks: Is valid?
└────────┬─────────────────────────────────┘
         │
         │ Validate with signUpSchema (Zod)
         │ - Email format ✓
         │ - Password 8+ chars ✓
         │ - Contains A-Z, a-z, 0-9 ✓
         │ - Passwords match ✓
         ↓
┌─────────────────────────────────────────┐
│ AuthService.signup(validatedData)       │
│ 1. Check email not exists               │
│ 2. bcrypt.hash(password, 10)            │
│ 3. db.user.create(...)                  │
└────────┬─────────────────────────────────┘
         │ 
         │ Return success with user.id
         ↓
┌─────────────────────────────────────────┐
│ Client → signIn("credentials", ...)     │  Auto-sign in
│ Email + password sent to auth endpoint  │
└────────┬─────────────────────────────────┘
         │
         │ NextAuth.js Credentials Provider
         │ authorize() called
         ↓
┌─────────────────────────────────────────┐
│ auth.ts: authorize({email, password})   │
│ 1. db.user.findUnique({where: {email}}) │
│ 2. bcrypt.compare(password, hash)       │
│ 3. Return { id, email, name }           │
└────────┬─────────────────────────────────┘
         │ 
         │ jwt() callback adds user.id to token
         │ session() callback adds id to session
         │
         ↓
┌─────────────────────────────────────────┐
│ Browser gets HTTP-only session cookie   │
│ JWT Token: signed with AUTH_SECRET      │
│ Expires: configured expiry time         │
└────────┬─────────────────────────────────┘
         │
         │ Redirect to /workspace
         ↓
┌─────────────────┐
│  Dashboard      │  User authenticated!
│  /workspace     │
└─────────────────┘
```

### Complete Sign-In Flow

```
┌─────────────────┐
│  Sign-In Page   │  /sign-in
│ (App Component) │
└────────┬────────┘
         │
         │ User enters email, password
         │ Form submitted
         ↓
┌───────────────────────────────────────────┐
│ Browser → signIn("credentials", {...})    │  NextAuth client call
│ { email, password, redirect: false }      │
└────────┬───────────────────────────────────┘
         │
         │ Request to NextAuth endpoint
         │ /api/auth/callback/credentials
         ↓
┌───────────────────────────────────────────┐
│ NextAuth: authorize() in auth.ts          │
│ 1. Validate creds exist                   │
│ 2. db.user.findUnique({email})            │
│ 3. bcrypt.compare(password, pwHash)       │
│ 4. Return user or null                    │
└────────┬───────────────────────────────────┘
         │
         ├─ If password matches:
         │   │
         │   ├─ jwt() callback: Add user.id to token
         │   ├─ session() callback: Add id to session
         │   ├─ Set HTTP-only cookie
         │   └─ Return { error: null, ok: true }
         │
         └─ If password wrong/email not found:
             │
             └─ Return { error: true }
         │
         ↓
┌───────────────────────────────────────────┐
│ Client checks result                      │
│ if (result?.ok) {                         │
│   router.push(callbackUrl)                │
│ } else {                                  │
│   setError("Invalid email or password")   │
│ }                                         │
└────────┬───────────────────────────────────┘
         │
         ↓
     Success or Error
```

### Protected Route Access Flow

```
┌──────────────────────────┐
│ User visits /workspace   │
└──────────┬───────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│ middleware.ts runs FIRST (before page)   │
│ - Check if route is protected            │
│ - Check if request.auth exists           │
└──────────┬───────────────────────────────┘
           │
           ├─ If NOT authenticated:
           │   │
           │   └─ Redirect to /sign-in?callbackUrl=/workspace
           │
           └─ If authenticated:
               │
               └─ Continue to page
                   │
                   ↓
        ┌──────────────────────────────────┐
        │ Page component loads             │
        │ const tenant = await            │
        │   resolveTenantContext(wsId)    │
        └──────┬───────────────────────────┘
               │
               ├─ getSession() → get user
               ├─ db.workspaceMember.findUnique({
               │    userId, workspaceId
               │  })
               │
               ├─ If membership found:
               │   │
               │   └─ Return TenantContext
               │       { userId, workspaceId, role }
               │
               └─ If NOT a member:
                   │
                   └─ Return null
                       │
                       ↓
            ┌────────────────────────┐
            │ Show "Access Denied"   │
            │ or redirect /dashboard │
            └────────────────────────┘
```

---

## Password Hashing & Storage

### Bcrypt Hash Format

```
$2a$10$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUe

 ^^ ^^ 
 |  └─ Cost (10 = 2^10 rounds)
 └─ Algorithm (2a = bcrypt)
 
Random salt + hashed password = bcrypt format
Never stores plain text!
```

### Hashing Process (Sign-Up)

```
User enters: "MyPassword123"
                   ↓
            bcrypt.hash()
            (10 salt rounds)
                   ↓
    "$2a$10$R9h7cIPz0..." (generated)
                   ↓
      Stored in database:
      User {
        email: "user@example.com",
        passwordHash: "$2a$10$R9h7cIPz0..."  ← NOT plain text
      }
```

### Verification Process (Sign-In)

```
User enters: "MyPassword123"
                   ↓
        bcrypt.compare(
          "MyPassword123",
          "$2a$10$R9h7cIPz0..."
        )
                   ↓
    Extracts salt from hash
    Re-hashes input password
    Compares: hash1 === hash2?
                   ↓
         Returns: true/false
                   ↓
         true  → Grant access
         false → Deny access
```

---

## Session & JWT Structure

### JWT Token (Stored in HTTP-Only Cookie)

```
Header
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload
{
  "id": "cuid_user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "iat": 1711800000,        // issued at
  "exp": 1711803600,        // expires in 1 hour
  "iss": "Auth.js",
  "jti": "unique_token_id"
}

Signature
HMAC-SHA256(
  header + payload,
  AUTH_SECRET  // Only server knows this!
)
```

### Session Object (In-Memory)

```typescript
{
  user: {
    id: "cuid_user_123",
    email: "user@example.com",
    name: "John Doe"
  },
  expires: "2024-03-30T02:00:00.000Z"
}
```

### Cookie Configuration

```
Cookie Name: authjs.session-token
Domain: localhost (dev) / yourdomain.com (production)
Path: /
HttpOnly: true          // ← Can't be accessed via JavaScript
Secure: true            // ← Only sent over HTTPS (prod)
SameSite: Lax           // ← CSRF protection
MaxAge: 3600            // ← 1 hour expiry
```

---

## HTTP Status Codes & Error Handling

### Authentication Errors (401)

**Meaning:** "I don't know who you are"

```
User is not authenticated
         ↓
Middleware catches (middleware.ts)
         ↓
Redirect to /sign-in?callbackUrl={original_url}
         ↓
User signs in → Redirected back to original URL
```

**In Code:**
```typescript
if (!session) {
  // 401 Unauthorized
  redirect('/sign-in');
}
```

### Permission Errors (403)

**Meaning:** "I know who you are, but you don't have permission"

```
User is authenticated
         ↓
Not member of workspace
         ↓
Service rejects with ForbiddenError
         ↓
Show error message or redirect to /dashboard
```

**In Code:**
```typescript
const tenant = await resolveTenantContext(workspaceId);
if (!tenant) {
  // 403 Forbidden (user not member)
  throw new ForbiddenError('Access denied');
}
```

### Validation Errors (400)

**Meaning:** "Your input is invalid"

```
Sign-up form submitted
         ↓
Zod schema validation fails
         ↓
Return fieldErrorsResult with specific field errors
         ↓
Client shows field-level error messages
```

**In Code:**
```typescript
{
  success: false,
  fieldErrors: {
    "email": ["Invalid email address"],
    "password": ["Password is too short"]
  }
}
```

---

## Security Architecture

### Threat Model & Mitigations

| Threat | Mitigation | Where |
|--------|-----------|-------|
| Password data breach | bcrypt hashing with salt | modules/auth/service.ts |
| Session hijacking | HTTP-only cookies | auth.ts session config |
| CSRF attacks | SameSite cookies | auth.ts session config |
| Brute force signup | Check email exists | modules/auth/service.ts |
| Cross-tenant access | resolveTenantContext checks | lib/tenant/resolve-tenant.ts |
| Unauthorized mutations | Policy checks in services | modules/*/service.ts |
| SQL injection | ORM (Prisma) parameterized | lib/db/ |
| XSS attacks | React escaping + CSP | app/ (Next.js built-in) |

### Key Security Properties

1. **Passwords never stored**: Only bcrypt hashes in database
2. **Sessions are stateless**: JWT verified by AUTH_SECRET, no DB lookup needed
3. **Cookies are secure**: HTTP-only, Secure, SameSite flags set
4. **Tenant isolation**: Every query scoped to workspace
5. **Authorization checks**: Services enforce permissions before DB access
6. **Error messages are safe**: Don't leak if email exists or password was "almost right"

---

## TypeScript Type Safety

### ActionResult Types

```typescript
// Success response
{
  success: true;
  message?: string;
  data?: T;
}

// Validation error
{
  success: false;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

// Form/general error
{
  success: false;
  formError?: string;
}

// Error with message
{
  success: false;
  message: string;
}
```

### Session Type

```typescript
type Session = {
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
  };
  expires: ISODateString;
} | null;
```

### TenantContext Type

```typescript
type TenantContext = {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;  // OWNER | MANAGER | MEMBER | VIEWER
};
```

---

## Common Patterns

### 1. Requiring Authentication in Server Component

```typescript
import { requireUser } from '@/lib/auth';

export default async function Page() {
  const user = await requireUser();
  // user is guaranteed to exist here, no null check needed
  return <div>Hello {user.email}</div>;
}
```

### 2. Optional Authentication

```typescript
import { getSession } from '@/lib/auth';

export default async function Layout({ children }) {
  const session = await getSession();
  
  return (
    <div>
      {session ? (
        <div>Logged in as {session.user.email}</div>
      ) : (
        <a href="/sign-in">Sign In</a>
      )}
      {children}
    </div>
  );
}
```

### 3. Workspace-Specific Protected Component

```typescript
import { resolveTenantContext } from '@/lib/tenant';

export default async function WorkspacePage({ params }) {
  const tenant = await resolveTenantContext(params.workspaceId);
  
  if (!tenant) {
    return <div>Access denied</div>;
  }
  
  // tenant is guaranteed to exist
  return <div>Workspace: {tenant.workspaceId}</div>;
}
```

### 4. Service Layer Permission Check

```typescript
import { ProjectService } from '@/modules/project/service';
import { resolveTenantService } from '@/lib/tenant/service';

export async function createProject(workspaceId, data) {
  'use server';
  
  const tenant = await resolveTenantService(workspaceId);
  // ↑ Includes both auth + workspace check
  
  const service = new ProjectService(tenant);
  // ↑ Service has tenant context, checks permissions internally
  
  const project = await service.createProject(data);
  // ↑ Throws ForbiddenError if user lacks permission
  
  return { success: true, data: project };
}
```

---

## Database Queries Involved

### During Sign-Up

```sql
-- 1. Check email already exists
SELECT id FROM "User" WHERE email = 'user@example.com' LIMIT 1;

-- 2. Create new user
INSERT INTO "User" (id, email, passwordHash, name, createdAt, updatedAt)
VALUES ('cuid123', 'user@example.com', '$2a$10$...', 'John Doe', now(), now());
```

### During Sign-In

```sql
-- 1. Find user by email
SELECT id, email, name, passwordHash 
FROM "User" 
WHERE email = 'user@example.com' 
LIMIT 1;

-- 2. (In-memory) bcrypt.compare(password, passwordHash)
--    Returns true/false, no DB query
```

### When Accessing Workspace

```sql
-- 1. Get current user ID from JWT session (no DB)

-- 2. Check workspace membership
SELECT role 
FROM "WorkspaceMember" 
WHERE userId = 'user123' AND workspaceId = 'ws456' 
LIMIT 1;

-- 3. If exists, return TenantContext with role
```

---

## Performance Characteristics

| Operation | Time | Bottleneck |
|-----------|------|-----------|
| Bcrypt hash (signup) | ~100-200ms | CPU + salt rounds |
| Bcrypt compare (signin) | ~100-200ms | CPU + salt rounds |
| Session lookup | ~0ms | JWT verified locally |
| Email exists check | ~10-50ms | Database query |
| Workspace membership check | ~10-50ms | Database query |
| Create user in DB | ~20-100ms | Database write |

**Optimization note:** bcrypt is intentionally slow (cost = 10) to prevent brute force attacks. This is correct behavior.

---

## Redis/Caching (Future Enhancement)

Currently not implemented, but could add:

```typescript
// Cache frequently accessed roles
const role = await cache.get(`ws:${workspaceId}:user:${userId}`);
if (!role) {
  const member = await db.workspaceMember.findUnique(...);
  await cache.set(`ws:${workspaceId}:user:${userId}`, member.role, 3600);
}
```

Would significantly speed up `resolveTenantContext()` on high-traffic systems.

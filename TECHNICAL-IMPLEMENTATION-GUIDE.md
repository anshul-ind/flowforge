## 🔧 FLOWFORGE - TECHNICAL IMPLEMENTATION GUIDE

---

## 1️⃣ LANDING PAGE ARCHITECTURE

### File Structure
```
app/(marketing)/
├── page.tsx (Main landing page)
├── layout.tsx (Landing layout with navbar)
└── components/
    ├── hero-section.tsx (Hero with CTAs)
    ├── features-section.tsx (6 feature cards)
    ├── how-it-works.tsx (3-step timeline)
    ├── quote-section.tsx (Testimonial)
    └── cta-banner.tsx (Final CTA)

components/layout/
└── landing-navbar.tsx (Professional navbar)
```

### Hero Section Implementation
```typescript
// Background: Inline gradient instead of absolute div
style={{
  background: 'linear-gradient(135deg, #D3E8FF 0%, #E8F2FF 40%, #F0F6FF 70%, #F5F9FF 100%)'
}}

// Text colors using CSS variables
className="text-primary" // #0A1628 (dark navy)
className="text-secondary" // #3D5A80 (gray)

// CTA Buttons
- Primary: bg-brand text-white (blue button)
- Secondary: border border-primary text-primary (outlined)
```

### Animation Pattern
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Applied with Framer Motion
<motion.div variants={containerVariants} initial="hidden" animate="visible">
```

---

## 2️⃣ AUTHENTICATION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        LANDING PAGE                              │
│  Two CTA Options: ⭐ Personal | 👥 Team Manager                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ Click CTA
                         ▼
     ┌───────────────────────────────────────────┐
     │      SIGN-UP PAGE: ROLE SELECTION          │
     │  Two Cards: Personal | Team Organization   │
     └────────────┬───────────────────────────────┘
                  │ Click Card
                  ▼
     ┌───────────────────────────────────────────┐
     │        SIGN-UP FORM                        │
     │  Name | Email | Password | Confirm         │
     └────────────┬───────────────────────────────┘
                  │ Submit
                  ▼
     ┌───────────────────────────────────────────┐
     │    AuthService.signup(data, userType)     │
     │  - Validate credentials                    │
     │  - Hash password with bcrypt              │
     │  - Create user in DB                      │
     │  - If personal: Create workspace          │
     │  - If team: Normal account (no workspace) │
     └────────────┬───────────────────────────────┘
                  │ Success
                  ▼
     ┌───────────────────────────────────────────┐
     │  Auto Sign-In: signIn("credentials"...)  │
     │  - Get session                            │
     │  - Redirect                               │
     └────────────┬───────────────────────────────┘
                  │
         ┌────────┴──────────┐
         │                   │
    Personal               Team
         │                   │
         ▼                   ▼
    /workspace/       /workspace/new
    (home)            (setup org)
         │                   │
         ▼                   ▼
    ┌─────────────┐   ┌──────────────┐
    │  View Stats │   │ Create Org   │
    │ Create Tasks│   │ Add Members   │
    │Access Analytics
    └─────────────┘   └──────────────┘
```

### Sign-Up Action Implementation
```typescript
// lib/auth/signup-action.ts
export async function signUp(formData: FormData) {
  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
    userType: formData.get('userType') // 'personal' | 'team'
  };

  // Validate with Zod
  const validationResult = await signUpSchema.safeParseAsync(data);
  
  // Call service with userType
  const result = await AuthService.signup(validationResult.data, userType);
  
  return result;
}
```

### AuthService Implementation
```typescript
// modules/auth/service.ts
static async signup(input: SignUpInput, userType: 'personal' | 'team') {
  // 1. Check duplicate email
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email }
  });
  
  // 2. Hash password
  const passwordHash = await bcrypt.hash(input.password, 10);
  
  // 3. Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name
    }
  });
  
  // 4. Auto-create workspace for personal users
  if (userType === 'personal') {
    await prisma.workspace.create({
      data: {
        name: `${input.name}'s Workspace`,
        slug: `${user.id}-personal`,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    });
  }
  
  return successResult({ email: user.email, id: user.id });
}
```

---

## 3️⃣ SMART REDIRECT SYSTEM

### Architecture
```
Sign-In Success
      │
      ▼
callbackUrl = "/workspace/redirects" (instead of "/workspace")
      │
      ▼
┌─────────────────────────────────────────────┐
│  /workspace/redirects/page.tsx               │
│  - Get current user                          │
│  - Query all workspaces where user member   │
│  - Detect user's role in primary workspace  │
│  - Route based on role                       │
└─────┬───────────────────────────────────────┘
      │
      ├─► OWNER ──► redirect(/workspace/[id]/analytics)
      │
      ├─► MANAGER ──► redirect(/workspace/[id])
      │
      ├─► MEMBER ──► redirect(/workspace/[id])
      │
      └─► VIEWER ──► redirect(/workspace/[id])
```

### Implementation
```typescript
// app/workspace/redirects/page.tsx
export default async function RedirectPage() {
  const user = await requireUser();
  
  // Get all workspaces
  const workspaces = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: true }
  });
  
  // If no workspaces, create one
  if (workspaces.length === 0) {
    redirect('/workspace/new');
  }
  
  const primaryWorkspace = workspaces[0];
  
  // Route based on role
  if (primaryWorkspace.role === 'OWNER') {
    redirect(`/workspace/${primaryWorkspace.workspaceId}/analytics`);
  } else {
    redirect(`/workspace/${primaryWorkspace.workspaceId}`);
  }
}
```

---

## 4️⃣ ROLE-BASED ACCESS CONTROL (RBAC)

### Role Hierarchy
```
OWNER
├── Full workspace access
├── Create/edit/delete projects
├── Assign tasks
├── Invite members
├── Manage permissions
├── Access analytics dashboard (EXCLUSIVE)
└── Delete workspace

MANAGER
├── Create/edit projects
├── Assign tasks
├── Manage team members
├── Create tasks
├── View all tasks
└── ❌ No analytics access

MEMBER
├── View assigned tasks
├── Update task status
├── Comment on tasks
├── ❌ Cannot create projects
└── ❌ No analytics access

VIEWER
├── Read-only access
├── View projects and tasks
├── ❌ Cannot make changes
└── ❌ No analytics access
```

### RBAC Matrix Implementation
```typescript
// lib/permissions/rbac.ts
export const RBAC_MATRIX = {
  'create-project': ['OWNER', 'MANAGER'],
  'edit-project': ['OWNER', 'MANAGER'],
  'delete-project': ['OWNER'],
  'create-task': ['OWNER', 'MANAGER', 'MEMBER'],
  'assign-task': ['OWNER', 'MANAGER', 'MEMBER'],
  'approve-task': ['OWNER', 'MANAGER'],
  'view-analytics': ['OWNER'], // EXCLUSIVE
  'invite-member': ['OWNER', 'MANAGER'],
  'manage-roles': ['OWNER'],
  'delete-workspace': ['OWNER']
};

export function requirePermission(
  userRole: Role,
  action: string
): boolean {
  return RBAC_MATRIX[action]?.includes(userRole) ?? false;
}
```

### Protected API Route Example
```typescript
// app/api/analytics/route.ts
export async function GET(request: Request) {
  const user = await requireUser();
  const workspace = await resolveTenantContext(workspaceId, user.id);
  
  // Check if OWNER (only owners can access analytics)
  const member = workspace.members.find(m => m.userId === user.id);
  if (member.role !== 'OWNER') {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Fetch analytics data
  const metrics = await calculateMetrics(workspaceId);
  
  return Response.json(metrics);
}
```

---

## 5️⃣ WORKSPACE & WORKSPACE MEMBER MODELS

### Prisma Schema Pattern
```prisma
model Workspace {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  
  members       WorkspaceMember[]
  projects      Project[]
  tasks         Task[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model WorkspaceMember {
  id            String   @id @default(cuid())
  
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  workspaceId   String
  
  user          User @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId        String
  
  role          Role @default(MEMBER) // OWNER | MANAGER | MEMBER | VIEWER
  
  @@unique([workspaceId, userId])
}

enum Role {
  OWNER
  MANAGER
  MEMBER
  VIEWER
}
```

---

## 6️⃣ ANALYTICS DASHBOARD

### Data Flow
```
/workspace/[id]/analytics
        ↓
  requireUser() 
  resolveTenantContext()
        ↓
  Check if OWNER role
        ↓
  Query metrics from database:
  - COUNT(users in workspace)
  - COUNT(organizations)
  - Calculate on-time delivery rate
  - COUNT(open tasks)
  - Get project health status
        ↓
  Render dashboard with stat cards
  and charts
```

### Protected Page Pattern
```typescript
// app/workspace/[id]/analytics/page.tsx
export default async function AnalyticsPage({ params }) {
  const user = await requireUser();
  const tenant = await resolveTenantContext(workspaceId, user.id);
  
  // Get user's role
  const member = tenant.members.find(m => m.userId === user.id);
  
  // Enforce OWNER-only access
  if (member.role !== 'OWNER') {
    throw new ForbiddenError('Only owners can access analytics');
  }
  
  // Fetch analytics data
  const analytics = await AnalyticsService.getMetrics(workspaceId);
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Users" value={analytics.userCount} />
        <StatCard label="Organizations" value={analytics.orgCount} />
        <StatCard label="On-time Rate" value={analytics.onTimeRate} />
        <StatCard label="Open Tasks" value={analytics.openTasks} />
      </div>
      <ChartsSection data={analytics} />
    </div>
  );
}
```

---

## 7️⃣ COLOR SYSTEM & DESIGN TOKENS

### CSS Variables (in globals.css)
```css
:root {
  /* Light Mode */
  --color-background: #F0F6FF;
  --color-surface: #FFFFFF;
  --color-surface-raised: #F8FBFF;
  --color-text-primary: #0A1628;
  --color-text-secondary: #3D5A80;
  --color-text-muted: #8A9FB1;
  --color-brand: #1A5CDB;
  --color-brand-hover: #1544AA;
  --color-accent: #4D8AFF;
  --color-border: #D0E1F9;
  --color-border-strong: #A8C5F0;
}

[data-theme='dark'] {
  /* Dark Mode */
  --color-background: #060D1A;
  --color-surface: #0E1525;
  --color-text-primary: #E8F2FF;
  --color-text-secondary: #A8C5F0;
  --color-brand: #4D8AFF;
}
```

### Tailwind Config Integration
```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',
        brand: 'var(--color-brand)',
        accent: 'var(--color-accent)',
        border: 'var(--color-border)',
      }
    }
  }
}
```

### Usage in Components
```tsx
// Example: Button
<button className="
  px-6 py-3
  rounded-lg
  font-semibold
  bg-brand text-white
  hover:bg-brand/90
  transition-colors
">
  Click Me
</button>

// Example: Card
<div className="
  rounded-xl
  border border-border
  bg-surface-raised
  p-6
  shadow-sm
">
  <h3 className="text-primary font-bold">Title</h3>
  <p className="text-secondary">Description</p>
</div>
```

---

## 8️⃣ NOTIFICATION & WEBHOOK SYSTEM

### Webhook Flow
```
Task assigned to member
        ↓
trigger webhook
        ↓
/api/webhooks/activity (POST)
        ↓
Verify HMAC signature
        ↓
Check for duplicates (idempotency)
        ↓
Create notification record
        ↓
Send email
        ↓
Send SMS/WhatsApp (if configured)
```

### Implementation
```typescript
// app/api/webhooks/activity/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const signature = request.headers.get('x-webhook-signature');
  
  // Verify HMAC
  const secret = process.env.WEBHOOK_SECRET;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Check for duplicates (idempotency)
  const existing = await prisma.notification.findUnique({
    where: { idempotencyKey: body.idempotencyKey }
  });
  
  if (existing) {
    return new Response('OK', { status: 200 });
  }
  
  // Create notification
  const notification = await prisma.notification.create({
    data: {
      userId: body.userId,
      type: body.type,
      content: body.content,
      idempotencyKey: body.idempotencyKey,
      metadata: body.metadata
    }
  });
  
  // Send email (if enabled)
  if (body.sendEmail) {
    await emailService.send({
      to: user.email,
      subject: body.emailSubject,
      body: body.emailBody
    });
  }
  
  return new Response(JSON.stringify(notification), { status: 201 });
}
```

---

## 9️⃣ INVITATION SYSTEM

### Invite Flow
```
Owner sends invite
        ↓
Generate unique token
        ↓
Store token + user email + workspace
        ↓
Send email with link:
  http://localhost:3000/api/invite/accept?token=XXX
        ↓
Recipient clicks link
        ↓
Token verified + not expired
        ↓
User auto-signed in
        ↓
Added to workspace as MEMBER
        ↓
Redirected to workspace
```

### Implementation
```typescript
// app/api/invite/accept/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  // Verify token
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: true }
  });
  
  if (!invite || invite.expiresAt < new Date()) {
    return redirect('/invite/expired');
  }
  
  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email: invite.email }
  });
  
  if (!user) {
    // Create user if not exists
    user = await prisma.user.create({
      data: {
        email: invite.email,
        // Password can be set later
      }
    });
  }
  
  // Add to workspace
  await prisma.workspaceMember.create({
    data: {
      workspaceId: invite.workspaceId,
      userId: user.id,
      role: 'MEMBER'
    }
  });
  
  // Auto sign-in
  await signIn('credentials', {
    email: user.email,
    redirect: false
  });
  
  // Redirect to workspace
  return redirect(`/workspace/${invite.workspaceId}`);
}
```

---

## 🔟 ERROR HANDLING & VALIDATION

### Pattern: Server Action with Error Handling
```typescript
// lib/actions/example.actions.ts
export async function exampleAction(
  workspaceId: string,
  data: CreateData
): Promise<ActionResult<CreatedObject>> {
  try {
    const user = await requireUser();
    
    // Validate user has permission
    const tenant = await resolveTenantContext(workspaceId, user.id);
    const member = tenant.members.find(m => m.userId === user.id);
    
    if (!requirePermission(member.role, 'create-example')) {
      return errorResult('Insufficient permissions');
    }
    
    // Validate data
    const validated = exampleSchema.safeParse(data);
    if (!validated.success) {
      return fieldErrorsResult(
        validation errors,
        'Validation failed'
      );
    }
    
    // Perform action
    const result = await prisma.example.create({
      data: validated.data
    });
    
    return successResult(result, 'Created successfully');
  } catch (error) {
    console.error('Action error:', error);
    return errorResult('An unexpected error occurred');
  }
}
```

### ActionResult Types
```typescript
// types/action-result.ts
export interface ActionResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
}

// Usage
const result = await exampleAction(...);
if (!result.success) {
  return <div>{result.message}</div>;
}
// Use result.data
```

---

## DEPLOYMENT CHECKLIST

- [ ] Database: Configure production database URL
- [ ] Environment: Set all `.env` variables
- [ ] Authentication: Configure NextAuth callbacks
- [ ] Email: Set up email provider (SendGrid, Resend, etc.)
- [ ] Webhooks: Set WEBHOOK_SECRET
- [ ] Storage: Configure file storage (if needed)
- [ ] CDN: Set up static asset CDN
- [ ] Monitoring: Configure error tracking (Sentry)
- [ ] Analytics: Set up analytics service
- [ ] SSL: Enable HTTPS
- [ ] Rate limiting: Configure rate limiters
- [ ] CORS: Configure if needed
- [ ] Backups: Set up database backups

---

## PERFORMANCE OPTIMIZATION

### Load Time Targets
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1

### Optimizations Applied
- Image optimization (Next.js Image)
- Code splitting per route
- CSS purging
- Minification
- Caching headers
- Lazy loading components
- Database query optimization
- Index on frequently queried fields

### Database Indexes
```prisma
model WorkspaceMember {
  @@index([userId])
  @@index([workspaceId])
  @@uniqueIndex([workspaceId, userId])
}

model Task {
  @@index([workspaceId])
  @@index([projectId])
  @@index([assigneeId])
  @@index([status])
}
```

---

This covers the complete technical implementation! 🚀

## ⚡ FLOWFORGE - QUICK REFERENCE CARD

---

## 🚀 RUNNING THE APPLICATION

```bash
# Start development server
cd c:\flowforge\flowforge
npm run dev

# Visit: http://localhost:3000
```

---

## 🧪 TEST USER FLOWS

### 1️⃣ PERSONAL USER (⭐ Explore FlowForge)
```
Landing → Click "⭐ Explore FlowForge"
      ↓
Sign-Up Form → Name, Email, Password
      ↓
Account Created → Personal workspace auto-created
      ↓
Redirect → /workspace/[id] (workspace home)
      ↓
OUTCOME: User has OWNER role, can access analytics
```

### 2️⃣ ORGANIZATION USER (👥 Join as Team)
```
Landing → Click "👥 Join as Team Manager"
      ↓
Sign-Up Form → Company Name, Email, Password
      ↓
Account Created → No workspace yet
      ↓
Redirect → /workspace/new (create organization)
      ↓
OUTCOME: User creates organization, becomes OWNER
```

### 3️⃣ MANAGER LOGIN
```
Sign-In Page → Email + Password
      ↓
Session Created → Detect user role
      ↓
Smart Redirect → /workspace/redirects
      ↓
Check Role: MANAGER
      ↓
Redirect → /workspace/[id] (workspace home)
      ↓
OUTCOME: Cannot access analytics (403)
```

### 4️⃣ INVITED MEMBER
```
Owner Invites → Email sent to member@company.com
      ↓
Member Clicks Link → /api/invite/accept?token=XXX
      ↓
Token Verified → Auto sign-in
      ↓
Member Added → Added to workspace as MEMBER
      ↓
Redirect → /workspace/[id]
      ↓
OUTCOME: See assigned tasks, can comment
```

---

## 📊 ROLE MATRIX (Quick Reference)

| Action | OWNER | MANAGER | MEMBER | VIEWER |
|--------|:-----:|:--------:|:-------:|:-------:|
| View Workspace | ✅ | ✅ | ✅ | ✅ |
| Create Project | ✅ | ✅ | ❌ | ❌ |
| Create Task | ✅ | ✅ | ✅ | ❌ |
| Assign Task | ✅ | ✅ | ✅ | ❌ |
| Approve Task | ✅ | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ❌ | ❌ | ❌ |
| Invite Members | ✅ | ✅ | ❌ | ❌ |

---

## 🎨 DESIGN TOKENS

**Colors Applied Everywhere:**
- Background: `#F0F6FF` (light blue)
- Primary Text: `#0A1628` (dark navy)
- Secondary Text: `#3D5A80` (gray)
- Brand: `#1A5CDB` (blue)
- Accent: `#4D8AFF` (lighter blue)

**CSS Variable Names:**
```css
var(--color-background)      /* Light blue */
var(--color-primary)          /* Dark navy */
var(--color-secondary)        /* Gray */
var(--color-brand)            /* Blue */
```

**Tailwind Class Names:**
```
bg-background    /* Background color */
text-primary     /* Primary text */
text-secondary   /* Secondary text */
text-muted       /* Muted gray text */
bg-brand         /* Brand blue button */
```

---

## 📁 KEY FILES AT A GLANCE

### Signup & Auth Flow
```
app/(auth)/sign-up/page.tsx .................... Sign-up with role selection
app/(auth)/sign-in/page.tsx .................... Login form
lib/auth/signup-action.ts ...................... Server action for signup
modules/auth/service.ts ........................ Auth business logic
app/workspace/redirects/page.tsx ............... Smart redirect (NEW)
```

### Role & Permissions
```
lib/permissions/rbac.ts ........................ RBAC matrix definition
lib/actions/project.actions.ts ................. Project CRUD with perms
lib/actions/task.actions.ts .................... Task CRUD with perms
```

### Dashboards
```
app/workspace/[id]/page.tsx .................... Workspace home
app/workspace/[id]/analytics/page.tsx ......... Analytics (OWNER only)
app/api/analytics/route.ts .................... Analytics API endpoint
```

### Notifications & Invites
```
app/api/webhooks/activity/route.ts ........... Notification webhook
app/api/invite/accept/route.ts .............. Invite acceptance (NEW)
lib/actions/member.actions.ts .............. Member invite & manage
```

---

## 🔧 COMMON MODIFICATIONS

### Change Hero Section Color
```javascript
// app/(marketing)/components/hero-section.tsx
style={{
  background: 'linear-gradient(135deg, #COLOR1 0%, #COLOR2 100%)'
}}
```

### Add New Role
```typescript
// 1. Update Prisma enum
enum Role {
  OWNER
  MANAGER
  MEMBER
  VIEWER
  CUSTOM    // ← Add here
}

// 2. Update RBAC matrix
export const RBAC_MATRIX = {
  'create-project': ['OWNER', 'MANAGER', 'CUSTOM'],  // ← Add here
  // ...
}
```

### Restrict Page to Role
```typescript
// app/workspace/[id]/special/page.tsx
const member = tenant.members.find(m => m.userId === user.id);
if (member.role !== 'OWNER') {
  throw new ForbiddenError('Owners only');
}
```

### Add New Notification Type
```typescript
// lib/actions/example.actions.ts
// After action:
await prisma.notification.create({
  data: {
    userId: targetUserId,
    type: 'CUSTOM_EVENT',
    content: 'Your event happened',
    metadata: { /* ... */ }
  }
});
```

---

## 🚨 TROUBLESHOOTING

### Issue: Authentication fails
**Solution:** Check `.env.local` has `NEXTAUTH_SECRET` and `DATABASE_URL`

### Issue: Hero text not visible
**Solution:** Already fixed! Uses inline `style={{background: '...'}}` instead of absolute div

### Issue: Role checks not working
**Solution:** Verify user has WorkspaceMember record with correct role in database

### Issue: Redirect not going to analytics
**Solution:** Check user is OWNER role (not MANAGER or MEMBER)

### Issue: Color not changing
**Solution:** Check CSS variables in `globals.css` are set correctly

---

## 🔍 DATABASE QUERIES

### Check User Workspaces
```typescript
const workspaces = await prisma.workspaceMember.findMany({
  where: { userId: 'user-id' },
  include: { workspace: true }
});
```

### Check User Role in Workspace
```typescript
const member = await prisma.workspaceMember.findUnique({
  where: {
    workspaceId_userId: {
      workspaceId: 'workspace-id',
      userId: 'user-id'
    }
  }
});
console.log(member.role); // 'OWNER', 'MANAGER', etc.
```

### Check Notifications
```typescript
const notifications = await prisma.notification.findMany({
  where: { userId: 'user-id' },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

---

## 📈 BUILD COMMANDS

```bash
# Build for production
npm run build

# Start production build
npm run start

# Lint code
npm run lint

# Format code (if configured)
npm run format

# Run tests
npm run test

# Run E2E tests
npm run test:e2e
```

---

## 🌐 ENDPOINTS REFERENCE

### Authentication
- `POST /api/auth/signin` → Sign in
- `POST /api/auth/signout` → Sign out
- `POST /api/auth/[...nextauth]` → NextAuth handler

### Workspaces & Projects
- `GET /workspace` → List workspaces
- `GET /workspace/[id]` → Workspace home
- `GET /workspace/[id]/projects` → Project list
- `POST /api/workspace/[id]/projects` → Create project

### Analytics (OWNER only)
- `GET /workspace/[id]/analytics` → Analytics page
- `GET /api/analytics` → Analytics data

### Members & Invites
- `GET /workspace/[id]/members` → Member list
- `POST /api/invite` → Send invite
- `GET /api/invite/accept?token=XXX` → Accept invite

### Notifications
- `POST /api/webhooks/activity` → Webhook receiver
- `GET /workspace/[id]/notifications` → Notification list

### Search
- `GET /api/search?q=query&workspace=[id]` → Global search

---

## 📱 RESPONSIVE BREAKPOINTS

```css
/* Tailwind default breakpoints */
sm: 640px   (mobile)
md: 768px   (tablet)
lg: 1024px  (desktop)
xl: 1280px  (wide)
```

**Usage:**
```jsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text size
</div>
```

---

## ⚙️ PERFORMANCE TIPS

1. **Database**: Always use indexes on frequently queried fields
2. **Queries**: Use `select` to only fetch needed fields
3. **Caching**: Implement Redis for frequently accessed data
4. **Images**: Use Next.js Image component for optimization
5. **Bundling**: Monitor bundle size with `npm run build`

---

## 📚 DOCUMENTATION FILES

- `TESTING-GUIDE-COMPLETE.md` ........... Comprehensive testing guide
- `IMPLEMENTATION-SUMMARY-COMPLETE.md` . What was implemented
- `TECHNICAL-IMPLEMENTATION-GUIDE.md` .. Technical details & architecture
- `QUICK-BUG-FIX-TESTING-GUIDE.md` ..... Previous phase guides

---

## 🎓 NEXT STEPS

1. ✅ Test all user flows above
2. ✅ Verify analytics works for OWNER only
3. ✅ Test invitation system
4. ✅ Check role-based access
5. ✅ Review appearance against reference image
6. ⬜ Configure email service
7. ⬜ Set up WhatsApp integration
8. ⬜ Deploy to production

---

## 💡 TIPS

- Use Prisma Studio to debug database: `npx prisma studio`
- Check browser console for frontend errors
- Check terminal for backend errors
- Use NextAuth debug mode: `DEBUG=next-auth:* npm run dev`
- Test responsive design: Chrome DevTools → Toggle Device Toolbar

---

## 🆘 QUICK SUPPORT

**Build fails?** Run `npm run lint` to check for errors

**Page shows 404?** Check the `Route` section in build output

**Database error?** Run `npx prisma migrate dev` to sync schema

**Colors wrong?** Check `globals.css` CSS variables are set

**Redirect wrong?** Check user role in WorkspaceMember table

---

**Happy Testing! 🚀**

All features are implemented and build is clean (0 errors).
Start with the test user flows above to verify everything works!

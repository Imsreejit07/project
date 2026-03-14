# FlowState SaaS Application - Project Status & Handoff Document

**Last Updated:** March 13, 2026  
**Status:** Feature Complete (Core) → Persistence & Deployment Phase  
**Overall Progress:** ~85% (Engineering done, Infrastructure integration pending)

---

## 1. PROJECT OVERVIEW

### What is FlowState?

FlowState is a full-stack SaaS productivity application designed to help users:
- Define and manage goals, projects, and tasks
- Plan daily work in time slots (morning/afternoon/evening)
- Track work sessions and generate insights
- Use AI-powered planning and task suggestions
- Subscribe to plans with feature tiers (Free: 3 goals, 10 tasks; Pro: Unlimited)

### Tech Stack

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| **Frontend** | React + TypeScript + Vite | 18.3.1 / 5.7.2 / 6.4.1 | ✅ Working |
| **Backend** | Express.js + Node.js + TypeScript | 4.21.1 / NodeNext | ✅ Working |
| **Database** | PostgreSQL (with pg-mem fallback) | - | 🟡 Fallback Active |
| **Authentication** | JWT + bcryptjs | - | ✅ Working |
| **Styling** | Tailwind CSS | 3.4.17 | ✅ Working |
| **Icons** | lucide-react | - | ✅ Working |
| **Integrations** | Gemini API, Stripe, Resend | - | 🟡 Scaffolded |

### Deployment Targets

- **Backend:** Render.com (Docker/Node.js runtime)
- **Frontend:** Vercel.com (Next.js static build)
- **Database:** Supabase PostgreSQL (pending connection)

---

## 2. TECHNICAL ARCHITECTURE

### Frontend Structure (`client/`)

```
client/
├── src/
│   ├── App.tsx                    # Root router (landing → auth → dashboard)
│   ├── api.ts                     # API client layer (all fetch wrappers)
│   ├── context/
│   │   └── AppContext.tsx         # Global state (goals, tasks, user, stats, chat)
│   ├── components/
│   │   ├── AuthGate.tsx           # Login/signup/password-reset forms
│   │   ├── Dashboard.tsx          # Main authenticated view
│   │   ├── LandingPage.tsx        # Public landing page
│   │   ├── Layout.tsx             # Main app shell with nav
│   │   ├── Goals.tsx              # Goal CRUD
│   │   ├── Tasks.tsx              # Task list and filtering
│   │   ├── Plans.tsx              # Daily plan builder
│   │   ├── Insights.tsx           # Analytics dashboard
│   │   ├── BillingDashboard.tsx   # Plan info and checkout
│   │   ├── AdminDashboard.tsx     # Admin controls
│   │   └── ...                    # Other UI components
│   ├── types/                     # TypeScript interfaces for all models
│   └── hooks/                     # Custom React hooks
├── index.html                     # Entry point
├── vite.config.ts                 # Vite build config (with @ alias)
├── tsconfig.json                  # TypeScript config
├── tailwind.config.js             # Tailwind setup
├── postcss.config.js              # PostCSS plugins
└── package.json                   # Dependencies
```

**Key State Structure (AppContext):**
```typescript
interface AppState {
  currentUser: CurrentUser;        // Authenticated user (new)
  goals: Goal[];
  projects: Project[];
  tasks: Task[];
  stats: Stats;
  chatMessages: ChatMessage[];
  // ... other state
}
```

**Recent Frontend Changes:**
- ✅ Added currentUser to app state for personalized greeting
- ✅ Eye toggle button on password field (login/signup/reset modes)
- ✅ Improved error messaging for server connectivity
- ✅ Fixed Vite path alias (@) resolution via vite.config.ts

### Backend Structure (`server/`)

```
server/
├── src/
│   ├── index.ts                   # Express app, middleware, route setup
│   ├── db/
│   │   └── database.ts            # Connection mgmt (pg pool + pg-mem fallback)
│   ├── auth/
│   │   ├── jwt.ts                 # Token generation/verification, bcrypt
│   │   ├── middleware.ts          # Auth guards (requireAuth, requireAuthWithPlan, requireAdmin)
│   │   └── routes.ts              # Auth endpoints (signup, login, refresh, logout, reset-password)
│   ├── routes/
│   │   ├── api.ts                 # Main CRUD routes (goals, tasks, projects, plans, ai-chat)
│   │   ├── adminRoutes.ts         # Admin endpoints
│   │   ├── billingRoutes.ts       # Stripe + plans
│   │   └── index.ts               # Route aggregation
│   ├── services/
│   │   ├── email.ts               # Email sending (Resend API)
│   │   ├── ai.ts                  # Gemini AI integration
│   │   └── stripe.ts              # Stripe client setup
│   ├── middleware/
│   │   ├── rateLimiter.ts         # Rate limiting configs
│   │   └── ...
│   └── types.ts                   # TypeScript interfaces
├── .env.example                   # Environment variable template
├── tsconfig.json                  # TypeScript config (NodeNext module resolution)
├── package.json                   # Dependencies
└── ...
```

**Database Schema:**
- `users` - User accounts, auth fields, plan/role info
- `goals` - User goals with status tracking
- `projects` - Child projects under goals
- `tasks` - Todo items with scheduling
- `work_sessions` - Time tracking
- `daily_plans` - Scheduled work for specific days
- `refresh_tokens` - Session tracking (hash + expiry)
- `password_reset_tokens` - Reset flow tokens
- `activity_log` - Audit trail

**Recent Backend Changes:**
- ✅ Fixed NodeNext module resolution in tsconfig.json (fixes ESM .js imports)
- ✅ Updated scheduled_slot constraint for pg-mem compatibility
- ✅ AppProvider now hydrates currentUser from authenticated user
- ✅ All protected routes require `requireAuthWithPlan` middleware

---

## 3. WHAT IS COMPLETE ✅

### Authentication System
- [✅] Signup with email/password/name
- [✅] Login with email/password
- [✅] JWT access token (15min) + refresh token (7d httpOnly cookie)
- [✅] Refresh endpoint for token rotation
- [✅] Logout with cookie clearing
- [✅] Forgot password flow
- [✅] Password reset with token validation and expiry
- [✅] `/auth/me` endpoint returning authenticated user
- [✅] Request-level rate limiting (10 attempts/15min on signup/login)

### UI Components & UX
- [✅] Landing page (public, call-to-action)
- [✅] Auth form (signup/login/forgot-password/reset-password modes)
- [✅] Password visibility toggle (Eye icon)
- [✅] Responsive layout with navigation sidebar
- [✅] Dashboard with user greeting (includes name)
- [✅] Goal CRUD interface
- [✅] Task CRUD interface with filtering
- [✅] Project/sub-task management
- [✅] Daily plan builder (time slot scheduling)
- [✅] Insights dashboard with stats cards
- [✅] Billing dashboard (plan info + checkout button)
- [✅] Admin dashboard (stub for admin features)
- [✅] Tailwind styling (dark mode ready)

### API & Data Layer
- [✅] API client (`api.ts`) with all CRUD methods
- [✅] Express routes for goals, projects, tasks, plans
- [✅] User isolation (all queries filtered by user_id)
- [✅] Plan limits enforced (free: 3 goals/10 tasks, pro: unlimited)
- [✅] Rate limiting on AI endpoints
- [✅] Error handling with HTTP status codes
- [✅] Health check endpoint

### Database
- [✅] PostgreSQL schema definition
- [✅] Schema initialization on app startup
- [✅] pg-mem fallback for local development (no DATABASE_URL needed)
- [✅] UUID primary keys
- [✅] Timestamps (created_at, updated_at)
- [✅] Foreign key constraints

### Integrations (Scaffolded)
- [✅] **Gemini API:** Fallback planner, chat assistant structure (ready for GEMINI_API_KEY)
- [✅] **Stripe:** Checkout, portal, webhook routes (ready for STRIPE_SECRET_KEY)
- [✅] **Resend Email:** Welcome, password reset, upgrade emails (ready for RESEND_API_KEY)

### Deployment Configs
- [✅] Render YAML for backend (Docker, Node.js runtime, env setup)
- [✅] Vercel config for frontend (static build, API proxy)
- [✅] `.env.example` with all required variables

### Testing
- [✅] Signup → returns user + access token
- [✅] Login → returns user + access token
- [✅] Auth flow smoke tests pass
- [✅] Task CRUD operations working
- [✅] TypeScript compilation passes (`npx tsc --noEmit`)
- [✅] Backend boots without errors
- [✅] Frontend dev server runs without errors

---

## 4. WHAT NEEDS WORK 🟡

### Phase 1: Persistence & Session (HIGH PRIORITY)

**Problem:** After login, page refresh returns to Get Started screen. Data doesn't survive server restart.

**Root Cause:**
1. Frontend doesn't persist auth token (no localStorage/sessionStorage)
2. Frontend doesn't validate token on app mount
3. Backend uses in-memory DB fallback; data lost when server restarts

**Tasks:**

| Task | Owner | Priority | Details |
|------|-------|----------|---------|
| Get Supabase CONNECTION_URL | User | CRITICAL | Visit supabase.com, create project, copy postgres connection string from Project Settings → Database |
| Inject DATABASE_URL into backend | Agent | CRITICAL | Update server/.env with DATABASE_URL, restart backend, verify schema initializes |
| Test persistence on real DB | Agent | CRITICAL | Signup → create task → restart backend → verify task still exists |
| Add token persistence to frontend | Agent | HIGH | Store JWT in localStorage on login, validate on app mount, redirect if invalid |
| Fix routing on page refresh | Agent | HIGH | After token validation, user should stay in authenticated state (not bounce to Get Started) |
| Test complete flow | Agent | MEDIUM | Signup → page refresh → should stay logged in and see data |

### Phase 2: API Key Integration (MEDIUM PRIORITY)

These are optional for MVP but enable key features:

| Service | Purpose | Status | Setup |
|---------|---------|--------|-------|
| **Gemini API** | AI planning, chat suggestions | Scaffolded | Needs GEMINI_API_KEY |
| **Stripe** | Billing, subscription management | Scaffolded | Needs STRIPE_SECRET_KEY + STRIPE_PUBLIC_KEY |
| **Resend** | Transactional emails | Scaffolded | Needs RESEND_API_KEY + FROM_EMAIL |

### Phase 3: Deployment (HIGH PRIORITY)

| Platform | Service | Status | Tasks |
|----------|---------|--------|-------|
| **Render** | Backend | Ready | Connect GitHub repo, add DATABASE_URL + JWT_ACCESS_SECRET as env vars, deploy |
| **Vercel** | Frontend | Ready | Connect GitHub repo, deploy (will auto-detect Vite build) |

---

## 5. STEP-BY-STEP NEXT ACTIONS

### FOR USER (Do These First)

**Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Sign in or create account
3. Click "New Project"
4. Name: "flowstate" (or preferred)
5. Database Password: Save this securely ⚠️
6. Select region closest to you
7. Wait for project to initialize (5-10 min)

**Step 2: Get Database Connection URL**
1. Open Supabase Dashboard
2. Go to Settings → Database → Connection Pooling
3. Select "Session" mode (if available) or "Transaction" mode
4. Copy the full connection string (starts with `postgresql://`)
5. Save somewhere safe (will give to agent)

**Step 3: Collect API Keys (Optional for MVP)**
- Gemini: Go to [Google AI Studio](https://aistudio.google.com/apikey), create key
- Stripe: Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys), copy Secret key
- Resend: Go to [Resend Console](https://resend.com/api-tokens), create token

**Step 4: Ready to Deploy?**
- Decide on Render + Vercel for hosting
- Prepare to share secrets with platforms (don't commit to GitHub)

### FOR AGENT (After User Provides DATABASE_URL)

1. **Inject DATABASE_URL**
   - Update `server/.env` with Supabase connection string
   - Restart backend
   - Verify no errors on startup
   - Confirm schema initializes on real DB

2. **Test Backend with Real DB**
   - Run signup/login/getMe smoke tests
   - Create a task and verify it persists after restart
   - Confirm refresh token flow works

3. **Add Frontend Token Persistence**
   - Modify `client/src/api.ts` or new auth service to:
     - Save JWT to localStorage on login/signup
     - Retrieve on app mount
     - Validate with `/auth/me` call
     - If valid, log user in automatically; if invalid, clear token and show auth gate
   - Update `App.tsx` to run token validation on mount

4. **Fix Page Refresh Behavior**
   - Authenticated users should not see Get Started page on refresh
   - Should redirect to Dashboard if token is valid
   - Should see AuthGate only if no valid token

5. **Full Integration Test**
   - Signup → verify redirected to Dashboard
   - Page refresh → should stay logged in
   - Logout → should return to Get Started
   - Close browser and reopen → should auto-login if token not expired

6. **Deploy Preparation**
   - Create GitHub repo (if not already)
   - Add all required env vars to Render + Vercel
   - Deploy backend first, then frontend
   - Test auth flow on live URLs

---

## 6. ENVIRONMENT VARIABLES CHECKLIST

### Backend (`server/.env`)

Required:
```
DATABASE_URL=postgresql://...  # From Supabase (USER provides)
JWT_ACCESS_SECRET=...           # Safe random string (recommend 32+ chars)
CLIENT_URL=http://localhost:5173 (dev) or https://yourdomain.com (prod)
NODE_ENV=development (dev) or production (prod)
```

Optional (for full features):
```
GEMINI_API_KEY=...              # Google AI Studio
STRIPE_SECRET_KEY=...           # Stripe Dashboard
STRIPE_PUBLIC_KEY=...           # Stripe Dashboard
RESEND_API_KEY=...              # Resend Console
FROM_EMAIL=noreply@yourdomain   # For emails
```

### Frontend (`client/.env` - if needed)

```
VITE_API_URL=http://localhost:3001 (dev) or https://api.yourdomain.com (prod)
```

---

## 7. HANDOFF CHECKLIST

Use this checklist when handing off to another AI assistant:

- [ ] **Understand Project Goal:** FlowState is a productivity SaaS with goals/tasks/planning
- [ ] **Understand Current State:** 85% complete; core features working; persistence/deployment pending
- [ ] **Understand Stack:** React frontend, Express backend, PostgreSQL via Supabase, JWT auth
- [ ] **Understand File Structure:** Frontend in `client/`, backend in `server/`
- [ ] **Understand Blocking Issue:** No persistent database yet (Supabase connection pending)
- [ ] **Understand User Tasks:** User must provide Supabase DATABASE_URL + any API keys
- [ ] **Understand Agent Tasks:** Inject DB connection, add token persistence, test, deploy
- [ ] **Can Access Project:** Have read access to all source files in workspace
- [ ] **Can Run Commands:** Can execute npm/npx commands in both client/ and server/ directories
- [ ] **Understands Deployment:** Render for backend, Vercel for frontend, Supabase for DB
- [ ] **Knows Test Procedures:** Smoke tests for auth, task CRUD, persistence, refresh behavior

---

## 8. KEY LINKS & REFERENCES

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Express.js API](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### Project Files to Know
- Frontend entry: `client/src/App.tsx`
- Frontend state: `client/src/context/AppContext.tsx`
- Backend entry: `server/src/index.ts`
- Database layer: `server/src/db/database.ts`
- Auth routes: `server/src/auth/routes.ts`
- Main API routes: `server/src/routes/api.ts`
- Types: `server/src/types.ts` and `client/src/types.ts`

### Common Commands
```bash
# Frontend
cd client
npm install              # Install deps (done)
npm run dev              # Start Vite dev server on http://localhost:5173
npm run build            # Bundle for production
npx tsc --noEmit         # Type check only

# Backend
cd server
npm install              # Install deps (done)
npx tsx src/index.ts     # Start server on http://localhost:3001
npx tsc --noEmit         # Type check only
```

---

## 9. KNOWN ISSUES & RESOLUTIONS

| Issue | Status | Resolution |
|-------|--------|-----------|
| Page refresh loses login state | 🟡 Pending | Add localStorage token persistence + validation on mount |
| Data doesn't survive server restart | 🟡 Pending | Use Supabase DATABASE_URL instead of in-memory DB |
| No AI features working | 🟡 Pending | Add GEMINI_API_KEY to backend |
| No email sending | 🟡 Pending | Add RESEND_API_KEY and FROM_EMAIL to backend |
| No billing flow | 🟡 Pending | Add Stripe keys and test checkout |

---

## 10. NEXT CONVERSATION STARTER

When handing off, give the agent this prompt:

> "I have a FlowState SaaS productivity app that's 85% complete. The core auth, API, and UI are working. I need help with the final 15%:
>
> 1. **Immediate:** Set up real database via Supabase
> 2. **Short-term:** Add session persistence (so page refresh doesn't lose login)
> 3. **Medium-term:** Test everything end-to-end
> 4. **Long-term:** Prepare for deployment to Render (backend) + Vercel (frontend)
>
> I'll provide the Supabase DATABASE_URL. The full project status is in PROJECT_STATUS.md in the workspace. Please review that first, then ask clarifying questions if needed. Start by helping me verify the backend can connect to Supabase."

---

**Document End**  
Generated: March 13, 2026  
Project: FlowState SaaS | Version: 0.9 (MVP Phase)

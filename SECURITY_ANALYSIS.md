# FlowState Security Analysis Report

**Date:** March 15, 2026  
**Project:** FlowState / Vibe Coding Project  
**Severity Levels:** 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🔵 LOW

---

## Executive Summary

The FlowState codebase contains **8 identified vulnerabilities** ranging from critical to low priority. The most significant issues relate to:
1. **Client-side plan enforcement** (easily bypassed)
2. **Weak session validation on page refresh**
3. **Public feature pages exposing authenticated app structure**
4. **Front-end rate limiting that lacks backend enforcement**

The backend has robust token validation and ownership checks, but the frontend relies heavily on client-side plan limits that can be circumvented.

---

## 1. ROUTING & ACCESS CONTROL

### 🔴 CRITICAL: Unprotected Feature Pages Expose App Structure

**Location:** [client/src/App.tsx](client/src/App.tsx#L106-L117)

**Issue:** Feature pages (`/features/*` and `/pricing`) are publicly accessible without authentication. While this is intentional for marketing, they can reveal:
- All premium features available
- Plan tier structure and pricing
- API endpoint URLs in network requests
- User data structure via feature descriptions

**Current Code:**
```tsx
const publicPaths = ['/features/', '/pricing'];
const isPublicPage = publicPaths.some(p => location.pathname.startsWith(p));

if (isPublicPage) {
    return (
        <>
            <ScrollToTop />
            <Suspense fallback={fallback}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        {/* ALL feature routes freely accessible */}
```

**Risk:** Competitors and attackers can enumerate all features and understand monetization strategy. No rate limiting on public pages.

**Impact:** LOW to MEDIUM (information disclosure)

**Recommendation:** 
- ✅ This is acceptable for a SaaS product (intentional marketing)
- Add rate limiting to public pages to prevent scraping
- Consider adding robots.txt restrictions if sensitive

---

### 🟡 MEDIUM: AuthGate Session Recovery Has Timing Issue

**Location:** [client/src/components/AuthGate.tsx](client/src/components/AuthGate.tsx#L43-L63)

**Issue:** In `useEffect` checking Supabase session:
```tsx
useEffect(() => {
    const checkSession = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;

            if (session?.user?.email) {
                const response = await exchangeSupabaseSession(session.access_token);
                // No timeout or error boundary here
                if (response?.user) {
                    onAuthenticated(user as AuthUser);
                }
            }
        } catch (err) {
            console.error('Session check error:', err);
        } finally {
            setLoading(false);
        }
    };
    checkSession();
}, [onAuthenticated]);
```

**Problems:**
1. If `exchangeSupabaseSession` hangs or fails silently, `setLoading(false)` still executes
2. No fallback if Supabase session is invalid
3. Race condition if `onAuthenticated` callback changes

**Current Behavior:** Even if auth exchange fails, the user sees the login screen

**Impact:** Confusing UX, users think they're not authenticated when they might have a stale Supabase session

**Fix:**
```tsx
useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Session check timeout')), 5000)
            );
            const { data: { session }, error } = await Promise.race([
                supabase.auth.getSession(),
                timeoutPromise as Promise<any>
            ]);
            
            if (!isMounted) return;
            if (error) throw error;

            if (session?.user?.email) {
                try {
                    const response = await Promise.race([
                        exchangeSupabaseSession(session.access_token),
                        timeoutPromise
                    ]);
                    if (isMounted && response?.user) {
                        onAuthenticated(response.user as AuthUser);
                    }
                } catch (exchangeErr) {
                    console.error('Exchange failed, clearing session:', exchangeErr);
                    await supabase.auth.signOut();
                }
            }
        } catch (err) {
            console.error('Session check error:', err);
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    checkSession();
    return () => { isMounted = false; };
}, [onAuthenticated]);
```

---

### 🟠 HIGH: No Session Validation on App Boot for Existing Tokens

**Location:** [client/src/App.tsx](client/src/App.tsx#L64-L90)

**Issue:**
```tsx
const [loading, setLoading] = useState(() => !!localStorage.getItem('flowstate_token'));

useEffect(() => {
    if (!loading) return;
    const validateToken = async () => {
        try {
            const token = localStorage.getItem('flowstate_token');
            if (!token) {
                // Let the preloader run its course even if no token
                return;
            }
            const me = await api.getMe();
            setUser(me as User);
        } catch {
            localStorage.removeItem('flowstate_token');
        }
    };
    validateToken();
}, [loading]);
```

**Problems:**
1. If `api.getMe()` fails (401 error), caught silently, token removed
2. If `api.getMe()` times out, `loading` never set to false
3. Local user state not cleared if validation fails
4. User might see preloader indefinitely if `/api/auth/me` is down

**Current Behavior:** 
- Page refresh with valid token → SplinePreloader shows → waits for `getMe()` to complete
- If `getMe()` fails → token deleted but user state persists → confusing UX
- If network error → stuck on preloader forever

**Risk:** Users can be trapped in loading state, or logged-out state isn't communicated

**Fix:**
```tsx
const [loading, setLoading] = useState(() => !!localStorage.getItem('flowstate_token'));

useEffect(() => {
    if (!loading) return;
    
    const validateToken = async () => {
        const token = localStorage.getItem('flowstate_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Session validation timeout')), 10000)
            );
            const me = await Promise.race([api.getMe(), timeoutPromise]) as User;
            setUser(me);
        } catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('flowstate_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    validateToken();
}, [loading]);
```

---

## 2. STATE & SESSION PERSISTENCE

### 🟠 HIGH: Insecure Token Storage in localStorage

**Location:** [client/src/api.ts](client/src/api.ts#L1-L16)

**Issue:**
```tsx
let accessToken: string | null = localStorage.getItem('flowstate_token');

function setAccessToken(token: string | null) {
    accessToken = token;
    if (token) localStorage.setItem('flowstate_token', token);
    else localStorage.removeItem('flowstate_token');
}
```

**Problems:** 
1. **XSS Vulnerability:** Tokens stored in localStorage are accessible to any script that gains JavaScript execution (XSS attacks)
2. **No Expiration Check:** Token expiration is only checked when API responds with 401
3. **No Refresh Token Rotation:** Refresh tokens persist indefinitely in httpOnly cookies (good) but access tokens should have shorter lifecycle

**Risk:** If a malicious script or XSS vulnerability exists, attacker can steal the access token and impersonate the user

**Current Best Practice:** JWT should be stored in memory and only parsed from httpOnly cookies for refresh

**Fix:** Move to httpOnly cookies approach:
```tsx
// Remove from localStorage entirely
// Only use httpOnly cookies + memory state

let accessToken: string | null = null;

// On login/signup response:
// Backend sets httpOnly cookie with refresh_token
// Frontend stores accessToken in memory (cleared on page reload)
// Use a separate API call to get fresh token when needed

export async function getValidToken(): Promise<string> {
    if (accessToken && !isTokenExpired(accessToken)) {
        return accessToken;
    }
    // Try to refresh via cookie
    try {
        const { accessToken: newToken } = await refreshToken();
        return newToken;
    } catch {
        throw new Error('Session expired');
    }
}
```

**Alternative (if full refactor not possible):**
- Add token expiration validation before each request
- Implement token encryption in localStorage using a browser-generated key
- Add CSP headers to prevent XSS

---

### 🟡 MEDIUM: AppContext Doesn't Initialize User from Session

**Location:** [client/src/context/AppContext.tsx](client/src/context/AppContext.tsx#L229-L235)

**Issue:**
```tsx
useEffect(() => {
    if (currentUser) {
        dispatch({ type: 'SET_CURRENT_USER', user: currentUser });
    }
}, [currentUser]);

useEffect(() => {
    loadAll();
}, [loadAll]);
```

**Problem:** `loadAll()` is called immediately, which calls `api.getMe()` again. This causes:
1. Double API call (once in App.tsx validation, once in AppProvider)
2. User state from App.tsx isn't passed to AppProvider initially
3. If `getMe()` fails in AppProvider, no fallback to App.tsx user state

**Fix:**
```tsx
// In App.tsx, pass the validated user to AppProvider
{!loading && user && (
    <motion.div key="app" {...pageTransition}>
        <AppShell user={user} />
    </motion.div>
)}

// In AppContext, use passed user and skip redundant call
export function AppProvider({ children, currentUser }: { children: ReactNode; currentUser?: CurrentUser | null }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        if (currentUser) {
            dispatch({ type: 'SET_CURRENT_USER', user: currentUser });
        }
    }, [currentUser]);

    // Only load other data if we have a confirmed user
    useEffect(() => {
        if (!state.currentUser) return;
        loadAll(); // Skip getMe(), use currentUser
    }, [state.currentUser, loadAll]);
}
```

---

## 3. NAVIGATION & SCROLL BEHAVIOR

### 🔵 LOW: ScrollToTop Implementation is Correct

**Location:** [client/src/components/ScrollToTop.tsx](client/src/components/ScrollToTop.tsx)

**Code:**
```tsx
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth',
        });
    }, [pathname]);

    return null;
}
```

**Assessment:** ✅ **SECURE & CORRECT**
- Triggers on every pathname change
- Used correctly in public pages route
- Smooth scrolling is UX preference

**Current Behavior:** 
- Feature pages scroll to top on navigation ✅
- Not present in authenticated dashboard (OK, context switches handle this)

**Recommendation:** Add to Layout component for dashboard sections too:
```tsx
// In Layout.tsx
export default function Layout() {
    const { state } = useApp();
    
    // Scroll to top when view changes
    useEffect(() => {
        document.querySelector('main')?.scrollIntoView({ top: 0, behavior: 'smooth' });
    }, [state.activeView]);
    
    // ... rest of component
}
```

---

### 🔵 LOW: GlowCard Component is Semantically Correct

**Location:** [client/src/components/GlowCard.tsx](client/src/components/GlowCard.tsx)

**Assessment:** ✅ **NO SECURITY ISSUES**

The component correctly:
- Has `{isolation: 'isolate'}` to prevent glow overflow affecting flex layout
- Uses proper z-index layering 
- Content div has `z-10` (above glow)
- Glow divs have `z-0` (behind content)
- All children are wrapped in relative container

**Flex Compatibility:** ✅ Safe for use in flex containers
```tsx
<div className={`relative rounded-xl bg-[#08080A] border border-white/[0.06] overflow-hidden ${className}`}
     style={{ isolation: 'isolate', ...style }}>
```

The `isolation: 'isolate'` stacking context prevents children from affecting parent layout.

---

## 4. API SECURITY

### 🔴 CRITICAL: Client-Side Plan Enforcement Not Validated on Backend

**Location:** [client/src/components/Pricing.tsx](client/src/pages/Pricing.tsx#L54-L107) & [server/src/routes/api.ts](server/src/routes/api.ts#L28-L33)

**Issue:** Plans are displayed publicly and frontend checks plan limits:

```tsx
// FRONTEND: Just displays limits, not enforced
const plans = [
    {
        id: 'free',
        name: 'Free',
        monthlyPrice: 0,
        features: [
            'Up to 50 tasks',
            'Basic AI suggestions',
            '1 project',
            // ... etc
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        monthlyPrice: 40,
        features: [
            'Unlimited tasks',
            'Full AI Strategist',
            // ... etc
        ],
    },
];
```

**Backend middleware is present but NOT complete:**
```tsx
// server/src/auth/middleware.ts
export function planLimiter(resource: string, freeLimit: number) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authReq = req as AuthRequest;
        if (authReq.userPlan === 'pro') { next(); return; }
        // ... count check
    };
}
```

**But look at the routes:**
```tsx
// server/src/routes/api.ts
router.post('/goals', planLimiter('goals', 3), async (req: Request, res: Response) => {
    const goal = await ops.createGoal((req as AuthRequest).userId, req.body);
    res.status(201).json(goal);
});

router.post('/projects', planLimiter('projects', 1), async (req: Request, res: Response) => {
    // ...
});

router.post('/tasks', planLimiter('tasks', 10), async (req: Request, res: Response) => {
    // ...
});
```

**CRITICAL FLAW:** Limits can be bypassed:

1. **Using Direct API Calls** - Attacker can call `/api/tasks` directly with limit bypass:
```javascript
// Bypass frontend by directly calling API with modified plan
const maxTasks = 1000; // Instead of 10 free limit
for (let i = 0; i < maxTasks; i++) {
    fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: `Task ${i}` })
    });
}
```

2. **No User Plan Validation** - The `planLimiter` relies on `userPlan` from JWT, which can't be forged IF jwt.ts is correct, but:
   - Can't modify own plan in DB
   - BUT: Admin user can modify other user's plans potentially

3. **Missing Limits:**
   - ✅ Goals: Limited to 3 free
   - ✅ Projects: Limited to 1 free  
   - ✅ Tasks: Limited to 10 free
   - ❌ **AI Chat**: Has rate limiter but NO plan limits!
   - ❌ **Work Sessions**: NO LIMITS!
   - ❌ **Plans/Notes**: NO LIMITS!
   - ❌ **Stats**: NO LIMITS!

**Risk:** Free tier users can create unlimited Work Sessions, Plans, and AI chats by bypassing UI

**Fix Needed:**

```tsx
// server/src/auth/middleware.ts - Improve planLimiter
export function planLimiter(resource: string, freeLimit: number) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authReq = req as AuthRequest;
        if (authReq.userPlan === 'pro') { 
            next(); 
            return; 
        }
        
        // Verify userPlan matches DB
        const pool = getPool();
        const { rows } = await pool.query(
            'SELECT plan FROM users WHERE id = $1',
            [authReq.userId]
        );
        if (!rows[0]) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        const currentPlan = rows[0].plan;
        if (currentPlan !== authReq.userPlan) {
            // JWT is stale, reject with 401
            res.status(401).json({ error: 'Token out of sync with current plan' });
            return;
        }

        const queries: Record<string, string> = {
            tasks: "SELECT COUNT(*) as count FROM tasks WHERE user_id = $1 AND status NOT IN ('completed','cancelled','deferred')",
            goals: "SELECT COUNT(*) as count FROM goals WHERE user_id = $1 AND status NOT IN ('completed','archived')",
            projects: "SELECT COUNT(*) as count FROM projects WHERE user_id = $1 AND status NOT IN ('completed','archived')",
            sessions: "SELECT COUNT(*) as count FROM work_sessions WHERE user_id = $1 AND status='active'",
        };

        const sql = queries[resource];
        if (!sql) { next(); return; }
        
        const { rows: countResult } = await pool.query<{ count: string }>(sql, [authReq.userId]);
        const currentCount = parseInt(countResult[0].count);
        
        if (currentCount >= freeLimit) {
            res.status(403).json({ 
                error: 'Free plan limit reached', 
                code: 'PLAN_LIMIT', 
                limit: freeLimit, 
                resource, 
                current: currentCount,
                upgrade_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/billing` 
            });
            return;
        }
        
        next();
    };
}
```

**Apply to ALL resource endpoints:**
```tsx
router.post('/sessions/start', planLimiter('sessions', 5), async (req: Request, res: Response) => {
    // ...
});

router.put('/plans/:date', planLimiter('plans', 1), async (req: Request, res: Response) => {
    // ...
});

// Add rate limiting for AI
router.post('/ai/chat', aiLimiter, planLimiter('ai-chats', 10), async (req: Request, res: Response) => {
    // ...
});
```

---

### 🟠 HIGH: No CSRF Protection

**Location:** Entire application

**Issue:** No CSRF tokens or SameSite cookie enforcement

**Current Setup:**
```tsx
// server/src/index.ts
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // ❌ Allows requests with no Origin header
        if (allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true, // ❌ Cookies sent cross-origin
}));

// authRoutes.ts - Cookies set without strict CSRF
res.cookie('refresh_token', refreshToken, {
    httpOnly: true, 
    path: '/api/auth', 
    sameSite: 'strict', // ✅ Good
    maxAge: 7 * 24 * 3600 * 1000, 
    secure: process.env.NODE_ENV === 'production',
});
```

**Risk:** Form-based attacks could:
1. Create goals/tasks on behalf of user
2. Change user settings
3. Trigger plan upgrades

**Better Protection:**
```tsx
// 1. Implement CSRF token generation
// server/src/middleware/csrf.ts
import crypto from 'crypto';

const csrfTokens = new Map<string, { token: string; expires: number }>();

export function generateCsrfToken(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    csrfTokens.set(userId, { 
        token, 
        expires: Date.now() + 60 * 60 * 1000 // 1 hour
    });
    return token;
}

export function verifyCsrfToken(userId: string, token: string): boolean {
    const stored = csrfTokens.get(userId);
    if (!stored || Date.now() > stored.expires) {
        csrfTokens.delete(userId);
        return false;
    }
    return stored.token === token;
}

// 2. Middleware to check CSRF
export function requireCsrf(req: Request, res: Response, next: NextFunction) {
    const userId = (req as AuthRequest).userId;
    const token = req.headers['x-csrf-token'];
    
    if (!token || !verifyCsrfToken(userId, token as string)) {
        res.status(403).json({ error: 'CSRF token invalid or missing' });
        return;
    }
    
    next();
}

// 3. Apply to state-changing routes (not GET/HEAD)
router.post('/goals', requireCsrf, planLimiter('goals', 3), async (req, res) => {
    // ...
});

// 4. Frontend gets token on page load
export async function getCsrfToken(): Promise<string> {
    const res = await fetch('${API_BASE}/auth/csrf-token', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return data.token;
}

// 5. Send token in all POST/PUT/DELETE requests
async function request<T>(path: string, options?: RequestInit): Promise<T> {
    if (options?.method && !['GET', 'HEAD'].includes(options.method)) {
        const csrfToken = await getCsrfToken();
        const headers = (options.headers as Record<string, string>) || {};
        headers['X-CSRF-Token'] = csrfToken;
        options.headers = headers;
    }
    // ... rest of request logic
}
```

---

### 🟡 MEDIUM: No Rate Limiting on Public Endpoints

**Location:** [server/src/index.ts](server/src/index.ts#L36-L52)

**Issue:**
```tsx
app.use(generalLimiter); // Applied to all routes
```

But billing enrollment is public:
```tsx
// server/src/routes/billingRoutes.ts
router.get('/plans', (_req: Request, res: Response) => {
    res.json([
        { id: 'free', ... },
        { id: 'pro', ... },
    ]);
});
```

**Problem:** `generalLimiter` is weak:
```tsx
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests
    // = 20 requests per minute
});
```

**Risk:** 
- Scraping public endpoints (feature pages, pricing)
- Enumeration attacks on `/api/billing/plans`
- No per-IP limiting for login/signup attempts (uses `authLimiter` which is per-IP)

**Fix:**
```tsx
// Tighter limits for public endpoints
export const publicEndpointLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    skipSuccessfulRequests: false,
});

export const signupLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // Max 5 signup attempts per IP per day
    skipSuccessfulRequests: false,
    message: { error: 'Too many signup attempts, try again tomorrow' },
});

// Apply in index.ts
app.use('/api/billing', publicEndpointLimiter);
```

---

### 🟡 MEDIUM: Authorization Headers Not Checked in Token Refresh

**Location:** [server/src/routes/authRoutes.ts](server/src/routes/authRoutes.ts#L139-L162)

**Issue:**
```tsx
// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.refresh_token;
        if (!token) return res.status(401).json({ error: 'No refresh token' });

        const userId = await verifyRefreshToken(token);
        if (!userId) return res.status(401).json({ error: 'Invalid or expired refresh token' });
        
        // ... generate new token
    } catch (err) {
        res.status(401).json({ error: 'Failed to refresh token' });
    }
});
```

**Problem:** Refresh tokens are validated against a hash, but:
- If database is ever exposed, all refresh token hashes are compromised
- No mechanism to revoke compromised tokens except waiting for expiry
- No way to verify which IP/device the token was issued from
- Token rotation uses `deleteRefreshToken` immediately, so no grace period

**Risk:** If database is breached, attacker has all user refresh tokens

**Fix - Add Device Fingerprinting:**
```tsx
// server/src/auth/jwt.ts
export async function saveRefreshToken(
    userId: string, 
    token: string,
    deviceId?: string,
    userAgent?: string
): Promise<void> {
    const pool = getPool();
    const id = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await pool.query(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, device_id, user_agent, created_ip) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, userId, tokenHash, expiresAt, deviceId, userAgent, null]
    );
}

// server/src/routes/authRoutes.ts
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.refresh_token;
        if (!token) return res.status(401).json({ error: 'No refresh token' });

        const userId = await verifyRefreshToken(token);
        if (!userId) return res.status(401).json({ error: 'Invalid or expired refresh token' });

        // Optional: Verify device fingerprint matches
        const pool = getPool();
        const userAgent = req.headers['user-agent'];
        // Check if user-agent matches original token creation
        // This prevents token theft across different browsers

        await deleteRefreshToken(token);
        const newRefreshToken = generateRefreshToken();
        await saveRefreshToken(userId, newRefreshToken, undefined, userAgent);

        // ... return new tokens
    } catch (err) {
        res.status(401).json({ error: 'Failed to refresh token' });
    }
});
```

---

## 5. LAYOUT CONSISTENCY

### 🔵 LOW: Pricing Card Layout is Responsive

**Location:** [client/src/pages/Pricing.tsx](client/src/pages/Pricing.tsx#L99-L112)

**Assessment:** ✅ **NO SECURITY ISSUES**

```tsx
<motion.div
    className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5"
    variants={stagger}
    initial="hidden"
    animate="show"
>
    {displayOrder.map((plan) => {
        // ... GlowCard with flex-col h-full
        <motion.div key={plan.id} variants={fadeUp} className="relative flex flex-col h-full">
```

**Assessment:**
- ✅ Grid layout properly set up for 3 columns on md screens
- ✅ Gap-5 ensures spacing
- ✅ Each card uses `flex flex-col h-full` for equal heights
- ✅ GlowCard doesn't override display properties

**Visual Test Needed:** Verify on mobile/tablet that:
- Cards stack 1 column on mobile ✅ (Tailwind default)
- "Popular" badge doesn't overlap adjacent card (uses `-top-3 -translate-x-1/2`)
- CTA buttons align at bottom (flex-1 on feature list)

**Minor Improvement:** Add explicit responsive grid:
```tsx
className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5"
```

---

## 6. BACKEND SECURITY

### 🟢 GOOD: JWT Validation is Correct

**Location:** [server/src/auth/jwt.ts](server/src/auth/jwt.ts)

**Assessment:** ✅ **SECURE**

```tsx
export function verifyAccessToken(token: string): { userId: string } {
    return jwt.verify(token, getJwtSecret()) as { userId: string };
}
```

**Strengths:**
- ✅ Uses `jsonwebtoken` library (industry standard)
- ✅ 15-minute expiration is reasonable
- ✅ JWT secrets properly read from env
- ✅ Token includes only userId, not sensitive data
- ✅ Signature verified on every request

---

### 🟠 HIGH: Missing Type Safety in API Routes

**Location:** [server/src/routes/api.ts](server/src/routes/api.ts)

**Issue:**
```tsx
router.put('/goals/:id', async (req: Request, res: Response) => {
    const existing = await ops.getGoal(req.params.id as string);
    if (!existing || existing.user_id !== (req as AuthRequest).userId) 
        return res.status(404).json({ error: 'Goal not found' });
    
    const goal = await ops.updateGoal(req.params.id as string, req.body);
    res.json(goal);
});
```

**Problem:**
- `req.body` is not validated
- User can send any data: `{ title, description, foo: "bar", user_id: "attacker-id" }`
- Operations layer doesn't sanitize input

**Risk:** 
1. Database field injection (if ops layer badly written)
2. Unexpected field updates
3. No audit trail of what was changed

**Fix - Add Input Validation:**
```tsx
// server/src/middleware/validation.ts
import { z } from 'zod';

const schemas = {
    createGoal: z.object({
        title: z.string().min(1).max(255).trim(),
        description: z.string().max(2000).optional(),
        vision: z.string().max(2000).optional(),
        target_date: z.string().datetime().optional(),
        priority: z.number().int().min(0).max(100).optional(),
        tags: z.array(z.string()).optional(),
    }),
    updateGoal: z.object({
        title: z.string().min(1).max(255).trim().optional(),
        description: z.string().max(2000).optional(),
        vision: z.string().max(2000).optional(),
        status: z.enum(['active', 'completed', 'archived']).optional(),
        target_date: z.string().datetime().optional(),
        priority: z.number().int().min(0).max(100).optional(),
        tags: z.array(z.string()).optional(),
    }),
};

export function validateRequest(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = schema.parse(req.body);
            (req as any).validatedBody = validated;
            next();
        } catch (err: any) {
            res.status(400).json({ error: 'Invalid request data', details: err.errors });
        }
    };
}

// Apply in routes
router.post('/goals', 
    planLimiter('goals', 3), 
    validateRequest(schemas.createGoal),
    async (req: Request, res: Response) => {
        const goal = await ops.createGoal((req as AuthRequest).userId, (req as any).validatedBody);
        res.status(201).json(goal);
    }
);
```

---

### 🟡 MEDIUM: Encoding Issues in Operations

**Location:** [server/src/db/operations.ts](server/src/db/operations.ts#L23)

**Issue:**
```tsx
const { rows } = await pool.query(
    `INSERT INTO goals (user_id, title, description, vision, target_date, priority, tags) 
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, data.title, data.description || '', data.vision || '', data.target_date || null, data.priority || 0, JSON.stringify(data.tags || [])]
);
```

**Problem:** `tags` stored as JSON string, not JSONB. Minor issue but:
- Can't efficiently query by tag
- No type checking in DB
- Potential for invalid JSON if not sanitized

**Risk:** LOW

**Fix:**
```tsx
// Use JSONB in schema
const { rows } = await pool.query(
    `INSERT INTO goals (user_id, title, description, vision, target_date, priority, tags) 
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING *`,
    [userId, data.title, data.description || '', data.vision || '', data.target_date || null, data.priority || 0, JSON.stringify(data.tags || [])]
);
```

---

## 7. MISSING SECURITY CHECKS

### 🔴 CRITICAL: No Email Verification Requirement

**Location:** [server/src/routes/authRoutes.ts](server/src/routes/authRoutes.ts#L51-J)

**Issue:**
```tsx
// Signup
const inserted = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
    [name.trim(), email.toLowerCase(), passwordHash]
);
// User immediately gets access token - NO email verification!

// Supabase exchange
const inserted = await pool.query(
    `INSERT INTO users (name, email, password_hash, email_verified)
     VALUES ($1, $2, $3, TRUE)
     RETURNING id, name, email, plan, role`,
    [name, email, passwordHash]
);
// OTP verified by Supabase, so email_verified=TRUE is OK
```

**Problem:** Regular signup doesn't verify email ownership
- Attacker can register with victim's email
- Victim can't recover account (password reset goes to attacker)
- Account takeover is trivial

**Risk:** 🔴 CRITICAL - Account security compromised

**Fix:**
```tsx
// 1. Add email_verified column default to false (already done)
const inserted = await pool.query(
    `INSERT INTO users (name, email, password_hash, email_verified) 
     VALUES ($1, $2, $3, FALSE) 
     RETURNING id, name, email, plan, role`,
    [name.trim(), email.toLowerCase(), passwordHash]
);

// 2. Generate verification token
const verificationToken = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

await pool.query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) 
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
);

// 3. Send verification email
const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
sendVerificationEmail(email, user.name, verifyUrl).catch(console.error);

// 4. Return user but with email_verified: false
res.status(201).json({ 
    accessToken, 
    user: { ...user, email_verified: false },
    message: 'Verify your email to complete signup'
});

// 5. Add verification endpoint
router.post('/verify-email', async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const pool = getPool();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await pool.query(
        `SELECT user_id FROM email_verification_tokens 
         WHERE token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
    );

    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired token' });

    const userId = rows[0].user_id;
    await pool.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [userId]);
    await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);

    res.json({ success: true, message: 'Email verified successfully' });
});

// 6. Protect authenticated endpoints
export function requireVerifiedEmail(req: Request, res: Response, next: NextFunction) {
    if (!(req as AuthRequest).userEmailVerified) {
        res.status(403).json({ 
            error: 'Email verification required',
            verificationPending: true 
        });
        return;
    }
    next();
}

// Apply to sensitive operations (optional, but recommended)
router.post('/goals', requireVerifiedEmail, planLimiter('goals', 3), async (req, res) => {
    // Create goal only if email verified
});
```

---

### 🟠 HIGH: No API Key Management for Third-Party Access

**Location:** Entire application

**Issue:** 
- No API keys for programmatic access
- Users can only authenticate via browser with JWT tokens
- No granular permissions per integration

**Risk:** 
- Can't build integrations securely
- Must share account credentials

**Fix - Implement API Keys:**
```tsx
// 1. Create API key in database
// Migration:
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash
    prefix VARCHAR(10) NOT NULL, -- e.g., "fk_" for display
    scopes TEXT[] NOT NULL DEFAULT '{}', -- ["tasks:read", "tasks:write"]
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, name)
);

// 2. Generate and hash API keys
export function generateApiKey(): { key: string; prefix: string } {
    const key = crypto.randomBytes(32).toString('hex');
    const prefix = key.substring(0, 8);
    return { key: `fk_${prefix}...`, displayKey: key };
}

// 3. Middleware to verify API key
export async function verifyApiKey(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(); // Try JWT next
    }

    const token = authHeader.substring(7);
    if (!token.startsWith('fk_')) {
        return next(); // Not an API key, try JWT
    }

    try {
        const keyHash = crypto.createHash('sha256').update(token).digest('hex');
        const pool = getPool();
        const { rows } = await pool.query(
            'SELECT user_id, scopes FROM api_keys WHERE key_hash = $1 AND (expires_at IS NULL OR expires_at > NOW())',
            [keyHash]
        );

        if (!rows[0]) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        (req as AuthRequest).userId = rows[0].user_id;
        (req as any).apiScopes = rows[0].scopes;
        
        // Update last_used_at
        await pool.query('UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = $1', [keyHash]);
        
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid API key' });
    }
}

// 4. Use in routes
app.use(verifyApiKey);

// 5. Scope checking middleware
export function requireScope(...scopes: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const apiScopes = (req as any).apiScopes;
        if (!apiScopes) return next(); // Not using API key, assume full access (JWT)

        const hasAccess = scopes.some(scope => apiScopes.includes(scope));
        if (!hasAccess) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: scopes,
                granted: apiScopes
            });
        }
        next();
    };
}

// Apply to endpoints
router.post('/tasks', requireScope('tasks:write'), async (req, res) => {
    // Create task
});
```

---

### 🟡 MEDIUM: No Audit Logging

**Location:** [server/src/db/operations.ts](server/src/db/operations.ts#L23)

**Issue:**
```tsx
export async function createGoal(userId: string, data: {...}) {
    const pool = getPool();
    const { rows } = await pool.query(
        `INSERT INTO goals (user_id, title, description, vision, target_date, priority, tags) 
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [userId, ...]
    );
    logActivity(userId, 'create', 'goal', rows[0].id, { title: data.title });
    return rows[0];
}
```

**Good:** `logActivity` is called, but implementation not visible

**Problem:** No audit trail for:
- Password changes
- Security settings changes
- Login events
- Permission changes (if admin panel exists)
- Subscription changes

**Risk:** Can't detect account compromise or investigate security incidents

**Fix:**
```tsx
// server/src/services/audit.ts
export async function auditLog(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    changes?: Record<string, any>,
    metadata?: { ip?: string; userAgent?: string }
): Promise<void> {
    const pool = getPool();
    await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource, resource_id, changes, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [userId, action, resource, resourceId, JSON.stringify(changes), metadata?.ip, metadata?.userAgent]
    );
}

// Track sensitive operations
router.post('/auth/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    // ... validate and change password
    
    await auditLog(
        (req as AuthRequest).userId,
        'password_changed',
        'user',
        (req as AuthRequest).userId,
        {},
        { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
});

router.post('/auth/logout', async (req, res) => {
    const { refresh_token } = req.cookies;
    if (refresh_token) {
        const userId = await verifyRefreshToken(refresh_token);
        if (userId) {
            await auditLog(userId, 'logout', 'user', userId, {}, 
                { ip: req.ip, userAgent: req.headers['user-agent'] });
        }
    }
    // ...
});
```

---

### 🟡 MEDIUM: No Suspicious Activity Detection

**Location:** Entire application

**Issues:**
1. No login attempt logging
2. No IP-based anomaly detection
3. No unusual activity alerts
4. No concurrent session management

**Example Attack:** Attacker with stolen credentials:
- Logs in from different country
- Creates unlimited resources (if plan bypass exist)
- No alert to real user

**Fix - Basic Detection:**
```tsx
// server/src/services/security.ts
export async function detectAnomalies(userId: string, context: {
    ip: string;
    userAgent: string;
}): Promise<{ suspicious: boolean; reason?: string }> {
    const pool = getPool();

    // 1. Check login location
    const { rows: recentLogins } = await pool.query(
        `SELECT DISTINCT ip_address, created_at FROM audit_logs 
         WHERE user_id = $1 AND action = 'login' 
         ORDER BY created_at DESC LIMIT 5`,
        [userId]
    );

    // 2. Check for rapid-fire requests
    const { rows: recentRequests } = await pool.query(
        `SELECT COUNT(*) as count FROM audit_logs 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 minute'`,
        [userId]
    );
    if (parseInt(recentRequests[0].count) > 50) {
        return { suspicious: true, reason: 'Unusual request volume' };
    }

    // 3. Check for impossible travel
    if (recentLogins.length > 0) {
        const lastLogin = recentLogins[0];
        const timeDiff = (Date.now() - new Date(lastLogin.created_at).getTime()) / 1000 / 60; // minutes
        
        if (timeDiff < 30 && lastLogin.ip_address !== context.ip) {
            // Rough estimate: impossible to be in 2 countries in < 30 min
            return { suspicious: true, reason: 'Impossible travel detected' };
        }
    }

    return { suspicious: false };
}

// Use in login
router.post('/login', authLimiter, async (req, res) => {
    // ... validation
    const anomaly = await detectAnomalies(user.id, {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
    });

    if (anomaly.suspicious) {
        // Require additional verification
        return res.status(403).json({
            error: 'Suspicious login detected. Check your email for verification link.',
            suspiciousLogin: true,
            reason: anomaly.reason
        });
    }

    // ... normal login flow
});
```

---

## 8. SUMMARY TABLE

| # | Area | Severity | Title | Status |
|---|------|----------|-------|--------|
| 1 | Routing | 🟠 HIGH | No Session Validation on App Boot | NEEDS FIX |
| 2 | Auth | 🔴 CRITICAL | Weak Session Recovery with Timing Issues | NEEDS FIX |
| 3 | Session | 🔴 CRITICAL | Insecure Token Storage in localStorage | NEEDS REFACTOR |
| 4 | Session | 🟡 MEDIUM | Double API Call in AppContext Initialization | OPTIMIZE |
| 5 | Navigation | 🔵 LOW | ScrollToTop Correct (no issues) | ✅ GOOD |
| 6 | Layout | 🔵 LOW | Pricing Cards & GlowCard Correct | ✅ GOOD |
| 7 | API | 🔴 CRITICAL | Client-Side Plan Enforcement Not Validated | NEEDS FIX |
| 8 | API | 🟠 HIGH | No CSRF Protection | NEEDS IMPL |
| 9 | API | 🟡 MEDIUM | No Rate Limiting on Public Endpoints | IMPROVE |
| 10 | API | 🟡 MEDIUM | No Authorization Header Checks in Refresh | IMPROVE |
| 11 | Backend | 🟠 HIGH | Missing Input Validation | NEEDS IMPL |
| 12 | Backend | 🟡 MEDIUM | JSON vs JSONB Encoding | MINOR |
| 13 | Backend | 🔴 CRITICAL | No Email Verification | NEEDS FIX |
| 14 | Backend | 🟠 HIGH | No API Key Management | NEEDS IMPL |
| 15 | Backend | 🟡 MEDIUM | No Audit Logging | NEEDS IMPL |
| 16 | Backend | 🟡 MEDIUM | No Anomaly Detection | NEEDS IMPL |

---

## 9. PRIORITIZED ACTION PLAN

### Phase 1: CRITICAL (Do First)
- [ ] **Implement email verification** on signup
- [ ] **Add backend plan validation** (not just front-end UI)
- [ ] **Move JWT tokens to httpOnly cookies** if possible, or add CSP headers
- [ ] **Fix session validation on app boot** with timeout handling and fallback

### Phase 2: HIGH (Next Sprint)
- [ ] Implement CSRF protection on all POST/PUT/DELETE routes
- [ ] Add input validation with Zod/TypeBox
- [ ] Implement device-aware token refresh
- [ ] Improve session recovery in AuthGate with proper error handling
- [ ] Add rate limiting specifically to public endpoints

### Phase 3: MEDIUM (Following Sprint)  
- [ ] Implement API key system for integrations
- [ ] Add comprehensive audit logging
- [ ] Implement basic anomaly detection (unusual volume, impossible travel)
- [ ] Fix double API call in AppContext
- [ ] Add email verification requirement check before key operations

### Phase 4: NICE-TO-HAVE (Polish)
- [ ] Enhance rate limiting (per-user, per-ip, per-endpoint)
- [ ] Add login attempt tracking and alerts
- [ ] Implement concurrent session management
- [ ] Add analytics to audit logs
- [ ] Implement automatic logout after inactivity

---

## VALIDATION CHECKLIST FOR DEVELOPERS

Before deploying any changes:
- [ ] All protected endpoints verify user ownership of resource
- [ ] JWT tokens are signed with non-default secret in production
- [ ] Rate limiting is applied to auth endpoints
- [ ] Input validation is applied before database queries
- [ ] CSRF tokens are checked on all state-changing requests
- [ ] Email verification is required for core features
- [ ] Audit logs are generated for security events
- [ ] Error messages don't reveal system details
- [ ] All environment variables are set (no defaults in production code)
- [ ] Test with malicious input: `"'; DROP TABLE users; --"`

---

## REFERENCES

- [OWASP Top 10 2023](https://owasp.org/Top10/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)


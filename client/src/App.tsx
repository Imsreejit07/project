import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import AuthGate from './components/AuthGate';
import BillingView from './components/BillingView';
import AdminView from './components/AdminView';
import ScrollToTop from './components/ScrollToTop';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import * as api from './api';
import SplinePreloader from './components/SplinePreloader';

// Lazy-load feature & pricing pages
const FlowEnginePage = lazy(() => import('./pages/features/FlowEnginePage'));
const BentoInsightsPage = lazy(() => import('./pages/features/BentoInsightsPage'));
const AIStrategistPage = lazy(() => import('./pages/features/AIStrategistPage'));
const ArchitectPage = lazy(() => import('./pages/features/ArchitectPage'));
const ZenModePage = lazy(() => import('./pages/features/ZenModePage'));
const ConnectPage = lazy(() => import('./pages/features/ConnectPage'));
const PricingPage = lazy(() => import('./pages/Pricing'));
const FeaturesOverview = lazy(() => import('./pages/FeaturesOverview'));

type User = { id: string; name: string; email: string; plan: 'free' | 'pro'; role: 'user' | 'admin' };

const pageTransition = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
    return (
        <motion.div {...pageTransition}>
            {children}
        </motion.div>
    );
}

function AppShell({ user }: { user: User }) {
    const params = new URLSearchParams(window.location.search);
    const route = params.get('view');

    if (route === 'billing') {
        return (
            <div className="min-h-screen p-6 md:p-8 bg-[#020203] text-surface-900">
                <BillingView />
            </div>
        );
    }

    if (route === 'admin' && user.role === 'admin') {
        return (
            <div className="min-h-screen p-6 md:p-8 bg-[#020203] text-surface-900">
                <AdminView />
            </div>
        );
    }

    return (
        <AppProvider currentUser={user}>
            <Layout />
        </AppProvider>
    );
}

export default function App() {
    const location = useLocation();
    const [showAuth, setShowAuth] = useState(false);
    const [user, setUser] = useState<User | null>(null);
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

    const fallback = (
        <div className="min-h-screen flex items-center justify-center bg-[#020203]">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 animate-pulse-subtle" />
        </div>
    );

    // Public feature/pricing pages — always accessible without auth
    const publicPaths = ['/pricing', '/features'];
    const isPublicPage = publicPaths.some(p => location.pathname === p);

    // Public feature showcase pages (marketing only)
    const publicFeaturePaths = ['/features/flow-engine', '/features/bento-insights', '/features/ai-strategist', '/features/architect', '/features/zen-mode', '/features/connect'];
    const isPublicFeaturePage = publicFeaturePaths.includes(location.pathname);

    if (isPublicPage || isPublicFeaturePage) {
        return (
            <>
                <ScrollToTop />
                <Suspense fallback={fallback}>
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/features" element={<PageWrapper><FeaturesOverview /></PageWrapper>} />
                            <Route path="/features/flow-engine" element={<PageWrapper><FlowEnginePage /></PageWrapper>} />
                            <Route path="/features/bento-insights" element={<PageWrapper><BentoInsightsPage /></PageWrapper>} />
                            <Route path="/features/ai-strategist" element={<PageWrapper><AIStrategistPage /></PageWrapper>} />
                            <Route path="/features/architect" element={<PageWrapper><ArchitectPage /></PageWrapper>} />
                            <Route path="/features/zen-mode" element={<PageWrapper><ZenModePage /></PageWrapper>} />
                            <Route path="/features/connect" element={<PageWrapper><ConnectPage /></PageWrapper>} />
                            <Route path="/pricing" element={<PageWrapper><PricingPage /></PageWrapper>} />
                        </Routes>
                    </AnimatePresence>
                </Suspense>
            </>
        );
    }

    // Main app flow
    return (
        <>
            <ScrollToTop />
            <AnimatePresence mode="wait">
                {loading && (
                    <SplinePreloader key="loading" onComplete={() => setLoading(false)} />
                )}

                {!loading && !showAuth && !user && (
                    <motion.div key="landing" {...pageTransition}>
                        <LandingPage onGetStarted={() => setShowAuth(true)} />
                    </motion.div>
                )}

                {!loading && !user && showAuth && (
                    <motion.div key="auth" {...pageTransition}>
                        <AuthGate onAuthenticated={(u) => setUser(u)} />
                    </motion.div>
                )}

                {!loading && user && (
                    <motion.div key="app" {...pageTransition}>
                        <AppShell user={user} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
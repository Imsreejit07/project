import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import AuthGate from './components/AuthGate';
import BillingView from './components/BillingView';
import AdminView from './components/AdminView';
import { useState, useEffect } from 'react';
import * as api from './api';

type User = { id: string; name: string; email: string; plan: 'free' | 'pro'; role: 'user' | 'admin' };

function AppShell({ user }: { user: User }) {
    const params = new URLSearchParams(window.location.search);
    const route = params.get('view');

    if (route === 'billing') {
        return (
            <div className="min-h-screen p-6 md:p-8 bg-surface-950 text-surface-100">
                <BillingView />
            </div>
        );
    }

    if (route === 'admin' && user.role === 'admin') {
        return (
            <div className="min-h-screen p-6 md:p-8 bg-surface-950 text-surface-100">
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
    const [showAuth, setShowAuth] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(() => {
        // Only load from token if one exists, otherwise skip loading
        return !!localStorage.getItem('flowstate_token');
    });

    // Only validate token if it exists
    useEffect(() => {
        if (!loading) return;

        const validateToken = async () => {
            try {
                const token = localStorage.getItem('flowstate_token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                // Quick validation with 3 second timeout
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);

                try {
                    const me = await api.getMe();
                    clearTimeout(timeout);
                    setUser(me as User);
                    setLoading(false);
                } catch (err) {
                    clearTimeout(timeout);
                    // Validation failed, clear token
                    localStorage.removeItem('flowstate_token');
                    setLoading(false);
                }
            } catch (err) {
                setLoading(false);
            }
        };

        validateToken();
    }, [loading]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-surface-400">Loading...</div>;
    }

    if (!showAuth && !user) {
        return <LandingPage onGetStarted={() => setShowAuth(true)} />;
    }

    if (!user) {
        return <AuthGate onAuthenticated={(u) => setUser(u)} />;
    }

    return (
        <AppShell user={user} />
    );
}

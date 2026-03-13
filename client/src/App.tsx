import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import AuthGate from './components/AuthGate';
import BillingView from './components/BillingView';
import AdminView from './components/AdminView';
import { useState } from 'react';

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

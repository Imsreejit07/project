import { useEffect, useState } from 'react';
import { getMe, login, signup, forgotPassword, resetPassword } from '../api';
import { Eye, EyeOff } from 'lucide-react';

interface AuthUser {
    id: string;
    name: string;
    email: string;
    plan: 'free' | 'pro';
    role: 'user' | 'admin';
}

export default function AuthGate({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resetToken, setResetToken] = useState('');

    useEffect(() => {
        const tokenFromUrl = new URLSearchParams(window.location.search).get('reset');
        if (tokenFromUrl) {
            setResetToken(tokenFromUrl);
            setMode('reset');
        }

        getMe()
            .then((user) => onAuthenticated(user as AuthUser))
            .catch(() => setLoading(false));
    }, [onAuthenticated]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);
        try {
            if (mode === 'login') {
                await login(email, password);
                const me = await getMe();
                onAuthenticated(me as AuthUser);
            } else if (mode === 'signup') {
                await signup(name, email, password);
                const me = await getMe();
                onAuthenticated(me as AuthUser);
            } else if (mode === 'forgot') {
                const r = await forgotPassword(email);
                setMessage((r as any).message || 'Reset link sent if email exists.');
            } else if (mode === 'reset') {
                const r = await resetPassword(resetToken, password);
                setMessage((r as any).message || 'Password reset. Please log in.');
                setMode('login');
            }
        } catch (err: any) {
            const rawMessage = String(err?.message || 'Request failed');
            if (
                rawMessage.includes('Failed to fetch') ||
                rawMessage.includes('NetworkError') ||
                rawMessage.includes('HTTP 404') ||
                rawMessage === 'Request failed'
            ) {
                setError('Server is unreachable. Start the backend on http://localhost:3001 and try again.');
            } else {
                setError(rawMessage);
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-surface-400">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md card-glow p-6 rounded-2xl border border-surface-800">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold gradient-text">FlowState</h1>
                    <p className="text-surface-400 mt-1">
                        {mode === 'login' && 'Welcome back'}
                        {mode === 'signup' && 'Create your account'}
                        {mode === 'forgot' && 'Reset your password'}
                        {mode === 'reset' && 'Set a new password'}
                    </p>
                </div>

                {error && <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{error}</div>}
                {message && <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-sm text-surface-300 mb-1">Name</label>
                            <input className="input-field w-full" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                    )}

                    {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                        <div>
                            <label className="block text-sm text-surface-300 mb-1">Email</label>
                            <input className="input-field w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                    )}

                    {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                        <div>
                            <label className="block text-sm text-surface-300 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    className="input-field w-full pr-11"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    <button disabled={submitting} className="btn-primary w-full py-2.5 disabled:opacity-60">
                        {submitting ? 'Please wait...' : (
                            mode === 'login' ? 'Login' :
                                mode === 'signup' ? 'Create Account' :
                                    mode === 'forgot' ? 'Send Reset Link' :
                                        'Reset Password'
                        )}
                    </button>
                </form>

                <div className="mt-4 text-sm text-surface-400 text-center space-x-3">
                    {mode !== 'login' && <button className="hover:text-surface-200" onClick={() => setMode('login')}>Login</button>}
                    {mode !== 'signup' && <button className="hover:text-surface-200" onClick={() => setMode('signup')}>Sign up</button>}
                    {mode !== 'forgot' && mode !== 'reset' && <button className="hover:text-surface-200" onClick={() => setMode('forgot')}>Forgot password</button>}
                </div>
            </div>
        </div>
    );
}

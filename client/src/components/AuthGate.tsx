import { useEffect, useState } from 'react';
import { exchangeSupabaseSession, sendCode, verifyCode, login } from '../api';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface AuthUser {
    id: string;
    name: string;
    email: string;
    plan: 'free' | 'pro';
    role: 'user' | 'admin';
}

export default function AuthGate({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
    const [loading, setLoading] = useState(() => {
        const token = localStorage.getItem('flowstate_token');
        return !!token;
    });
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [step, setStep] = useState<'auth' | 'code'>('auth');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [code, setCode] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        // Check if user is already authenticated via Supabase session
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (session?.user?.email) {
                    // Exchange Supabase token for backend token and profile.
                    const response = await exchangeSupabaseSession(session.access_token);
                    if (response?.user) {
                        const user = response.user;
                        onAuthenticated(user as AuthUser);
                        return;
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

    // Cooldown timer for resend button
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    async function handleSendCode(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);

        try {
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setError('Please enter a valid email address');
                setSubmitting(false);
                return;
            }

            if (password.length < 8) {
                setError('Password must be at least 8 characters');
                setSubmitting(false);
                return;
            }

            if (mode === 'login') {
                // For login: attempt direct password authentication
                try {
                    const result = await login(email, password);
                    if (result?.user) {
                        onAuthenticated(result.user as AuthUser);
                    } else {
                        throw new Error('Login failed');
                    }
                } catch (err: any) {
                    // If login fails, might be new user - show signup prompt
                    if (err?.message?.includes('not found') || err?.message?.includes('not exist')) {
                        setError('Email not found. Please sign up for a new account.');
                    } else {
                        setError('Invalid credentials. Please try again.');
                    }
                }
            } else {
                // For signup: validate name and password confirmation
                if (!name.trim()) {
                    setError('Name is required');
                    setSubmitting(false);
                    return;
                }

                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setSubmitting(false);
                    return;
                }

                // Send OTP via Supabase
                setIsNewUser(true);
                await sendCode(email, name);
                setMessage('Check your email for the verification code');
                setStep('code');
            }
        } catch (err: any) {
            const errorMsg = err?.message || 'Failed to send code';
            console.error('Send code error:', err);
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleVerifyCode(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);

        try {
            if (!code.trim()) {
                setError('Code is required');
                setSubmitting(false);
                return;
            }

            // Verify OTP via Supabase
            const verifyResult = await verifyCode(email, code);

            if (verifyResult.session) {
                // Exchange Supabase token for backend token and profile.
                setMessage('Verified! Fetching your profile...');

                const exchanged = await exchangeSupabaseSession(verifyResult.session.access_token, {
                    name,
                    password,
                });

                if (exchanged?.user) {
                    const user = exchanged.user;
                    onAuthenticated(user as AuthUser);
                } else {
                    throw new Error('Failed to fetch user profile');
                }
            }
        } catch (err: any) {
            console.error('Verify code error:', err);
            setError(err?.message === 'Invalid OTP entered' ? 'Invalid OTP entered' : (err?.message || 'Failed to verify code'));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleResendCode() {
        setError('');
        setMessage('');
        setSubmitting(true);

        try {
            await sendCode(email, mode === 'signup' ? name : undefined);
            setMessage('Verification code sent again! Check your email.');
            setCode('');
            setResendCooldown(30);
        } catch (err: any) {
            const errorMsg = err?.message || 'Failed to resend code';
            console.error('Resend code error:', err);
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#020202] text-surface-500">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4">
            <div className="w-full max-w-md card-glow p-6 rounded-2xl border border-white/10">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold gradient-text">FlowState</h1>
                    <p className="text-surface-400 mt-1">
                        {step === 'auth' ? (mode === 'login' ? 'Sign In to Your Account' : 'Create Your Account') : 'Verify your email'}
                    </p>
                </div>

                {error && <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-start gap-2"><AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />{error}</div>}
                {message && <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />{message}</div>}

                <AnimatePresence mode="wait">
                    {step === 'auth' ? (
                        <motion.form
                            key="auth"
                            onSubmit={handleSendCode}
                            className="space-y-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Name field - only in signup mode */}
                            {mode === 'signup' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <label className="block text-sm text-surface-300 mb-1">Full Name</label>
                                    <input
                                        className="input-field w-full"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        required={mode === 'signup'}
                                        disabled={submitting}
                                        autoFocus
                                    />
                                </motion.div>
                            )}

                            {/* Email field */}
                            <div>
                                <label className="block text-sm text-surface-300 mb-1">Email Address</label>
                                <div className="relative">
                                    <input
                                        className="input-field w-full pr-10"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        disabled={submitting}
                                        autoFocus={mode === 'login'}
                                    />
                                    {email && (
                                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? (
                                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 h-4 w-4" />
                                        ) : (
                                            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 h-4 w-4" />
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Password field */}
                            <div>
                                <label className="block text-sm text-surface-300 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        className="input-field w-full pr-10"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="At least 8 characters"
                                        required
                                        minLength={8}
                                        disabled={submitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password field - only in signup mode */}
                            {mode === 'signup' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <label className="block text-sm text-surface-300 mb-1">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            className="input-field w-full pr-10"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter password"
                                            required={mode === 'signup'}
                                            minLength={8}
                                            disabled={submitting}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
                                            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={
                                    submitting ||
                                    !email ||
                                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
                                    password.length < 8 ||
                                    (mode === 'signup' && (!name.trim() || password !== confirmPassword))
                                }
                                className="btn-primary w-full py-2.5 disabled:opacity-60"
                            >
                                {submitting ? (mode === 'login' ? 'Signing in...' : 'Sending code...') : (mode === 'login' ? 'Sign In →' : 'Continue & Send Code →')}
                            </button>

                            {/* Mode toggle */}
                            <div className="text-center text-sm text-surface-400">
                                {mode === 'login' ? (
                                    <>
                                        Don't have an account?{' '}
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                setMode('signup');
                                                setError('');
                                                setMessage('');
                                                setEmail('');
                                                setPassword('');
                                                setConfirmPassword('');
                                            }}
                                            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                                        >
                                            Sign up here
                                        </motion.button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{' '}
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                setMode('login');
                                                setError('');
                                                setMessage('');
                                                setEmail('');
                                                setPassword('');
                                                setConfirmPassword('');
                                                setName('');
                                            }}
                                            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                                        >
                                            Sign in here
                                        </motion.button>
                                    </>
                                )}
                            </div>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="code"
                            onSubmit={handleVerifyCode}
                            className="space-y-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div>
                                <p className="text-sm text-surface-300 mb-4">
                                    We sent a 6-digit code to <strong>{email}</strong>
                                </p>
                                <label className="block text-sm text-surface-300 mb-1">Enter Verification Code</label>
                                <input
                                    className="input-field w-full text-center text-2xl tracking-widest font-mono"
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    disabled={submitting}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || code.length !== 6}
                                className="btn-primary w-full py-2.5 disabled:opacity-60"
                            >
                                {submitting ? 'Verifying...' : 'Verify & Continue →'}
                            </button>

                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={submitting || resendCooldown > 0}
                                className="w-full text-sm text-amber-400 hover:text-amber-300 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive the code? Resend"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep('auth');
                                    setCode('');
                                    setError('');
                                    setMessage('');
                                    setResendCooldown(0);
                                }}
                                className="w-full text-sm text-surface-400 hover:text-surface-200 py-2"
                            >
                                Back
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


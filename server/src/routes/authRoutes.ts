import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getPool } from '../db/database.js';
import {
    hashPassword, comparePassword,
    generateAccessToken, generateRefreshToken,
    saveRefreshToken, verifyRefreshToken,
    deleteRefreshToken, deleteAllUserRefreshTokens,
} from '../auth/jwt.js';
import { requireAuth } from '../auth/middleware.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

type SupabaseUserResponse = {
    id: string;
    email: string;
    user_metadata?: {
        name?: string;
        full_name?: string;
    };
};

async function fetchSupabaseUser(accessToken: string): Promise<SupabaseUserResponse> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set on the server');
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Invalid Supabase token');
    }

    return response.json() as Promise<SupabaseUserResponse>;
}

function deriveDisplayName(email: string, metadata?: SupabaseUserResponse['user_metadata']): string {
    const preferred = metadata?.full_name?.trim() || metadata?.name?.trim();
    if (preferred) return preferred;
    const localPart = email.split('@')[0] || 'User';
    return localPart.slice(0, 60);
}

// POST /api/auth/signup
router.post('/signup', authLimiter, async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name?.trim() || !email?.trim() || !password)
            return res.status(400).json({ error: 'Name, email, and password are required' });
        if (password.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return res.status(400).json({ error: 'Invalid email address' });

        const pool = getPool();
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0)
            return res.status(409).json({ error: 'An account with this email already exists' });

        const passwordHash = await hashPassword(password);
        const { rows } = await pool.query(
            `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, plan, role`,
            [name.trim(), email.toLowerCase(), passwordHash]
        );
        const user = rows[0];
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken();
        await saveRefreshToken(user.id, refreshToken);
        sendWelcomeEmail(user.email, user.name).catch(console.error);

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true, path: '/api/auth', sameSite: 'strict',
            maxAge: 7 * 24 * 3600 * 1000, secure: process.env.NODE_ENV === 'production',
        });
        res.status(201).json({ accessToken, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role } });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });

        const pool = getPool();
        const { rows } = await pool.query(
            'SELECT id, name, email, password_hash, plan, role FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        const user = rows[0];
        if (!user || !(await comparePassword(password, user.password_hash)))
            return res.status(401).json({ error: 'Invalid email or password' });

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken();
        await saveRefreshToken(user.id, refreshToken);

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true, path: '/api/auth', sameSite: 'strict',
            maxAge: 7 * 24 * 3600 * 1000, secure: process.env.NODE_ENV === 'production',
        });
        res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.refresh_token;
        if (!token) return res.status(401).json({ error: 'No refresh token' });

        const userId = await verifyRefreshToken(token);
        if (!userId) return res.status(401).json({ error: 'Invalid or expired refresh token' });

        await deleteRefreshToken(token);
        const newRefreshToken = generateRefreshToken();
        await saveRefreshToken(userId, newRefreshToken);

        const pool = getPool();
        const { rows } = await pool.query('SELECT id, name, email, plan, role FROM users WHERE id = $1', [userId]);
        if (!rows[0]) return res.status(401).json({ error: 'User not found' });

        const accessToken = generateAccessToken(userId);
        res.cookie('refresh_token', newRefreshToken, {
            httpOnly: true, path: '/api/auth', sameSite: 'strict',
            maxAge: 7 * 24 * 3600 * 1000, secure: process.env.NODE_ENV === 'production',
        });
        res.json({ accessToken, user: rows[0] });
    } catch (err) {
        res.status(401).json({ error: 'Failed to refresh token' });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
    const token = req.cookies?.refresh_token;
    if (token) await deleteRefreshToken(token).catch(() => { });
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.json({ success: true });
});

// POST /api/auth/supabase/exchange
router.post('/supabase/exchange', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Supabase access token required' });
        }

        const supabaseAccessToken = authHeader.substring(7);
        const { name: requestedName, password: requestedPassword } = req.body || {};
        const supabaseUser = await fetchSupabaseUser(supabaseAccessToken);

        if (!supabaseUser.email) {
            return res.status(400).json({ error: 'Supabase user has no email' });
        }

        const pool = getPool();
        const email = supabaseUser.email.toLowerCase();
        let user = (
            await pool.query(
                'SELECT id, name, email, plan, role FROM users WHERE email = $1',
                [email]
            )
        ).rows[0];

        if (!user) {
            const name = (typeof requestedName === 'string' && requestedName.trim())
                ? requestedName.trim()
                : deriveDisplayName(email, supabaseUser.user_metadata);

            if (typeof requestedPassword !== 'string' || requestedPassword.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters for new accounts' });
            }

            const passwordHash = await hashPassword(requestedPassword);
            const inserted = await pool.query(
                `INSERT INTO users (name, email, password_hash, email_verified)
                 VALUES ($1, $2, $3, TRUE)
                 RETURNING id, name, email, plan, role`,
                [name, email, passwordHash]
            );
            user = inserted.rows[0];

            sendWelcomeEmail(user.email, user.name).catch(console.error);
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken();
        await saveRefreshToken(user.id, refreshToken);

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            path: '/api/auth',
            sameSite: 'strict',
            maxAge: 7 * 24 * 3600 * 1000,
            secure: process.env.NODE_ENV === 'production',
        });

        return res.json({ accessToken, user });
    } catch (err) {
        console.error('Supabase exchange error:', err);
        return res.status(401).json({ error: 'Failed to exchange Supabase session' });
    }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const pool = getPool();
        const { rows } = await pool.query(
            'SELECT id, name, email, plan, role, settings, created_at FROM users WHERE id = $1', [userId]
        );
        if (!rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
        const pool = getPool();
        const { rows } = await pool.query(
            'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, plan, role',
            [name.trim(), userId]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });
        const pool = getPool();
        const { rows } = await pool.query('SELECT id, name FROM users WHERE email = $1', [email.toLowerCase()]);
        if (rows[0]) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
            const expiresAt = new Date(Date.now() + 3600 * 1000);
            await pool.query(
                `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)
                 ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = $3`,
                [rows[0].id, tokenHash, expiresAt]
            );
            const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}?reset=${resetToken}`;
            sendPasswordResetEmail(email.toLowerCase(), rows[0].name, resetUrl).catch(console.error);
        }
        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const pool = getPool();
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const { rows } = await pool.query(
            'SELECT user_id FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()',
            [tokenHash]
        );
        if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired reset token' });

        const passwordHash = await hashPassword(password);
        await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, rows[0].user_id]);
        await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [rows[0].user_id]);
        await deleteAllUserRefreshTokens(rows[0].user_id);
        res.json({ message: 'Password reset successfully. Please log in.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
});







export default router;

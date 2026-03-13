import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getPool } from '../db/database.js';

let hasWarnedDevSecret = false;

function getJwtSecret(): string {
    const configured = process.env.JWT_ACCESS_SECRET;
    if (configured) return configured;

    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_ACCESS_SECRET is not set');
    }

    if (!hasWarnedDevSecret) {
        hasWarnedDevSecret = true;
        console.warn('JWT_ACCESS_SECRET is not set. Using an insecure development fallback secret.');
    }

    return 'flowstate-dev-insecure-secret-change-me';
}

export function generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '15m' });
}

export function generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
}

export function verifyAccessToken(token: string): { userId: string } {
    return jwt.verify(token, getJwtSecret()) as { userId: string };
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function saveRefreshToken(userId: string, token: string): Promise<void> {
    const pool = getPool();
    const id = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
        'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)',
        [id, userId, tokenHash, expiresAt]
    );
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
    const pool = getPool();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await pool.query<{ user_id: string }>(
        'SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()',
        [tokenHash]
    );
    return rows[0]?.user_id || null;
}

export async function deleteRefreshToken(token: string): Promise<void> {
    const pool = getPool();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}

export async function deleteAllUserRefreshTokens(userId: string): Promise<void> {
    const pool = getPool();
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

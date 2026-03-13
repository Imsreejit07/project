import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './jwt.js';
import { getPool } from '../db/database.js';

export interface AuthRequest extends Request {
    userId: string;
    userPlan: 'free' | 'pro';
    userRole: 'user' | 'admin';
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    const token = authHeader.substring(7);
    try {
        const payload = verifyAccessToken(token);
        (req as AuthRequest).userId = payload.userId;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export async function requireAuthWithPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    const token = authHeader.substring(7);
    try {
        const payload = verifyAccessToken(token);
        const pool = getPool();
        const { rows } = await pool.query<{ id: string; plan: string; role: string }>(
            'SELECT id, plan, role FROM users WHERE id = $1', [payload.userId]
        );
        if (!rows[0]) { res.status(401).json({ error: 'User not found' }); return; }
        (req as AuthRequest).userId = rows[0].id;
        (req as AuthRequest).userPlan = rows[0].plan as 'free' | 'pro';
        (req as AuthRequest).userRole = rows[0].role as 'user' | 'admin';
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if ((req as AuthRequest).userRole !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}

export function planLimiter(resource: string, freeLimit: number) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authReq = req as AuthRequest;
        if (authReq.userPlan === 'pro') { next(); return; }
        const pool = getPool();
        const queries: Record<string, string> = {
            tasks: "SELECT COUNT(*) as count FROM tasks WHERE user_id = $1 AND status NOT IN ('completed','cancelled','deferred')",
            goals: "SELECT COUNT(*) as count FROM goals WHERE user_id = $1 AND status NOT IN ('completed','archived')",
            projects: "SELECT COUNT(*) as count FROM projects WHERE user_id = $1 AND status NOT IN ('completed','archived')",
        };
        const sql = queries[resource];
        if (!sql) { next(); return; }
        const { rows } = await pool.query<{ count: string }>(sql, [authReq.userId]);
        if (parseInt(rows[0].count) >= freeLimit) {
            res.status(403).json({ error: 'Free plan limit reached', code: 'PLAN_LIMIT', limit: freeLimit, resource, upgrade_url: '/billing' });
            return;
        }
        next();
    };
}

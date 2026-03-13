import { Router, Request, Response } from 'express';
import { requireAuthWithPlan, requireAdmin } from '../auth/middleware.js';
import { getPool } from '../db/database.js';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuthWithPlan);
router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (_req: Request, res: Response) => {
    const pool = getPool();
    try {
        const [usersRes, tasksRes, activeRes] = await Promise.all([
            pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE plan = 'pro') as pro FROM users`),
            pool.query('SELECT COUNT(*) as total FROM tasks'),
            pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM activity_log WHERE created_at > NOW() - INTERVAL '24 hours'`),
        ]);
        const proUsers = parseInt(usersRes.rows[0].pro);
        res.json({
            totalUsers: parseInt(usersRes.rows[0].total),
            proUsers,
            totalTasks: parseInt(tasksRes.rows[0].total),
            activeToday: parseInt(activeRes.rows[0].count),
            mrr: proUsers * 9,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response) => {
    const pool = getPool();
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;
    try {
        const { rows } = await pool.query(
            `SELECT u.id, u.name, u.email, u.plan, u.role, u.created_at,
             (SELECT COUNT(*) FROM tasks WHERE user_id = u.id) as task_count,
             (SELECT MAX(created_at) FROM activity_log WHERE user_id = u.id) as last_active
             FROM users u ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM users');
        res.json({ users: rows, total: parseInt(countRows[0].total), page, limit });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// PUT /api/admin/users/:id — change plan or role
router.put('/users/:id', async (req: Request, res: Response) => {
    const pool = getPool();
    const { plan, role } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE users SET
                plan = COALESCE($1, plan),
                role = COALESCE($2, role),
                updated_at = NOW()
             WHERE id = $3 RETURNING id, name, email, plan, role`,
            [plan || null, role || null, req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;

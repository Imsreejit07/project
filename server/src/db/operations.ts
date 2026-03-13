import { getPool } from './database.js';

// ─── User Operations ───

export async function getOrCreateUser(userId?: string) {
    const pool = getPool();
    if (userId) {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (rows[0]) return rows[0];
    }
    return null;
}

export async function updateUserSettings(userId: string, settings: Record<string, unknown>) {
    const pool = getPool();
    await pool.query('UPDATE users SET settings = $1, updated_at = NOW() WHERE id = $2', [settings, userId]);
}

// ─── Goal Operations ───

export async function createGoal(userId: string, data: { title: string; description?: string; vision?: string; target_date?: string; priority?: number; tags?: string[] }) {
    const pool = getPool();
    const { rows } = await pool.query(
        `INSERT INTO goals (user_id, title, description, vision, target_date, priority, tags) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [userId, data.title, data.description || '', data.vision || '', data.target_date || null, data.priority || 0, JSON.stringify(data.tags || [])]
    );
    logActivity(userId, 'create', 'goal', rows[0].id, { title: data.title });
    return rows[0];
}

export async function getGoal(id: string) {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM goals WHERE id = $1', [id]);
    return rows[0] || null;
}

export async function getGoals(userId: string, status?: string) {
    const pool = getPool();
    const params: any[] = [userId];
    let q = 'SELECT * FROM goals WHERE user_id = $1';
    if (status) { q += ' AND status = $2'; params.push(status); }
    q += ' ORDER BY priority DESC, created_at DESC';
    const { rows } = await pool.query(q, params);
    return rows;
}

export async function updateGoal(id: string, data: Partial<{ title: string; description: string; vision: string; status: string; target_date: string; priority: number; tags: string[] }>) {
    const pool = getPool();
    const sets: string[] = []; const vals: any[] = []; let n = 1;
    for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) { sets.push(`${key} = $${n++}`); vals.push(key === 'tags' ? JSON.stringify(val) : val); }
    }
    if (!sets.length) return getGoal(id);
    sets.push(`updated_at = NOW()`); vals.push(id);
    const { rows } = await pool.query(`UPDATE goals SET ${sets.join(', ')} WHERE id = $${n} RETURNING *`, vals);
    return rows[0] || null;
}

export async function deleteGoal(id: string) {
    await getPool().query('DELETE FROM goals WHERE id = $1', [id]);
}

// ─── Project Operations ───

export async function createProject(userId: string, data: { title: string; description?: string; goal_id?: string; deadline?: string; priority?: number; tags?: string[] }) {
    const pool = getPool();
    const { rows } = await pool.query(
        `INSERT INTO projects (user_id, goal_id, title, description, deadline, priority, tags) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [userId, data.goal_id || null, data.title, data.description || '', data.deadline || null, data.priority || 0, JSON.stringify(data.tags || [])]
    );
    logActivity(userId, 'create', 'project', rows[0].id, { title: data.title });
    return rows[0];
}

export async function getProject(id: string) {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return rows[0] || null;
}

export async function getProjects(userId: string, goalId?: string, status?: string) {
    const pool = getPool();
    const params: any[] = [userId]; let n = 2;
    let q = 'SELECT * FROM projects WHERE user_id = $1';
    if (goalId) { q += ` AND goal_id = $${n++}`; params.push(goalId); }
    if (status) { q += ` AND status = $${n++}`; params.push(status); }
    q += ' ORDER BY priority DESC, created_at DESC';
    const { rows } = await pool.query(q, params);
    return rows;
}

export async function updateProject(id: string, data: Partial<{ title: string; description: string; goal_id: string; status: string; deadline: string; priority: number; tags: string[] }>) {
    const pool = getPool();
    const sets: string[] = []; const vals: any[] = []; let n = 1;
    for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) { sets.push(`${key} = $${n++}`); vals.push(key === 'tags' ? JSON.stringify(val) : val); }
    }
    if (!sets.length) return getProject(id);
    sets.push(`updated_at = NOW()`); vals.push(id);
    const { rows } = await pool.query(`UPDATE projects SET ${sets.join(', ')} WHERE id = $${n} RETURNING *`, vals);
    return rows[0] || null;
}

export async function deleteProject(id: string) {
    await getPool().query('DELETE FROM projects WHERE id = $1', [id]);
}

// ─── Task Operations ───

export async function createTask(userId: string, data: {
    title: string; description?: string; project_id?: string; goal_id?: string;
    priority?: number; energy_level?: string; estimated_minutes?: number;
    due_date?: string; scheduled_date?: string; scheduled_slot?: string;
    recurrence?: string; tags?: string[];
}) {
    const pool = getPool();
    const { rows } = await pool.query(
        `INSERT INTO tasks (user_id,project_id,goal_id,title,description,priority,energy_level,estimated_minutes,due_date,scheduled_date,scheduled_slot,recurrence,tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [userId, data.project_id || null, data.goal_id || null, data.title, data.description || '',
            data.priority || 0, data.energy_level || 'medium', data.estimated_minutes || 30,
            data.due_date || null, data.scheduled_date || null, data.scheduled_slot || null,
            data.recurrence || null, JSON.stringify(data.tags || [])]
    );
    logActivity(userId, 'create', 'task', rows[0].id, { title: data.title });
    return rows[0];
}

export async function getTask(id: string) {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return rows[0] || null;
}

export async function getTasks(userId: string, filters?: {
    status?: string; project_id?: string; goal_id?: string;
    scheduled_date?: string; due_before?: string;
}) {
    const pool = getPool();
    const params: any[] = [userId]; let n = 2;
    let q = 'SELECT * FROM tasks WHERE user_id = $1';
    if (filters?.status) { q += ` AND status = $${n++}`; params.push(filters.status); }
    if (filters?.project_id) { q += ` AND project_id = $${n++}`; params.push(filters.project_id); }
    if (filters?.goal_id) { q += ` AND goal_id = $${n++}`; params.push(filters.goal_id); }
    if (filters?.scheduled_date) { q += ` AND scheduled_date = $${n++}`; params.push(filters.scheduled_date); }
    if (filters?.due_before) { q += ` AND due_date <= $${n++}`; params.push(filters.due_before); }
    q += ' ORDER BY priority DESC, due_date ASC NULLS LAST, created_at DESC';
    const { rows } = await pool.query(q, params);
    return rows;
}

export async function updateTask(id: string, data: Partial<{
    title: string; description: string; project_id: string; goal_id: string;
    status: string; priority: number; energy_level: string; estimated_minutes: number;
    actual_minutes: number; due_date: string; scheduled_date: string;
    scheduled_slot: string; recurrence: string; tags: string[];
}>) {
    const pool = getPool();
    const sets: string[] = []; const vals: any[] = []; let n = 1;
    for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) { sets.push(`${key} = $${n++}`); vals.push(key === 'tags' ? JSON.stringify(val) : val); }
    }
    if (data.status === 'completed') sets.push(`completed_at = NOW()`);
    if (!sets.length) return getTask(id);
    sets.push(`updated_at = NOW()`); vals.push(id);
    const { rows } = await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = $${n} RETURNING *`, vals);
    const task = rows[0];
    if (task) logActivity(task.user_id, 'update', 'task', id, { status: data.status });
    return task || null;
}

export async function completeTask(id: string) {
    return updateTask(id, { status: 'completed' });
}

export async function deleteTask(id: string) {
    await getPool().query('DELETE FROM tasks WHERE id = $1', [id]);
}

// ─── Work Session Operations ───

export async function startWorkSession(userId: string, taskId?: string) {
    const pool = getPool();
    const { rows } = await pool.query(
        `INSERT INTO work_sessions (user_id, task_id, started_at) VALUES ($1,$2,NOW()) RETURNING *`,
        [userId, taskId || null]
    );
    if (taskId) await pool.query(`UPDATE tasks SET status = 'in_progress', updated_at = NOW() WHERE id = $1`, [taskId]);
    logActivity(userId, 'start_session', 'work_session', rows[0].id, { task_id: taskId });
    return rows[0];
}

export async function endWorkSession(id: string, data?: { notes?: string; focus_score?: number; energy_after?: string }) {
    const pool = getPool();
    const { rows } = await pool.query(
        `UPDATE work_sessions SET ended_at = NOW(),
         duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER / 60,
         notes = $1, focus_score = $2, energy_after = $3 WHERE id = $4 RETURNING *`,
        [data?.notes || '', data?.focus_score || null, data?.energy_after || null, id]
    );
    return rows[0] || null;
}

export async function getWorkSessions(userId: string, limit = 50) {
    const pool = getPool();
    const { rows } = await pool.query(
        'SELECT * FROM work_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
    );
    return rows;
}

// ─── Daily Plan Operations ───

export async function getDailyPlan(userId: string, date: string) {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM daily_plans WHERE user_id = $1 AND date = $2', [userId, date]);
    return rows[0] || null;
}

export async function upsertDailyPlan(userId: string, date: string, data: { task_order?: string[]; notes?: string; planned_minutes?: number }) {
    const pool = getPool();
    const { rows } = await pool.query(
        `INSERT INTO daily_plans (user_id, date, task_order, notes, planned_minutes)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id, date) DO UPDATE SET
           task_order = COALESCE(EXCLUDED.task_order, daily_plans.task_order),
           notes = COALESCE(EXCLUDED.notes, daily_plans.notes),
           planned_minutes = COALESCE(EXCLUDED.planned_minutes, daily_plans.planned_minutes),
           updated_at = NOW()
         RETURNING *`,
        [userId, date, JSON.stringify(data.task_order || []), data.notes || '', data.planned_minutes || 0]
    );
    return rows[0];
}

// ─── Activity Log ───

export function logActivity(userId: string, action: string, entityType?: string, entityId?: string, details?: Record<string, unknown>): void {
    getPool().query(
        'INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata) VALUES ($1,$2,$3,$4,$5)',
        [userId, action, entityType || null, entityId || null, details || {}]
    ).catch(console.error);
}

export async function getActivityLog(userId: string, limit = 100) {
    const pool = getPool();
    const { rows } = await pool.query(
        'SELECT * FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
    );
    return rows;
}

// ─── Analytics ───

export async function getUserStats(userId: string) {
    const pool = getPool();
    const [total, completed, pending, goals, projects, overdue, sessions, byDay] = await Promise.all([
        pool.query<{ count: string }>('SELECT COUNT(*) as count FROM tasks WHERE user_id = $1', [userId]),
        pool.query<{ count: string }>(`SELECT COUNT(*) as count FROM tasks WHERE user_id = $1 AND status = 'completed'`, [userId]),
        pool.query<{ count: string }>(`SELECT COUNT(*) as count FROM tasks WHERE user_id = $1 AND status IN ('pending','in_progress')`, [userId]),
        pool.query<{ count: string }>(`SELECT COUNT(*) as count FROM goals WHERE user_id = $1 AND status = 'active'`, [userId]),
        pool.query<{ count: string }>(`SELECT COUNT(*) as count FROM projects WHERE user_id = $1 AND status = 'active'`, [userId]),
        pool.query<{ count: string }>(`SELECT COUNT(*) as count FROM tasks WHERE user_id = $1 AND status IN ('pending','in_progress') AND due_date < CURRENT_DATE`, [userId]),
        pool.query(`SELECT AVG(duration_minutes) as avg_duration, AVG(focus_score) as avg_focus, COUNT(*) as session_count FROM work_sessions WHERE user_id = $1 AND ended_at IS NOT NULL AND created_at > NOW() - INTERVAL '30 days'`, [userId]),
        pool.query(`SELECT DATE(completed_at) as day, COUNT(*) as count FROM tasks WHERE user_id = $1 AND status = 'completed' AND completed_at > NOW() - INTERVAL '30 days' GROUP BY DATE(completed_at) ORDER BY day`, [userId]),
    ]);
    const totalTasks = parseInt(total.rows[0].count);
    const completedTasks = parseInt(completed.rows[0].count);
    const s = sessions.rows[0];
    return {
        totalTasks, completedTasks,
        pendingTasks: parseInt(pending.rows[0].count),
        activeGoals: parseInt(goals.rows[0].count),
        activeProjects: parseInt(projects.rows[0].count),
        overdueTasks: parseInt(overdue.rows[0].count),
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        avgSessionDuration: Math.round(parseFloat(s?.avg_duration) || 0),
        avgFocusRating: Math.round((parseFloat(s?.avg_focus) || 0) * 10) / 10,
        recentSessionCount: parseInt(s?.session_count) || 0,
        completionsByDay: byDay.rows,
    };
}

// ─── AI Conversation Persistence ───

export async function saveConversation(userId: string, conversationId: string, messages: any[]) {
    await getPool().query(
        `INSERT INTO ai_conversations (id, user_id, messages) VALUES ($1,$2,$3)
         ON CONFLICT (id) DO UPDATE SET messages = $3, updated_at = NOW()`,
        [conversationId, userId, messages]
    );
}

export async function getConversation(conversationId: string) {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM ai_conversations WHERE id = $1', [conversationId]);
    return rows[0] || null;
}

export async function getRecentConversations(userId: string, limit = 10) {
    const pool = getPool();
    const { rows } = await pool.query(
        'SELECT id, user_id, created_at, updated_at FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2',
        [userId, limit]
    );
    return rows;
}

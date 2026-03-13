import { v4 as uuidv4 } from 'uuid';
import { getDb } from './database.js';

// ─── User Operations ───

export function getOrCreateUser(userId?: string): { id: string; name: string; settings: Record<string, unknown> } {
    const db = getDb();
    if (userId) {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
        if (user) return { ...user, settings: JSON.parse(user.settings || '{}') };
    }
    const id = userId || uuidv4();
    db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)').run(id, 'User');
    return { id, name: 'User', settings: {} };
}

export function updateUserSettings(userId: string, settings: Record<string, unknown>) {
    const db = getDb();
    db.prepare('UPDATE users SET settings = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(JSON.stringify(settings), userId);
}

// ─── Goal Operations ───

export function createGoal(userId: string, data: { title: string; description?: string; vision?: string; target_date?: string; priority?: number; tags?: string[] }) {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`INSERT INTO goals (id, user_id, title, description, vision, target_date, priority, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, userId, data.title, data.description || '', data.vision || '',
        data.target_date || null, data.priority || 0, JSON.stringify(data.tags || [])
    );
    logActivity(userId, 'create', 'goal', id, { title: data.title });
    return getGoal(id);
}

export function getGoal(id: string) {
    const db = getDb();
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as any;
    if (!goal) return null;
    return { ...goal, tags: JSON.parse(goal.tags || '[]') };
}

export function getGoals(userId: string, status?: string) {
    const db = getDb();
    let query = 'SELECT * FROM goals WHERE user_id = ?';
    const params: any[] = [userId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY priority DESC, created_at DESC';
    const goals = db.prepare(query).all(...params) as any[];
    return goals.map(g => ({ ...g, tags: JSON.parse(g.tags || '[]') }));
}

export function updateGoal(id: string, data: Partial<{ title: string; description: string; vision: string; status: string; target_date: string; priority: number; tags: string[] }>) {
    const db = getDb();
    const sets: string[] = [];
    const vals: any[] = [];
    for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) {
            sets.push(`${key} = ?`);
            vals.push(key === 'tags' ? JSON.stringify(val) : val);
        }
    }
    if (sets.length === 0) return getGoal(id);
    sets.push("updated_at = datetime('now')");
    vals.push(id);
    db.prepare(`UPDATE goals SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    return getGoal(id);
}

export function deleteGoal(id: string) {
    const db = getDb();
    db.prepare('DELETE FROM goals WHERE id = ?').run(id);
}

// ─── Project Operations ───

export function createProject(userId: string, data: { title: string; description?: string; goal_id?: string; deadline?: string; priority?: number; tags?: string[] }) {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`INSERT INTO projects (id, user_id, goal_id, title, description, deadline, priority, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, userId, data.goal_id || null, data.title, data.description || '',
        data.deadline || null, data.priority || 0, JSON.stringify(data.tags || [])
    );
    logActivity(userId, 'create', 'project', id, { title: data.title });
    return getProject(id);
}

export function getProject(id: string) {
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
    if (!project) return null;
    return { ...project, tags: JSON.parse(project.tags || '[]') };
}

export function getProjects(userId: string, goalId?: string, status?: string) {
    const db = getDb();
    let query = 'SELECT * FROM projects WHERE user_id = ?';
    const params: any[] = [userId];
    if (goalId) { query += ' AND goal_id = ?'; params.push(goalId); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY priority DESC, created_at DESC';
    const projects = db.prepare(query).all(...params) as any[];
    return projects.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') }));
}

export function updateProject(id: string, data: Partial<{ title: string; description: string; goal_id: string; status: string; deadline: string; priority: number; tags: string[] }>) {
    const db = getDb();
    const sets: string[] = [];
    const vals: any[] = [];
    for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) {
            sets.push(`${key} = ?`);
            vals.push(key === 'tags' ? JSON.stringify(val) : val);
        }
    }
    if (sets.length === 0) return getProject(id);
    sets.push("updated_at = datetime('now')");
    vals.push(id);
    db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    return getProject(id);
}

export function deleteProject(id: string) {
    const db = getDb();
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// ─── Task Operations ───

export function createTask(userId: string, data: {
    title: string; description?: string; project_id?: string; goal_id?: string;
    priority?: number; energy_level?: string; estimated_minutes?: number;
    due_date?: string; scheduled_date?: string; scheduled_slot?: string;
    recurrence?: string; tags?: string[];
}) {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`INSERT INTO tasks (id, user_id, project_id, goal_id, title, description, priority,
    energy_level, estimated_minutes, due_date, scheduled_date, scheduled_slot, recurrence, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, userId, data.project_id || null, data.goal_id || null, data.title,
        data.description || '', data.priority || 0, data.energy_level || 'medium',
        data.estimated_minutes || 30, data.due_date || null, data.scheduled_date || null,
        data.scheduled_slot || null, data.recurrence || null, JSON.stringify(data.tags || [])
    );
    logActivity(userId, 'create', 'task', id, { title: data.title });
    return getTask(id);
}

export function getTask(id: string) {
    const db = getDb();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!task) return null;
    return { ...task, tags: JSON.parse(task.tags || '[]') };
}

export function getTasks(userId: string, filters?: {
    status?: string; project_id?: string; goal_id?: string;
    scheduled_date?: string; due_before?: string;
}) {
    const db = getDb();
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params: any[] = [userId];
    if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
    if (filters?.project_id) { query += ' AND project_id = ?'; params.push(filters.project_id); }
    if (filters?.goal_id) { query += ' AND goal_id = ?'; params.push(filters.goal_id); }
    if (filters?.scheduled_date) { query += ' AND scheduled_date = ?'; params.push(filters.scheduled_date); }
    if (filters?.due_before) { query += ' AND due_date <= ?'; params.push(filters.due_before); }
    query += ' ORDER BY priority DESC, due_date ASC NULLS LAST, created_at DESC';
    const tasks = db.prepare(query).all(...params) as any[];
    return tasks.map(t => ({ ...t, tags: JSON.parse(t.tags || '[]') }));
}

export function updateTask(id: string, data: Partial<{
    title: string; description: string; project_id: string; goal_id: string;
    status: string; priority: number; energy_level: string; estimated_minutes: number;
    actual_minutes: number; due_date: string; scheduled_date: string;
    scheduled_slot: string; recurrence: string; tags: string[];
}>) {
    const db = getDb();
    const sets: string[] = [];
    const vals: any[] = [];
    for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) {
            sets.push(`${key} = ?`);
            vals.push(key === 'tags' ? JSON.stringify(val) : val);
        }
    }
    if (data.status === 'completed') {
        sets.push("completed_at = datetime('now')");
    }
    if (sets.length === 0) return getTask(id);
    sets.push("updated_at = datetime('now')");
    vals.push(id);
    db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

    const task = getTask(id);
    if (task) {
        const userId = task.user_id;
        logActivity(userId, 'update', 'task', id, { status: data.status, title: task.title });
    }
    return task;
}

export function deleteTask(id: string) {
    const db = getDb();
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

// ─── Work Session Operations ───

export function startWorkSession(userId: string, taskId?: string) {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`INSERT INTO work_sessions (id, user_id, task_id, started_at)
    VALUES (?, ?, ?, datetime('now'))`).run(id, userId, taskId || null);
    if (taskId) {
        db.prepare("UPDATE tasks SET status = 'in_progress', updated_at = datetime('now') WHERE id = ?").run(taskId);
    }
    logActivity(userId, 'start_session', 'work_session', id, { task_id: taskId });
    return db.prepare('SELECT * FROM work_sessions WHERE id = ?').get(id);
}

export function endWorkSession(id: string, data?: { notes?: string; focus_rating?: number; energy_after?: string }) {
    const db = getDb();
    const session = db.prepare('SELECT * FROM work_sessions WHERE id = ?').get(id) as any;
    if (!session) return null;
    db.prepare(`UPDATE work_sessions SET ended_at = datetime('now'),
    duration_minutes = CAST((julianday('now') - julianday(started_at)) * 1440 AS INTEGER),
    notes = ?, focus_rating = ?, energy_after = ? WHERE id = ?`).run(
        data?.notes || '', data?.focus_rating || null, data?.energy_after || null, id
    );
    return db.prepare('SELECT * FROM work_sessions WHERE id = ?').get(id);
}

export function getWorkSessions(userId: string, limit = 50) {
    const db = getDb();
    return db.prepare('SELECT * FROM work_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
}

// ─── Daily Plan Operations ───

export function getDailyPlan(userId: string, date: string) {
    const db = getDb();
    const plan = db.prepare('SELECT * FROM daily_plans WHERE user_id = ? AND plan_date = ?').get(userId, date) as any;
    if (!plan) return null;
    return { ...plan, task_order: JSON.parse(plan.task_order || '[]') };
}

export function upsertDailyPlan(userId: string, date: string, data: {
    task_order?: string[]; notes?: string; reflection?: string;
    energy_pattern?: string; planned_minutes?: number; completed_minutes?: number;
}) {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`INSERT INTO daily_plans (id, user_id, plan_date, task_order, notes, reflection, energy_pattern, planned_minutes, completed_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, plan_date) DO UPDATE SET
      task_order = COALESCE(excluded.task_order, task_order),
      notes = COALESCE(excluded.notes, notes),
      reflection = COALESCE(excluded.reflection, reflection),
      energy_pattern = COALESCE(excluded.energy_pattern, energy_pattern),
      planned_minutes = COALESCE(excluded.planned_minutes, planned_minutes),
      completed_minutes = COALESCE(excluded.completed_minutes, completed_minutes),
      updated_at = datetime('now')`).run(
        id, userId, date, JSON.stringify(data.task_order || []),
        data.notes || '', data.reflection || '', data.energy_pattern || 'balanced',
        data.planned_minutes || 0, data.completed_minutes || 0
    );
    return getDailyPlan(userId, date);
}

// ─── Activity Log ───

export function logActivity(userId: string, action: string, entityType?: string, entityId?: string, details?: Record<string, unknown>) {
    const db = getDb();
    const id = uuidv4();
    db.prepare('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, userId, action, entityType || null, entityId || null, JSON.stringify(details || {}));
}

export function getActivityLog(userId: string, limit = 100) {
    const db = getDb();
    const logs = db.prepare('SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit) as any[];
    return logs.map(l => ({ ...l, details: JSON.parse(l.details || '{}') }));
}

// ─── Analytics / Insights ───

export function getUserStats(userId: string) {
    const db = getDb();
    const totalTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?').get(userId) as any).count;
    const completedTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'completed'").get(userId) as any).count;
    const pendingTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status IN ('pending','in_progress')").get(userId) as any).count;
    const activeGoals = (db.prepare("SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND status = 'active'").get(userId) as any).count;
    const activeProjects = (db.prepare("SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status = 'active'").get(userId) as any).count;

    const recentSessions = db.prepare(`SELECT AVG(duration_minutes) as avg_duration, AVG(focus_rating) as avg_focus,
    COUNT(*) as session_count FROM work_sessions WHERE user_id = ? AND ended_at IS NOT NULL
    AND created_at > datetime('now', '-30 day')`).get(userId) as any;

    const completionsByDay = db.prepare(`SELECT date(completed_at) as day, COUNT(*) as count
    FROM tasks WHERE user_id = ? AND status = 'completed' AND completed_at > datetime('now', '-30 day')
    GROUP BY date(completed_at) ORDER BY day`).all(userId) as any[];

    const overdueTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status IN ('pending','in_progress') AND due_date < date('now')").get(userId) as any).count;

    return {
        totalTasks, completedTasks, pendingTasks, activeGoals, activeProjects, overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        avgSessionDuration: Math.round(recentSessions?.avg_duration || 0),
        avgFocusRating: Math.round((recentSessions?.avg_focus || 0) * 10) / 10,
        recentSessionCount: recentSessions?.session_count || 0,
        completionsByDay
    };
}

// ─── AI Conversation Persistence ───

export function saveConversation(userId: string, conversationId: string, messages: any[], context?: Record<string, unknown>) {
    const db = getDb();
    db.prepare(`INSERT INTO ai_conversations (id, user_id, messages, context)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET messages = excluded.messages, context = excluded.context, updated_at = datetime('now')`)
        .run(conversationId, userId, JSON.stringify(messages), JSON.stringify(context || {}));
}

export function getConversation(conversationId: string) {
    const db = getDb();
    const conv = db.prepare('SELECT * FROM ai_conversations WHERE id = ?').get(conversationId) as any;
    if (!conv) return null;
    return { ...conv, messages: JSON.parse(conv.messages || '[]'), context: JSON.parse(conv.context || '{}') };
}

export function getRecentConversations(userId: string, limit = 10) {
    const db = getDb();
    const convs = db.prepare('SELECT id, user_id, created_at, updated_at FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?')
        .all(userId, limit) as any[];
    return convs;
}

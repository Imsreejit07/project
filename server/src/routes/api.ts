import { Router, Request, Response } from 'express';
import * as ops from '../db/operations.js';
import { generateDailyPlan, suggestNextActions, analyzePatterns } from '../ai/planningEngine.js';
import { processMessage } from '../ai/assistant.js';

const router = Router();

// Middleware to extract userId (simplified - in production, use auth)
function getUserId(req: Request): string {
    return (req.headers['x-user-id'] as string) || 'default-user';
}

// ─── User ───

router.get('/user', (req: Request, res: Response) => {
    const user = ops.getOrCreateUser(getUserId(req));
    res.json(user);
});

router.put('/user/settings', (req: Request, res: Response) => {
    ops.updateUserSettings(getUserId(req), req.body);
    res.json({ success: true });
});

// ─── Goals ───

router.get('/goals', (req: Request, res: Response) => {
    const goals = ops.getGoals(getUserId(req), req.query.status as string);
    res.json(goals);
});

router.post('/goals', (req: Request, res: Response) => {
    const goal = ops.createGoal(getUserId(req), req.body);
    res.status(201).json(goal);
});

router.get('/goals/:id', (req: Request, res: Response) => {
    const goal = ops.getGoal(req.params.id as string);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    res.json(goal);
});

router.put('/goals/:id', (req: Request, res: Response) => {
    const goal = ops.updateGoal(req.params.id as string, req.body);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    res.json(goal);
});

router.delete('/goals/:id', (req: Request, res: Response) => {
    ops.deleteGoal(req.params.id as string);
    res.json({ success: true });
});

// ─── Projects ───

router.get('/projects', (req: Request, res: Response) => {
    const projects = ops.getProjects(getUserId(req), req.query.goal_id as string, req.query.status as string);
    res.json(projects);
});

router.post('/projects', (req: Request, res: Response) => {
    const project = ops.createProject(getUserId(req), req.body);
    res.status(201).json(project);
});

router.get('/projects/:id', (req: Request, res: Response) => {
    const project = ops.getProject(req.params.id as string);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
});

router.put('/projects/:id', (req: Request, res: Response) => {
    const project = ops.updateProject(req.params.id as string, req.body);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
});

router.delete('/projects/:id', (req: Request, res: Response) => {
    ops.deleteProject(req.params.id as string);
    res.json({ success: true });
});

// ─── Tasks ───

router.get('/tasks', (req: Request, res: Response) => {
    const tasks = ops.getTasks(getUserId(req), {
        status: req.query.status as string,
        project_id: req.query.project_id as string,
        goal_id: req.query.goal_id as string,
        scheduled_date: req.query.scheduled_date as string,
        due_before: req.query.due_before as string,
    });
    res.json(tasks);
});

router.post('/tasks', (req: Request, res: Response) => {
    const task = ops.createTask(getUserId(req), req.body);
    res.status(201).json(task);
});

router.get('/tasks/:id', (req: Request, res: Response) => {
    const task = ops.getTask(req.params.id as string);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

router.put('/tasks/:id', (req: Request, res: Response) => {
    const task = ops.updateTask(req.params.id as string, req.body);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

router.delete('/tasks/:id', (req: Request, res: Response) => {
    ops.deleteTask(req.params.id as string);
    res.json({ success: true });
});

// ─── Work Sessions ───

router.post('/sessions/start', (req: Request, res: Response) => {
    const session = ops.startWorkSession(getUserId(req), req.body.task_id);
    res.status(201).json(session);
});

router.post('/sessions/:id/end', (req: Request, res: Response) => {
    const session = ops.endWorkSession(req.params.id as string, req.body);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
});

router.get('/sessions', (req: Request, res: Response) => {
    const sessions = ops.getWorkSessions(getUserId(req), Number(req.query.limit) || 50);
    res.json(sessions);
});

// ─── Daily Plans ───

router.get('/plans/:date', (req: Request, res: Response) => {
    const plan = ops.getDailyPlan(getUserId(req), req.params.date as string);
    res.json(plan || { date: req.params.date, task_order: [], notes: '' });
});

router.put('/plans/:date', (req: Request, res: Response) => {
    const plan = ops.upsertDailyPlan(getUserId(req), req.params.date as string, req.body);
    res.json(plan);
});

// ─── AI Planning ───

router.post('/ai/plan', (req: Request, res: Response) => {
    const userId = getUserId(req);
    const date = req.body.date || new Date().toISOString().split('T')[0];
    const availableMinutes = req.body.available_minutes || 480;
    const plan = generateDailyPlan(userId, date, availableMinutes);

    // Save plan
    ops.upsertDailyPlan(userId, date, {
        task_order: plan.suggestions.map(s => s.task_id),
        planned_minutes: plan.total_minutes,
    });

    res.json(plan);
});

router.get('/ai/suggestions', (req: Request, res: Response) => {
    const suggestions = suggestNextActions(getUserId(req), Number(req.query.count) || 3);
    res.json(suggestions);
});

router.get('/ai/patterns', (req: Request, res: Response) => {
    const patterns = analyzePatterns(getUserId(req));
    res.json(patterns);
});

// ─── AI Chat ───

router.post('/ai/chat', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { message, conversation_id } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }
        const result = await processMessage(userId, conversation_id || null, message);
        res.json(result);
    } catch (error: any) {
        console.error('AI Chat error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

router.get('/ai/conversations', (req: Request, res: Response) => {
    const conversations = ops.getRecentConversations(getUserId(req));
    res.json(conversations);
});

// ─── Analytics ───

router.get('/stats', (req: Request, res: Response) => {
    const stats = ops.getUserStats(getUserId(req));
    res.json(stats);
});

router.get('/activity', (req: Request, res: Response) => {
    const log = ops.getActivityLog(getUserId(req), Number(req.query.limit) || 100);
    res.json(log);
});

export default router;

import { Router, Request, Response } from 'express';
import * as ops from '../db/operations.js';
import { generateDailyPlan, suggestNextActions, analyzePatterns } from '../ai/planningEngine.js';
import { processMessage } from '../ai/assistant.js';
import { requireAuthWithPlan, planLimiter, AuthRequest } from '../auth/middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuthWithPlan);

// ─── User ───

router.get('/user', async (req: Request, res: Response) => {
    const user = await ops.getOrCreateUser((req as AuthRequest).userId);
    res.json(user);
});

router.put('/user/settings', async (req: Request, res: Response) => {
    await ops.updateUserSettings((req as AuthRequest).userId, req.body);
    res.json({ success: true });
});

// ─── Goals ───

router.get('/goals', async (req: Request, res: Response) => {
    const goals = await ops.getGoals((req as AuthRequest).userId, req.query.status as string);
    res.json(goals);
});

router.post('/goals', planLimiter('goals', 3), async (req: Request, res: Response) => {
    const goal = await ops.createGoal((req as AuthRequest).userId, req.body);
    res.status(201).json(goal);
});

router.get('/goals/:id', async (req: Request, res: Response) => {
    const goal = await ops.getGoal(req.params.id as string);
    if (!goal || goal.user_id !== (req as AuthRequest).userId) return res.status(404).json({ error: 'Goal not found' });
    res.json(goal);
});

router.put('/goals/:id', async (req: Request, res: Response) => {
    const existing = await ops.getGoal(req.params.id as string);
    if (!existing || existing.user_id !== (req as AuthRequest).userId) return res.status(404).json({ error: 'Goal not found' });
    const goal = await ops.updateGoal(req.params.id as string, req.body);
    res.json(goal);
});

router.delete('/goals/:id', async (req: Request, res: Response) => {
    const existing = await ops.getGoal(req.params.id as string);
    if (!existing || existing.user_id !== (req as AuthRequest).userId) return res.status(404).json({ error: 'Goal not found' });
    await ops.deleteGoal(req.params.id as string);
    res.json({ success: true });
});

// ─── Projects ───

router.get('/projects', async (req: Request, res: Response) => {
    const projects = await ops.getProjects((req as AuthRequest).userId, req.query.goal_id as string, req.query.status as string);
    res.json(projects);
});

router.post('/projects', planLimiter('projects', 1), async (req: Request, res: Response) => {
    const project = await ops.createProject((req as AuthRequest).userId, req.body);
    res.status(201).json(project);
});

router.get('/projects/:id', async (req: Request, res: Response) => {
    const project = await ops.getProject(req.params.id as string);
    if (!project || project.user_id !== (req as AuthRequest).userId) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
});

router.put('/projects/:id', async (req: Request, res: Response) => {
    const existing = await ops.getProject(req.params.id as string);
    if (!existing || existing.user_id !== (req as AuthRequest).userId) return res.status(404).json({ error: 'Project not found' });
    const project = await ops.updateProject(req.params.id as string, req.body);
    res.json(project);
});

router.delete('/projects/:id', async (req: Request, res: Response) => {
    const existing = await ops.getProject(req.params.id as string);
    if (!existing || existing.user_id !== (req as AuthRequest).userId) return res.status(404).json({ error: 'Project not found' });
    await ops.deleteProject(req.params.id as string);
    res.json({ success: true });
});

// ─── Tasks ───

router.get('/tasks', async (req: Request, res: Response) => {
    const tasks = await ops.getTasks((req as AuthRequest).userId, {
        status: req.query.status as string,
        project_id: req.query.project_id as string,
        goal_id: req.query.goal_id as string,
        scheduled_date: req.query.scheduled_date as string,
        due_before: req.query.due_before as string,
    });
    res.json(tasks);
});

router.post('/tasks', planLimiter('tasks', 10), async (req: Request, res: Response) => {
    const task = await ops.createTask((req as AuthRequest).userId, req.body);
    res.status(201).json(task);
});

router.get('/tasks/:id', async (req: Request, res: Response) => {
    const task = await ops.getTask(req.params.id as string);
    if (!task || task.user_id !== (req as AuthRequest).userId) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

router.put('/tasks/:id', async (req: Request, res: Response) => {
    const existing = await ops.getTask(req.params.id as string);
    if (!existing || existing.user_id !== (req as AuthRequest).userId) return res.status(404).json({ error: 'Task not found' });
    const task = await ops.updateTask(req.params.id as string, req.body);
    res.json(task);
});

router.delete('/tasks/:id', async (req: Request, res: Response) => {
    const existing = await ops.getTask(req.params.id as string);
    if (!existing || existing.user_id !== (req as AuthRequest).userId) return res.status(404).json({ error: 'Task not found' });
    await ops.deleteTask(req.params.id as string);
    res.json({ success: true });
});

// ─── Work Sessions ───

router.post('/sessions/start', async (req: Request, res: Response) => {
    const session = await ops.startWorkSession((req as AuthRequest).userId, req.body.task_id);
    res.status(201).json(session);
});

router.post('/sessions/:id/end', async (req: Request, res: Response) => {
    const session = await ops.endWorkSession(req.params.id as string, req.body);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
});

router.get('/sessions', async (req: Request, res: Response) => {
    const sessions = await ops.getWorkSessions((req as AuthRequest).userId, Number(req.query.limit) || 50);
    res.json(sessions);
});

// ─── Daily Plans ───

router.get('/plans/:date', async (req: Request, res: Response) => {
    const plan = await ops.getDailyPlan((req as AuthRequest).userId, req.params.date as string);
    res.json(plan || { date: req.params.date, task_order: [], notes: '' });
});

router.put('/plans/:date', async (req: Request, res: Response) => {
    const plan = await ops.upsertDailyPlan((req as AuthRequest).userId, req.params.date as string, req.body);
    res.json(plan);
});

// ─── AI Planning ───

router.post('/ai/plan', async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).userId;
    const date = req.body.date || new Date().toISOString().split('T')[0];
    const availableMinutes = req.body.available_minutes || 480;
    const plan = await generateDailyPlan(userId, date, availableMinutes);

    await ops.upsertDailyPlan(userId, date, {
        task_order: plan.suggestions.map(s => s.task_id),
        planned_minutes: plan.total_minutes,
    });

    res.json(plan);
});

router.get('/ai/suggestions', async (req: Request, res: Response) => {
    const suggestions = await suggestNextActions((req as AuthRequest).userId, Number(req.query.count) || 3);
    res.json(suggestions);
});

router.get('/ai/patterns', async (req: Request, res: Response) => {
    const patterns = await analyzePatterns((req as AuthRequest).userId);
    res.json(patterns);
});

// ─── AI Chat ───

router.post('/ai/chat', aiLimiter, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId;
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

router.get('/ai/conversations', async (req: Request, res: Response) => {
    const conversations = await ops.getRecentConversations((req as AuthRequest).userId);
    res.json(conversations);
});

// ─── Analytics ───

router.get('/stats', async (req: Request, res: Response) => {
    const stats = await ops.getUserStats((req as AuthRequest).userId);
    res.json(stats);
});

router.get('/activity', async (req: Request, res: Response) => {
    const log = await ops.getActivityLog((req as AuthRequest).userId, Number(req.query.limit) || 100);
    res.json(log);
});

export default router;

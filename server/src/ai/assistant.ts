import * as ops from '../db/operations.js';
import { generateDailyPlan, suggestNextActions, analyzePatterns } from './planningEngine.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

type ConversationMessage = { role: 'user' | 'assistant'; content: string };

function getGeminiModel() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
}

async function buildSystemContext(userId: string): Promise<string> {
    const stats = await ops.getUserStats(userId);
    const goals = await ops.getGoals(userId, 'active');
    const projects = await ops.getProjects(userId, undefined, 'active');
    const pendingTasks = await ops.getTasks(userId, { status: 'pending' });
    const inProgressTasks = await ops.getTasks(userId, { status: 'in_progress' });
    const today = new Date().toISOString().split('T')[0];

    return `You are FlowState AI, an action-oriented productivity assistant.
Date: ${today}
Active Goals (${goals.length}): ${goals.map((g: any) => g.title).join(', ') || 'None'}
Active Projects (${projects.length}): ${projects.map((p: any) => p.title).join(', ') || 'None'}
Pending Tasks: ${pendingTasks.length}
In-Progress Tasks: ${inProgressTasks.length}
Overdue Tasks: ${stats.overdueTasks}
Completion Rate: ${stats.completionRate}%

CAPABILITIES - include JSON command wrapped in <action>...</action> when needed:
1) Create task: {"action":"create_task","title":"...","priority":0-5,"energy_level":"low|medium|high","estimated_minutes":30,"due_date":"YYYY-MM-DD","project_id":"...","goal_id":"..."}
2) Update task: {"action":"update_task","task_id":"...","status":"pending|in_progress|completed|cancelled|deferred","priority":0-5}
3) Create goal: {"action":"create_goal","title":"...","description":"...","priority":0-5,"target_date":"YYYY-MM-DD"}
4) Create project: {"action":"create_project","title":"...","goal_id":"...","priority":0-5}
5) Plan day: {"action":"plan_day","available_minutes":480}
6) Suggest next: {"action":"suggest_next"}
7) Analyze patterns: {"action":"analyze_patterns"}

Rules:
- Keep responses concise and practical.
- Use actions when user asks for concrete operations.
- Do not invent fake IDs.`;
}

export async function processMessage(userId: string, conversationId: string | null, userMessage: string): Promise<{ response: string; actions: any[]; conversationId: string; }> {
    const convId = conversationId || crypto.randomUUID();
    const existing = conversationId ? await ops.getConversation(conversationId) : null;
    const history = (existing?.messages || []) as ConversationMessage[];
    const messages = [...history, { role: 'user' as const, content: userMessage }].slice(-16);

    let assistantContent = await generateFallbackResponse(userId, userMessage);
    const model = getGeminiModel();

    if (model) {
        try {
            const system = await buildSystemContext(userId);
            const prompt = `${system}\n\nConversation:\n${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\nASSISTANT:`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text) assistantContent = text;
        } catch (err) {
            console.error('Gemini error, using fallback:', err);
        }
    }

    const { cleanResponse, actions } = await extractAndExecuteActions(userId, assistantContent);
    const updatedMessages = [...messages, { role: 'assistant' as const, content: assistantContent }];
    await ops.saveConversation(userId, convId, updatedMessages);
    ops.logActivity(userId, 'ai_chat', 'conversation', convId, { message_count: updatedMessages.length });

    return { response: cleanResponse, actions, conversationId: convId };
}

async function extractAndExecuteActions(userId: string, response: string): Promise<{ cleanResponse: string; actions: any[] }> {
    const actionRegex = /<action>([\s\S]*?)<\/action>/g;
    const actions: any[] = [];
    let match;

    while ((match = actionRegex.exec(response)) !== null) {
        try {
            const action = JSON.parse(match[1].trim());
            const result = await executeAction(userId, action);
            actions.push({ ...action, result });
        } catch {
            // Ignore malformed action blocks
        }
    }

    return { cleanResponse: response.replace(actionRegex, '').trim(), actions };
}

async function executeAction(userId: string, action: any): Promise<any> {
    switch (action.action) {
        case 'create_task':
            return ops.createTask(userId, {
                title: action.title,
                description: action.description,
                project_id: action.project_id,
                goal_id: action.goal_id,
                priority: action.priority ?? 0,
                energy_level: action.energy_level ?? 'medium',
                estimated_minutes: action.estimated_minutes ?? 30,
                due_date: action.due_date,
                scheduled_date: action.scheduled_date,
                scheduled_slot: action.scheduled_slot,
                tags: action.tags,
            });
        case 'update_task':
            return ops.updateTask(action.task_id, {
                title: action.title,
                status: action.status,
                priority: action.priority,
                due_date: action.due_date,
                scheduled_date: action.scheduled_date,
            });
        case 'create_goal':
            return ops.createGoal(userId, {
                title: action.title,
                description: action.description,
                vision: action.vision,
                priority: action.priority ?? 0,
                target_date: action.target_date,
                tags: action.tags,
            });
        case 'create_project':
            return ops.createProject(userId, {
                title: action.title,
                description: action.description,
                goal_id: action.goal_id,
                priority: action.priority ?? 0,
                deadline: action.deadline,
                tags: action.tags,
            });
        case 'plan_day': {
            const plan = await generateDailyPlan(userId, new Date().toISOString().split('T')[0], action.available_minutes || 480);
            await ops.upsertDailyPlan(userId, plan.date, {
                task_order: plan.suggestions.map(s => s.task_id),
                planned_minutes: plan.total_minutes,
            });
            return plan;
        }
        case 'suggest_next':
            return suggestNextActions(userId);
        case 'analyze_patterns':
            return analyzePatterns(userId);
        default:
            return null;
    }
}

async function generateFallbackResponse(userId: string, message: string): Promise<string> {
    const lower = message.toLowerCase();
    const today = new Date().toISOString().split('T')[0];

    if (lower.includes('plan') && (lower.includes('day') || lower.includes('today') || lower.includes('schedule'))) {
        const plan = await generateDailyPlan(userId, today);
        if (plan.suggestions.length === 0) return 'No pending tasks to plan yet. Add tasks and I will schedule them.';
        const grouped: Record<string, typeof plan.suggestions> = { morning: [], afternoon: [], evening: [] };
        for (const s of plan.suggestions) grouped[s.slot].push(s);
        let response = "Here is your plan for today:\n\n";
        for (const [slot, items] of Object.entries(grouped)) {
            if (!items.length) continue;
            response += `${slot.toUpperCase()}:\n`;
            for (const t of items) response += `- ${t.title} (~${t.estimated_minutes}m) - ${t.reason}\n`;
            response += '\n';
        }
        response += `<action>{"action":"plan_day","available_minutes":480}</action>`;
        return response;
    }

    if (lower.includes('next') || lower.includes('focus') || lower.includes('suggest')) {
        const suggestions = await suggestNextActions(userId, 3);
        if (!suggestions.length) return 'You have no pending tasks. Want me to create your top 3 priorities?';
        return `Focus next on:\n${suggestions.map((s: any, i: number) => `${i + 1}. ${s.task.title} - ${s.reason}`).join('\n')}`;
    }

    if (lower.includes('status') || lower.includes('overview') || lower.includes('progress')) {
        const stats = await ops.getUserStats(userId);
        return `Overview:\n- Completed: ${stats.completedTasks} (${stats.completionRate}%)\n- Pending: ${stats.pendingTasks}\n- Overdue: ${stats.overdueTasks}\n- Active goals: ${stats.activeGoals}`;
    }

    if (lower.includes('add') || lower.includes('create') || lower.includes('new task') || lower.includes('remind')) {
        const title = message.replace(/^(add|create|new task|remind me to)\s*/i, '').trim();
        if (title.length > 2) {
            return `Creating task now.\n<action>{"action":"create_task","title":"${title.replace(/"/g, '\\"')}","priority":1,"estimated_minutes":30}</action>`;
        }
        return 'Tell me the task title and I will create it.';
    }

    if (lower.includes('pattern') || lower.includes('analytics') || lower.includes('insight')) {
        return `Analyzing your patterns now.\n<action>{"action":"analyze_patterns"}</action>`;
    }

    return 'I can plan your day, suggest next actions, create tasks/goals/projects, and analyze productivity patterns. Try: Plan my day.';
}

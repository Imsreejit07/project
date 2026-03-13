import OpenAI from 'openai';
import * as ops from '../db/operations.js';
import { generateDailyPlan, suggestNextActions, analyzePatterns } from './planningEngine.js';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

function buildSystemContext(userId: string): string {
    const stats = ops.getUserStats(userId);
    const goals = ops.getGoals(userId, 'active');
    const projects = ops.getProjects(userId, undefined, 'active');
    const pendingTasks = ops.getTasks(userId, { status: 'pending' });
    const inProgressTasks = ops.getTasks(userId, { status: 'in_progress' });
    const today = new Date().toISOString().split('T')[0];
    const dailyPlan = ops.getDailyPlan(userId, today);

    return `You are FlowState AI, an intelligent productivity assistant. You help users organize their work, plan their days, and make progress toward meaningful goals. You are direct, supportive, and action-oriented.

CURRENT STATE:
- Date: ${today}
- Active Goals (${goals.length}): ${goals.map(g => `"${g.title}" (priority: ${g.priority})`).join(', ') || 'None'}
- Active Projects (${projects.length}): ${projects.map(p => `"${p.title}"`).join(', ') || 'None'}
- Pending Tasks: ${pendingTasks.length}
- In-Progress Tasks: ${inProgressTasks.length}
- Overdue Tasks: ${stats.overdueTasks}
- Completion Rate: ${stats.completionRate}%
- Tasks Completed (all time): ${stats.completedTasks}

${dailyPlan ? `TODAY'S PLAN: ${dailyPlan.task_order.length} tasks planned` : 'No plan for today yet.'}

TOP PENDING TASKS:
${pendingTasks.slice(0, 10).map(t => `- "${t.title}" (priority: ${t.priority}, due: ${t.due_date || 'no deadline'}, energy: ${t.energy_level}, est: ${t.estimated_minutes}min)`).join('\n') || 'None'}

IN PROGRESS:
${inProgressTasks.map(t => `- "${t.title}"`).join('\n') || 'None'}

CAPABILITIES - You can perform these actions by including JSON commands in your response:
1. Create tasks: {"action":"create_task","title":"...","priority":0-5,"energy_level":"low|medium|high","estimated_minutes":30,"due_date":"YYYY-MM-DD","project_id":"...","goal_id":"..."}
2. Update tasks: {"action":"update_task","task_id":"...","status":"pending|in_progress|completed|cancelled","priority":0-5}
3. Create goals: {"action":"create_goal","title":"...","description":"...","priority":0-5,"target_date":"YYYY-MM-DD"}
4. Create projects: {"action":"create_project","title":"...","goal_id":"...","priority":0-5}
5. Plan the day: {"action":"plan_day","available_minutes":480}
6. Get suggestions: {"action":"suggest_next"}
7. Analyze patterns: {"action":"analyze_patterns"}

When you want to perform an action, include the JSON command wrapped in <action>...</action> tags in your response. You can include multiple actions.

GUIDELINES:
- Be concise but warm. Use short paragraphs.
- When the user asks to plan their day, use the plan_day action and explain the plan.
- When creating tasks from user descriptions, infer reasonable defaults for priority, energy level, and time estimates.
- Proactively suggest connecting tasks to goals when relevant.
- If the user seems overwhelmed, help them focus on just 2-3 important things.
- Don't be overly chatty. Be efficient and action-oriented.`;
}

export async function processMessage(userId: string, conversationId: string | null, userMessage: string): Promise<{
    response: string;
    actions: any[];
    conversationId: string;
}> {
    const convId = conversationId || uuidv4();
    const existing = conversationId ? ops.getConversation(conversationId) : null;
    const messages: Message[] = existing?.messages || [];

    const systemMessage = buildSystemContext(userId);
    messages.push({ role: 'user', content: userMessage });

    // Keep conversation history manageable (last 20 messages)
    const recentMessages = messages.slice(-20);

    const apiKey = process.env.OPENAI_API_KEY;
    let assistantContent: string;

    if (apiKey) {
        try {
            const completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemMessage },
                    ...recentMessages
                ],
                temperature: 0.7,
                max_tokens: 1500,
            });
            assistantContent = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
        } catch (error: any) {
            assistantContent = generateFallbackResponse(userId, userMessage);
        }
    } else {
        assistantContent = generateFallbackResponse(userId, userMessage);
    }

    // Extract and execute actions from the AI response
    const { cleanResponse, actions } = extractAndExecuteActions(userId, assistantContent);

    messages.push({ role: 'assistant', content: assistantContent });
    ops.saveConversation(userId, convId, messages);
    ops.logActivity(userId, 'ai_chat', 'conversation', convId, { message_count: messages.length });

    return { response: cleanResponse, actions, conversationId: convId };
}

function extractAndExecuteActions(userId: string, response: string): { cleanResponse: string; actions: any[] } {
    const actionRegex = /<action>([\s\S]*?)<\/action>/g;
    const actions: any[] = [];
    let match;

    while ((match = actionRegex.exec(response)) !== null) {
        try {
            const action = JSON.parse(match[1].trim());
            const result = executeAction(userId, action);
            actions.push({ ...action, result });
        } catch (e) {
            // Skip malformed actions
        }
    }

    const cleanResponse = response.replace(actionRegex, '').trim();
    return { cleanResponse, actions };
}

function executeAction(userId: string, action: any): any {
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
            const plan = generateDailyPlan(userId, new Date().toISOString().split('T')[0], action.available_minutes || 480);
            ops.upsertDailyPlan(userId, plan.date, {
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

/**
 * Generates an intelligent response without an external AI API,
 * using the planning engine and local data analysis.
 */
function generateFallbackResponse(userId: string, message: string): string {
    const lower = message.toLowerCase();
    const today = new Date().toISOString().split('T')[0];

    // Plan the day
    if (lower.includes('plan') && (lower.includes('day') || lower.includes('today') || lower.includes('schedule'))) {
        const plan = generateDailyPlan(userId, today);
        if (plan.suggestions.length === 0) {
            return "You don't have any pending tasks to plan. Let's add some first! Tell me what you need to work on today.";
        }
        let response = "Here's your optimized plan for today:\n\n";
        const bySlot: Record<string, typeof plan.suggestions> = { morning: [], afternoon: [], evening: [] };
        for (const s of plan.suggestions) bySlot[s.slot].push(s);

        for (const [slot, tasks] of Object.entries(bySlot)) {
            if (tasks.length === 0) continue;
            response += `**${slot.charAt(0).toUpperCase() + slot.slice(1)}:**\n`;
            for (const t of tasks) {
                response += `• ${t.title} (~${t.estimated_minutes}min) — ${t.reason}\n`;
            }
            response += '\n';
        }
        response += `Total: ~${plan.total_minutes} minutes of planned work.\n`;
        if (plan.insights.length > 0) {
            response += `\n💡 ${plan.insights[0]}`;
        }

        response += `\n\n<action>{"action":"plan_day","available_minutes":480}</action>`;
        return response;
    }

    // What should I work on / focus on
    if (lower.includes('what should') || lower.includes('focus') || lower.includes('next') || lower.includes('suggest')) {
        const suggestions = suggestNextActions(userId, 3);
        if (suggestions.length === 0) {
            return "You don't have any pending tasks. What would you like to work on? I can help you create tasks and organize them.";
        }
        let response = "Here's what I'd suggest focusing on:\n\n";
        suggestions.forEach((s, i) => {
            response += `${i + 1}. **${s.task.title}** — ${s.reason}\n`;
        });
        response += "\nWould you like to start on any of these?";
        return response;
    }

    // Status / overview
    if (lower.includes('status') || lower.includes('overview') || lower.includes('how am i') || lower.includes('progress')) {
        const stats = ops.getUserStats(userId);
        const goals = ops.getGoals(userId, 'active');
        let response = "Here's your current overview:\n\n";
        response += `📊 **Stats:** ${stats.completedTasks} tasks completed (${stats.completionRate}% completion rate)\n`;
        response += `📋 **Pending:** ${stats.pendingTasks} tasks remaining\n`;
        if (stats.overdueTasks > 0) response += `⚠️ **Overdue:** ${stats.overdueTasks} tasks need attention\n`;
        response += `🎯 **Active Goals:** ${stats.activeGoals}\n`;
        response += `📁 **Active Projects:** ${stats.activeProjects}\n`;
        if (stats.avgFocusRating > 0) response += `🧠 **Avg Focus:** ${stats.avgFocusRating}/5\n`;
        if (goals.length > 0) {
            response += '\n**Your Goals:**\n';
            goals.forEach(g => { response += `• ${g.title}\n`; });
        }
        return response;
    }

    // Create/add task
    if (lower.includes('add') || lower.includes('create') || lower.includes('new task') || lower.includes('remind')) {
        // Try to extract a task title from the message
        const title = message.replace(/^(add|create|new task|remind me to)\s*/i, '').trim();
        if (title.length > 2) {
            return `I'll create that task for you.\n\n<action>{"action":"create_task","title":"${title.replace(/"/g, '\\"')}","priority":1,"estimated_minutes":30}</action>\n\nDone! I've added "${title}" to your tasks. Would you like to set a deadline or priority?`;
        }
        return "What task would you like to create? Give me a description and I'll set it up with smart defaults.";
    }

    // Analyze patterns
    if (lower.includes('pattern') || lower.includes('analytics') || lower.includes('insight') || lower.includes('habit')) {
        return `Let me analyze your work patterns.\n\n<action>{"action":"analyze_patterns"}</action>`;
    }

    // General greeting / help
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower === 'help') {
        const stats = ops.getUserStats(userId);
        let response = "Hey! I'm your FlowState assistant. Here's what I can help you with:\n\n";
        response += "• **\"Plan my day\"** — I'll create an optimized daily schedule\n";
        response += "• **\"What should I focus on?\"** — I'll suggest your top priorities\n";
        response += "• **\"Add [task]\"** — Quick task creation with smart defaults\n";
        response += "• **\"Show my status\"** — Overview of your progress and goals\n";
        response += "• **\"Analyze my patterns\"** — Insights into your work habits\n";
        if (stats.pendingTasks > 0) {
            response += `\nYou have ${stats.pendingTasks} pending tasks. Want me to help plan your day?`;
        }
        return response;
    }

    // Default response
    return "I can help you plan your day, suggest what to work on next, create tasks and goals, or analyze your productivity patterns. What would you like to do?";
}

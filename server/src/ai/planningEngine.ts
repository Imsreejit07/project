import { getTasks, getGoals, getProjects, getUserStats, getWorkSessions } from '../db/operations.js';

export interface PlanSuggestion {
    task_id: string;
    title: string;
    reason: string;
    slot: 'morning' | 'afternoon' | 'evening';
    estimated_minutes: number;
    priority_score: number;
}

export interface DailyPlanResult {
    date: string;
    suggestions: PlanSuggestion[];
    total_minutes: number;
    insights: string[];
    focus_theme?: string;
}

export async function generateDailyPlan(userId: string, date: string, availableMinutes = 480): Promise<DailyPlanResult> {
    const tasks = (await getTasks(userId, { status: 'pending' })).concat(await getTasks(userId, { status: 'in_progress' }));
    const goals = await getGoals(userId, 'active');
    const stats = await getUserStats(userId);
    const sessions = await getWorkSessions(userId, 30);

    const energyPattern = inferEnergyPattern(sessions as any[]);
    const scoredTasks = tasks.map((task: any) => ({ ...task, score: calculatePriorityScore(task, goals as any[], date, stats) }))
        .sort((a: any, b: any) => b.score - a.score);

    const suggestions: PlanSuggestion[] = [];
    let totalMinutes = 0;

    for (const task of scoredTasks) {
        if (totalMinutes + task.estimated_minutes > availableMinutes) continue;
        const slot = assignTimeSlot(task, energyPattern, suggestions);
        suggestions.push({
            task_id: task.id,
            title: task.title,
            reason: generateReason(task, goals as any[]),
            slot,
            estimated_minutes: task.estimated_minutes,
            priority_score: task.score,
        });
        totalMinutes += task.estimated_minutes;
    }

    const slotOrder = { morning: 0, afternoon: 1, evening: 2 };
    suggestions.sort((a, b) => slotOrder[a.slot] - slotOrder[b.slot] || b.priority_score - a.priority_score);

    const insights = generateInsights(tasks as any[], stats, goals as any[]);
    const focusTheme = determineFocusTheme(suggestions, goals as any[]);

    return { date, suggestions, total_minutes: totalMinutes, insights, focus_theme: focusTheme };
}

function calculatePriorityScore(task: any, goals: any[], date: string, stats: any): number {
    let score = task.priority * 10;
    if (task.due_date) {
        const daysUntilDue = Math.max(0, (new Date(task.due_date).getTime() - new Date(date).getTime()) / 86400000);
        if (daysUntilDue <= 0) score += 50;
        else if (daysUntilDue <= 1) score += 40;
        else if (daysUntilDue <= 3) score += 25;
        else if (daysUntilDue <= 7) score += 10;
    }
    if (task.goal_id) {
        const goal = goals.find(g => g.id === task.goal_id);
        if (goal) score += 15 + (goal.priority * 5);
    }
    if (task.project_id) score += 5;
    if (task.status === 'in_progress') score += 20;
    if (task.scheduled_date === date) score += 30;
    const ageInDays = (new Date(date).getTime() - new Date(task.created_at).getTime()) / 86400000;
    score += Math.min(10, Math.floor(ageInDays / 3));
    return Math.round(score);
}

function inferEnergyPattern(sessions: any[]): { morning: string; afternoon: string; evening: string } {
    if (sessions.length < 5) return { morning: 'high', afternoon: 'medium', evening: 'low' };
    const bySlot = { morning: [] as number[], afternoon: [] as number[], evening: [] as number[] };
    for (const session of sessions) {
        if (!session.started_at || !session.focus_score) continue;
        const hour = new Date(session.started_at).getHours();
        const slot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        bySlot[slot].push(session.focus_score);
    }
    const avgFocus = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 3;
    const toLevel = (avg: number) => avg >= 4 ? 'high' : avg >= 2.5 ? 'medium' : 'low';
    return {
        morning: toLevel(avgFocus(bySlot.morning)),
        afternoon: toLevel(avgFocus(bySlot.afternoon)),
        evening: toLevel(avgFocus(bySlot.evening)),
    };
}

function assignTimeSlot(task: any, energyPattern: any, existing: PlanSuggestion[]): 'morning' | 'afternoon' | 'evening' {
    const slotMinutes = { morning: 0, afternoon: 0, evening: 0 };
    for (const s of existing) slotMinutes[s.slot] += s.estimated_minutes;

    if (task.energy_level === 'high') {
        if (energyPattern.morning === 'high' && slotMinutes.morning < 180) return 'morning';
        if (energyPattern.afternoon === 'high' && slotMinutes.afternoon < 180) return 'afternoon';
    }
    if (task.energy_level === 'low') {
        if (energyPattern.evening === 'low' && slotMinutes.evening < 120) return 'evening';
        if (energyPattern.afternoon === 'medium' && slotMinutes.afternoon < 180) return 'afternoon';
    }
    if (task.scheduled_slot && slotMinutes[task.scheduled_slot as keyof typeof slotMinutes] < 180) {
        return task.scheduled_slot;
    }
    const entries = Object.entries(slotMinutes) as [('morning' | 'afternoon' | 'evening'), number][];
    entries.sort((a, b) => a[1] - b[1]);
    return entries[0][0];
}

function generateReason(task: any, goals: any[]): string {
    const reasons: string[] = [];
    if (task.status === 'in_progress') reasons.push('Continue your momentum');
    if (task.due_date) {
        const daysLeft = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000);
        if (daysLeft <= 0) reasons.push('Overdue - needs immediate attention');
        else if (daysLeft <= 1) reasons.push('Due tomorrow');
        else if (daysLeft <= 3) reasons.push(`Due in ${daysLeft} days`);
    }
    if (task.goal_id) {
        const goal = goals.find(g => g.id === task.goal_id);
        if (goal) reasons.push(`Advances "${goal.title}"`);
    }
    if (task.priority >= 3) reasons.push('High priority');
    return reasons.length > 0 ? reasons.join(' - ') : 'Part of your active work';
}

function generateInsights(tasks: any[], stats: any, goals: any[]): string[] {
    const insights: string[] = [];
    if (stats.overdueTasks > 0) insights.push(`You have ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''} that need attention.`);
    if (stats.completionRate > 0 && stats.completionRate < 50) insights.push('Your completion rate is below 50%. Focus on fewer active tasks.');
    if (stats.completionRate >= 80) insights.push('Great completion rate. You are making excellent progress.');
    if (goals.length > 0) {
        const unlinkedTasks = tasks.filter(t => !t.goal_id && !t.project_id).length;
        if (unlinkedTasks > 5) insights.push(`${unlinkedTasks} tasks are not linked to any goal or project.`);
    }
    if (stats.avgFocusRating > 0 && stats.avgFocusRating < 3) insights.push('Recent focus scores are below average. Consider shorter sessions and more breaks.');
    return insights;
}

function determineFocusTheme(suggestions: PlanSuggestion[], goals: any[]): string | undefined {
    if (suggestions.length === 0) return undefined;
    const highPriority = suggestions.filter(s => s.priority_score >= 40).length;
    if (highPriority >= 3) return 'High-impact execution day';
    if (suggestions.length <= 3) return 'Deep focus on a few priorities';
    return 'Balanced execution and progress';
}

export async function suggestNextActions(userId: string, count = 3) {
    const plan = await generateDailyPlan(userId, new Date().toISOString().split('T')[0], 240);
    return plan.suggestions.slice(0, count).map(s => ({
        task: { id: s.task_id, title: s.title },
        reason: s.reason,
        priority_score: s.priority_score,
    }));
}

export async function analyzePatterns(userId: string) {
    const stats = await getUserStats(userId);
    const sessions = await getWorkSessions(userId, 100);
    const tasks = await getTasks(userId, {});

    const byWeekday = new Map<number, number>();
    for (const t of tasks as any[]) {
        if (t.completed_at) {
            const day = new Date(t.completed_at).getDay();
            byWeekday.set(day, (byWeekday.get(day) || 0) + 1);
        }
    }
    const bestDay = [...byWeekday.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const avgSession = stats.avgSessionDuration || 0;
    const avgFocus = stats.avgFocusRating || 0;

    return {
        summary: {
            completionRate: stats.completionRate,
            avgSessionDuration: avgSession,
            avgFocusRating: avgFocus,
            bestProductiveDay: bestDay !== undefined ? dayNames[bestDay] : null,
            totalSessions: stats.recentSessionCount,
        },
        insights: [
            avgFocus >= 4 ? 'Your focus quality is excellent during work sessions.' : 'Your focus score suggests room to improve session quality.',
            avgSession >= 45 ? 'You sustain long sessions effectively.' : 'Try extending focused sessions to at least 45 minutes.',
            stats.completionRate >= 70 ? 'Strong completion consistency this month.' : 'Reduce active tasks to improve completion consistency.',
        ],
        recommendations: [
            'Plan your top 3 tasks the night before.',
            'Batch low-energy tasks into afternoon/evening blocks.',
            'Use 50-minute focus intervals with 10-minute breaks.',
        ],
    };
}

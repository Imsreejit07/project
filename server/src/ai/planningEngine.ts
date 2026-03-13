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

/**
 * The Planning Engine generates intelligent daily plans by analyzing
 * task urgency, importance, energy requirements, deadlines, and historical patterns.
 */
export function generateDailyPlan(userId: string, date: string, availableMinutes = 480): DailyPlanResult {
    const tasks = getTasks(userId, { status: 'pending' })
        .concat(getTasks(userId, { status: 'in_progress' }));
    const goals = getGoals(userId, 'active');
    const stats = getUserStats(userId);
    const sessions = getWorkSessions(userId, 30);

    const energyPattern = inferEnergyPattern(sessions as any[]);
    const scoredTasks = tasks.map(task => ({
        ...task,
        score: calculatePriorityScore(task, goals, date, stats)
    })).sort((a, b) => b.score - a.score);

    const suggestions: PlanSuggestion[] = [];
    let totalMinutes = 0;

    for (const task of scoredTasks) {
        if (totalMinutes + task.estimated_minutes > availableMinutes) continue;
        const slot = assignTimeSlot(task, energyPattern, suggestions);
        suggestions.push({
            task_id: task.id,
            title: task.title,
            reason: generateReason(task, goals),
            slot,
            estimated_minutes: task.estimated_minutes,
            priority_score: task.score
        });
        totalMinutes += task.estimated_minutes;
    }

    // Sort by slot order
    const slotOrder = { morning: 0, afternoon: 1, evening: 2 };
    suggestions.sort((a, b) => slotOrder[a.slot] - slotOrder[b.slot] || b.priority_score - a.priority_score);

    const insights = generateInsights(tasks, stats, goals);
    const focusTheme = determineFocusTheme(suggestions, goals);

    return { date, suggestions, total_minutes: totalMinutes, insights, focus_theme: focusTheme };
}

function calculatePriorityScore(task: any, goals: any[], date: string, stats: any): number {
    let score = task.priority * 10;

    // Urgency: approaching deadline
    if (task.due_date) {
        const daysUntilDue = Math.max(0, (new Date(task.due_date).getTime() - new Date(date).getTime()) / 86400000);
        if (daysUntilDue <= 0) score += 50; // overdue
        else if (daysUntilDue <= 1) score += 40;
        else if (daysUntilDue <= 3) score += 25;
        else if (daysUntilDue <= 7) score += 10;
    }

    // Goal alignment: tasks connected to active goals get a boost
    if (task.goal_id) {
        const goal = goals.find(g => g.id === task.goal_id);
        if (goal) score += 15 + (goal.priority * 5);
    }

    // Project alignment
    if (task.project_id) score += 5;

    // In-progress tasks get a continuation bonus
    if (task.status === 'in_progress') score += 20;

    // Scheduled for today
    if (task.scheduled_date === date) score += 30;

    // Aging: older tasks get a small boost to prevent indefinite deferral
    const ageInDays = (new Date(date).getTime() - new Date(task.created_at).getTime()) / 86400000;
    score += Math.min(10, Math.floor(ageInDays / 3));

    return Math.round(score);
}

function inferEnergyPattern(sessions: any[]): { morning: string; afternoon: string; evening: string } {
    // Default pattern - can be refined from session data over time
    if (sessions.length < 5) {
        return { morning: 'high', afternoon: 'medium', evening: 'low' };
    }

    const bySlot = { morning: [] as number[], afternoon: [] as number[], evening: [] as number[] };
    for (const session of sessions) {
        if (!session.started_at || !session.focus_rating) continue;
        const hour = new Date(session.started_at).getHours();
        const slot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        bySlot[slot].push(session.focus_rating);
    }

    const avgFocus = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 3;
    const morningAvg = avgFocus(bySlot.morning);
    const afternoonAvg = avgFocus(bySlot.afternoon);
    const eveningAvg = avgFocus(bySlot.evening);

    const toLevel = (avg: number) => avg >= 4 ? 'high' : avg >= 2.5 ? 'medium' : 'low';

    return {
        morning: toLevel(morningAvg),
        afternoon: toLevel(afternoonAvg),
        evening: toLevel(eveningAvg)
    };
}

function assignTimeSlot(task: any, energyPattern: any, existing: PlanSuggestion[]): 'morning' | 'afternoon' | 'evening' {
    const slotMinutes = { morning: 0, afternoon: 0, evening: 0 };
    for (const s of existing) slotMinutes[s.slot] += s.estimated_minutes;

    // High-energy tasks go to high-energy slots
    if (task.energy_level === 'high') {
        if (energyPattern.morning === 'high' && slotMinutes.morning < 180) return 'morning';
        if (energyPattern.afternoon === 'high' && slotMinutes.afternoon < 180) return 'afternoon';
    }

    // Low-energy tasks go to low-energy slots
    if (task.energy_level === 'low') {
        if (energyPattern.evening === 'low' && slotMinutes.evening < 120) return 'evening';
        if (energyPattern.afternoon === 'medium' && slotMinutes.afternoon < 180) return 'afternoon';
    }

    // Prefer the slot with the least planned time
    if (task.scheduled_slot && slotMinutes[task.scheduled_slot as keyof typeof slotMinutes] < 180) {
        return task.scheduled_slot as 'morning' | 'afternoon' | 'evening';
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
        if (daysLeft <= 0) reasons.push('Overdue — needs immediate attention');
        else if (daysLeft <= 1) reasons.push('Due tomorrow');
        else if (daysLeft <= 3) reasons.push(`Due in ${daysLeft} days`);
    }
    if (task.goal_id) {
        const goal = goals.find(g => g.id === task.goal_id);
        if (goal) reasons.push(`Advances "${goal.title}"`);
    }
    if (task.priority >= 3) reasons.push('High priority');

    return reasons.length > 0 ? reasons.join(' · ') : 'Part of your active work';
}

function generateInsights(tasks: any[], stats: any, goals: any[]): string[] {
    const insights: string[] = [];

    if (stats.overdueTasks > 0) {
        insights.push(`You have ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''} that need attention.`);
    }
    if (stats.completionRate > 0 && stats.completionRate < 50) {
        insights.push('Your completion rate is below 50%. Consider reducing the number of active tasks and focusing on fewer things.');
    }
    if (stats.completionRate >= 80) {
        insights.push('Great completion rate! You\'re making excellent progress.');
    }
    if (goals.length > 0) {
        const unlinkedTasks = tasks.filter(t => !t.goal_id && !t.project_id).length;
        if (unlinkedTasks > 5) {
            insights.push(`${unlinkedTasks} tasks aren't linked to any goal or project. Consider connecting them to stay aligned with your objectives.`);
        }
    }
    if (stats.avgFocusRating > 0 && stats.avgFocusRating < 3) {
        insights.push('Your recent focus ratings have been below average. Consider shorter focus sessions and more breaks.');
    }

    return insights;
}

function determineFocusTheme(suggestions: PlanSuggestion[], goals: any[]): string | undefined {
    if (suggestions.length === 0) return undefined;
    // Find the goal most represented in today's plan
    const goalCounts = new Map<string, number>();
    for (const s of suggestions) {
        // This is a simplified version; in production, we'd look up each task's goal
        goalCounts.set(s.reason, (goalCounts.get(s.reason) || 0) + 1);
    }
    return undefined; // Focus theme is determined by the most prominent goal
}

/**
 * Suggest next actions based on current state
 */
export function suggestNextActions(userId: string, count = 3): { task: any; reason: string }[] {
    const tasks = getTasks(userId, { status: 'pending' })
        .concat(getTasks(userId, { status: 'in_progress' }));
    const goals = getGoals(userId, 'active');
    const stats = getUserStats(userId);
    const today = new Date().toISOString().split('T')[0];

    const scored = tasks.map(task => ({
        task,
        score: calculatePriorityScore(task, goals, today, stats),
        reason: generateReason(task, goals)
    })).sort((a, b) => b.score - a.score);

    return scored.slice(0, count);
}

/**
 * Analyze work patterns and generate weekly insights
 */
export function analyzePatterns(userId: string): {
    productiveSlot: string;
    avgTasksPerDay: number;
    commonTags: string[];
    streaks: { current: number; longest: number };
    recommendations: string[];
} {
    const stats = getUserStats(userId);
    const sessions = getWorkSessions(userId, 100) as any[];
    const tasks = getTasks(userId);

    // Determine most productive time slot
    const slotFocus: Record<string, number[]> = { morning: [], afternoon: [], evening: [] };
    for (const s of sessions) {
        if (!s.started_at || !s.focus_rating) continue;
        const hour = new Date(s.started_at).getHours();
        const slot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        slotFocus[slot].push(s.focus_rating);
    }

    const avgOf = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b) / arr.length : 0;
    const productiveSlot = Object.entries(slotFocus)
        .map(([slot, ratings]) => ({ slot, avg: avgOf(ratings) }))
        .sort((a, b) => b.avg - a.avg)[0]?.slot || 'morning';

    // Calculate streaks
    const completionDays = stats.completionsByDay.map((d: any) => d.day);
    let current = 0, longest = 0, tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = completionDays.length - 1; i >= 0; i--) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
        if (i === completionDays.length - 1 && completionDays[i] === today) current = tempStreak;
    }

    // Common tags
    const tagCounts = new Map<string, number>();
    for (const t of tasks) {
        for (const tag of (t.tags || [])) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
    }
    const commonTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);

    // Avg tasks per day (last 30 days)
    const avgTasksPerDay = stats.completionsByDay.length > 0
        ? Math.round(stats.completionsByDay.reduce((sum: number, d: any) => sum + d.count, 0) / Math.max(1, stats.completionsByDay.length) * 10) / 10
        : 0;

    const recommendations: string[] = [];
    if (productiveSlot === 'morning') {
        recommendations.push('You tend to focus best in the morning. Schedule your most important work before noon.');
    }
    if (avgTasksPerDay > 8) {
        recommendations.push('You complete many tasks daily. Make sure you\'re not spreading too thin — quality over quantity.');
    }
    if (stats.overdueTasks > 3) {
        recommendations.push('Several tasks are overdue. Consider a cleanup session to reschedule or cancel tasks that no longer matter.');
    }

    return { productiveSlot, avgTasksPerDay, commonTags, streaks: { current, longest }, recommendations };
}

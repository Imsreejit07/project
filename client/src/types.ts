export interface Goal {
    id: string;
    user_id: string;
    title: string;
    description: string;
    vision: string;
    status: 'active' | 'paused' | 'completed' | 'archived';
    target_date: string | null;
    priority: number;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    user_id: string;
    goal_id: string | null;
    title: string;
    description: string;
    status: 'active' | 'paused' | 'completed' | 'archived';
    priority: number;
    deadline: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    user_id: string;
    project_id: string | null;
    goal_id: string | null;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
    priority: number;
    energy_level: 'low' | 'medium' | 'high';
    estimated_minutes: number;
    actual_minutes: number | null;
    due_date: string | null;
    scheduled_date: string | null;
    scheduled_slot: 'morning' | 'afternoon' | 'evening' | null;
    recurrence: string | null;
    tags: string[];
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface WorkSession {
    id: string;
    user_id: string;
    task_id: string | null;
    started_at: string;
    ended_at: string | null;
    duration_minutes: number | null;
    energy_before: string | null;
    energy_after: string | null;
    notes: string;
    focus_rating: number | null;
    created_at: string;
}

export interface DailyPlan {
    id: string;
    user_id: string;
    plan_date: string;
    task_order: string[];
    notes: string;
    reflection: string;
    energy_pattern: string;
    planned_minutes: number;
    completed_minutes: number;
}

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

export interface UserStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    activeGoals: number;
    activeProjects: number;
    overdueTasks: number;
    completionRate: number;
    avgSessionDuration: number;
    avgFocusRating: number;
    recentSessionCount: number;
    completionsByDay: { day: string; count: number }[];
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    actions?: any[];
    timestamp?: string;
}

export interface PatternAnalysis {
    productiveSlot: string;
    avgTasksPerDay: number;
    commonTags: string[];
    streaks: { current: number; longest: number };
    recommendations: string[];
}

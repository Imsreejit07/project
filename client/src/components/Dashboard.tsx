import { useApp } from '../context/AppContext';
import { Target, ListTodo, CalendarDays, AlertTriangle, TrendingUp, Clock, Plus, Zap, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as api from '../api';

export default function Dashboard() {
    const { state, dispatch, actions } = useApp();
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const stats = state.stats;
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = state.tasks.filter(t =>
        t.scheduled_date === today || (t.status === 'in_progress')
    );
    const overdueTasks = state.tasks.filter(t =>
        t.due_date && t.due_date < today && t.status !== 'completed' && t.status !== 'cancelled'
    );
    const recentCompleted = state.tasks
        .filter(t => t.status === 'completed')
        .slice(0, 5);

    useEffect(() => {
        api.getSuggestions(3).then(setSuggestions).catch(() => { });
    }, [state.tasks]);

    const greeting = (() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    })();

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-900">{greeting}</h1>
                <p className="text-surface-500 mt-1">
                    {stats && stats.pendingTasks > 0
                        ? `You have ${stats.pendingTasks} pending task${stats.pendingTasks > 1 ? 's' : ''}. Let's make progress.`
                        : 'Your workspace is clear. Time to set some goals.'}
                </p>
            </div>

            {/* Quick Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={ListTodo} label="Pending" value={stats.pendingTasks} color="text-primary-600" bg="bg-primary-50" />
                    <StatCard icon={Target} label="Active Goals" value={stats.activeGoals} color="text-accent" bg="bg-accent-light" />
                    <StatCard icon={TrendingUp} label="Completion" value={`${stats.completionRate}%`} color="text-success" bg="bg-success-light" />
                    <StatCard
                        icon={AlertTriangle}
                        label="Overdue"
                        value={stats.overdueTasks}
                        color={stats.overdueTasks > 0 ? 'text-danger' : 'text-surface-400'}
                        bg={stats.overdueTasks > 0 ? 'bg-danger-light' : 'bg-surface-100'}
                    />
                </div>
            )}

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Priority focus */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Overdue alert */}
                    {overdueTasks.length > 0 && (
                        <div className="card border-danger/30 bg-danger-light/30 p-4">
                            <div className="flex items-center gap-2 text-danger font-medium text-sm mb-2">
                                <AlertTriangle className="h-4 w-4" />
                                {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
                            </div>
                            <div className="space-y-2">
                                {overdueTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="flex items-center justify-between">
                                        <span className="text-sm text-surface-700">{task.title}</span>
                                        <button
                                            onClick={() => actions.completeTask(task.id)}
                                            className="btn-sm btn-ghost text-xs"
                                        >
                                            Complete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="h-4 w-4 text-warning" />
                                <h2 className="font-semibold text-surface-900">Suggested Focus</h2>
                            </div>
                            <div className="space-y-3">
                                {suggestions.map((s: any, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex-shrink-0 mt-0.5">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-surface-900">{s.task?.title}</p>
                                            <p className="text-xs text-surface-500 mt-0.5">{s.reason}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                actions.updateTask(s.task.id, { status: 'in_progress' });
                                            }}
                                            className="btn-sm btn-secondary flex-shrink-0"
                                        >
                                            Start
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Today's tasks */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-primary-600" />
                                <h2 className="font-semibold text-surface-900">Today</h2>
                                {todayTasks.length > 0 && (
                                    <span className="badge-primary">{todayTasks.length}</span>
                                )}
                            </div>
                            <button
                                onClick={() => dispatch({ type: 'SET_VIEW', view: 'plan' })}
                                className="btn-ghost btn-sm"
                            >
                                Plan Day <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                        {todayTasks.length === 0 ? (
                            <div className="text-center py-8">
                                <CalendarDays className="h-10 w-10 text-surface-300 mx-auto mb-3" />
                                <p className="text-sm text-surface-500">No tasks scheduled for today.</p>
                                <button
                                    onClick={() => dispatch({ type: 'SET_VIEW', view: 'plan' })}
                                    className="btn-primary btn-sm mt-3"
                                >
                                    Generate Plan
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {todayTasks.map(task => (
                                    <TaskRow key={task.id} task={task} onComplete={() => actions.completeTask(task.id)} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Activity & Quick actions */}
                <div className="space-y-6">
                    {/* Quick actions */}
                    <div className="card p-5">
                        <h2 className="font-semibold text-surface-900 mb-3">Quick Actions</h2>
                        <div className="space-y-2">
                            <button
                                onClick={() => dispatch({ type: 'TOGGLE_CREATE_TASK' })}
                                className="btn-secondary w-full justify-start"
                            >
                                <Plus className="h-4 w-4" /> Add Task
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'TOGGLE_CREATE_GOAL' })}
                                className="btn-secondary w-full justify-start"
                            >
                                <Target className="h-4 w-4" /> New Goal
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'SET_VIEW', view: 'plan' })}
                                className="btn-secondary w-full justify-start"
                            >
                                <CalendarDays className="h-4 w-4" /> Plan My Day
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
                                className="btn-secondary w-full justify-start"
                            >
                                <Zap className="h-4 w-4" /> Ask AI Assistant
                            </button>
                        </div>
                    </div>

                    {/* Recent completions */}
                    {recentCompleted.length > 0 && (
                        <div className="card p-5">
                            <h2 className="font-semibold text-surface-900 mb-3">Recently Completed</h2>
                            <div className="space-y-2">
                                {recentCompleted.map(task => (
                                    <div key={task.id} className="flex items-center gap-2 text-sm">
                                        <div className="h-4 w-4 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                                            <div className="h-2 w-2 rounded-full bg-success" />
                                        </div>
                                        <span className="text-surface-500 line-through truncate">{task.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completion chart */}
                    {stats && stats.completionsByDay.length > 0 && (
                        <div className="card p-5">
                            <h2 className="font-semibold text-surface-900 mb-3">Activity (30 days)</h2>
                            <div className="flex items-end gap-1 h-20">
                                {stats.completionsByDay.slice(-14).map((day, i) => {
                                    const max = Math.max(...stats.completionsByDay.map(d => d.count), 1);
                                    const height = Math.max(4, (day.count / max) * 100);
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center justify-end">
                                            <div
                                                className="w-full rounded-sm bg-primary-400 min-h-[4px] transition-all"
                                                style={{ height: `${height}%` }}
                                                title={`${day.day}: ${day.count} tasks`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, bg }: {
    icon: any; label: string; value: string | number; color: string; bg: string;
}) {
    return (
        <div className="card p-4">
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-surface-900">{value}</div>
                    <div className="text-xs text-surface-500">{label}</div>
                </div>
            </div>
        </div>
    );
}

function TaskRow({ task, onComplete }: { task: any; onComplete: () => void }) {
    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 transition-colors group">
            <button
                onClick={onComplete}
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 flex-shrink-0 transition-colors
          ${task.status === 'in_progress'
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-surface-300 hover:border-primary-400'
                    }`}
            >
                {task.status === 'in_progress' && <div className="h-2 w-2 rounded-full bg-primary-500" />}
            </button>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-800 truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    {task.due_date && (
                        <span className={`text-xs ${task.due_date < new Date().toISOString().split('T')[0] ? 'text-danger' : 'text-surface-400'}`}>
                            <Clock className="h-3 w-3 inline mr-0.5" />
                            {task.due_date}
                        </span>
                    )}
                    <EnergyBadge level={task.energy_level} />
                </div>
            </div>
            <span className="text-xs text-surface-400">{task.estimated_minutes}m</span>
        </div>
    );
}

function EnergyBadge({ level }: { level: string }) {
    const config = {
        high: { label: 'High', class: 'text-danger bg-danger-light' },
        medium: { label: 'Med', class: 'text-warning bg-warning-light' },
        low: { label: 'Low', class: 'text-success bg-success-light' },
    }[level] || { label: level, class: 'text-surface-500 bg-surface-100' };

    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.class}`}>
            {config.label}
        </span>
    );
}

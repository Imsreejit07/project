import { useApp } from '../context/AppContext';
import { Target, ListTodo, CalendarDays, AlertTriangle, TrendingUp, Clock, Plus, Zap, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import GlowCard from './GlowCard';
import * as api from '@/api';

const staggerContainer: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
        },
    },
};

const slideUpItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', damping: 20, stiffness: 100 },
    },
};

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
        <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
        >
            {/* Header */}
            <motion.div variants={slideUpItem}>
                <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
                    {greeting}{state.currentUser?.name ? `, ${state.currentUser.name}` : ''}
                </h1>
                <p className="text-surface-500 mt-1">
                    {stats && stats.pendingTasks > 0
                        ? `You have ${stats.pendingTasks} pending task${stats.pendingTasks > 1 ? 's' : ''}. Let's make progress.`
                        : 'Your workspace is clear. Time to set some goals.'}
                </p>
            </motion.div>

            {/* Quick Stats */}
            {stats && (
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                >
                    <StatCard icon={ListTodo} label="Pending" value={stats.pendingTasks} color="text-primary-400" />
                    <StatCard icon={Target} label="Active Goals" value={stats.activeGoals} color="text-accent" />
                    <StatCard icon={TrendingUp} label="Completion" value={`${stats.completionRate}%`} color="text-success" />
                    <StatCard
                        icon={AlertTriangle}
                        label="Overdue"
                        value={stats.overdueTasks}
                        color={stats.overdueTasks > 0 ? 'text-danger' : 'text-surface-500'}
                    />
                </motion.div>
            )}

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Priority focus */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Overdue alert */}
                    {overdueTasks.length > 0 && (
                        <motion.div variants={slideUpItem}>
                            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
                                <div className="flex items-center gap-2 text-danger font-medium text-sm mb-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
                                </div>
                                <div className="space-y-2">
                                    {overdueTasks.slice(0, 3).map(task => (
                                        <div key={task.id} className="flex items-center justify-between">
                                            <span className="text-sm text-surface-700">{task.title}</span>
                                            <motion.button
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => actions.completeTask(task.id)}
                                                className="btn-sm btn-ghost text-xs"
                                            >
                                                Complete
                                            </motion.button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* AI Suggestions */}
                    {suggestions.length > 0 && (
                        <motion.div variants={slideUpItem}>
                            <GlowCard className="p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="h-4 w-4 text-warning" />
                                    <h2 className="font-semibold text-surface-900 tracking-tight">Suggested Focus</h2>
                                </div>
                                <div className="space-y-3">
                                    {suggestions.map((s: any, i: number) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/15 text-primary-400 text-xs font-bold flex-shrink-0 mt-0.5">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-surface-800">{s.task?.title}</p>
                                                <p className="text-xs text-surface-500 mt-0.5">{s.reason}</p>
                                            </div>
                                            <motion.button
                                                whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    actions.updateTask(s.task.id, { status: 'in_progress' });
                                                }}
                                                className="btn-sm btn-secondary flex-shrink-0"
                                            >
                                                Start
                                            </motion.button>
                                        </div>
                                    ))}
                                </div>
                            </GlowCard>
                        </motion.div>
                    )}

                    {/* Today's tasks */}
                    <motion.div variants={slideUpItem}>
                        <GlowCard className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-primary-400" />
                                    <h2 className="font-semibold text-surface-900 tracking-tight">Today</h2>
                                    {todayTasks.length > 0 && (
                                        <span className="badge-primary">{todayTasks.length}</span>
                                    )}
                                </div>
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    onClick={() => dispatch({ type: 'SET_VIEW', view: 'plan' })}
                                    className="btn-ghost btn-sm"
                                >
                                    Plan Day <ArrowRight className="h-3 w-3" />
                                </motion.button>
                            </div>
                            {todayTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <CalendarDays className="h-10 w-10 text-surface-400 mx-auto mb-3" />
                                    <p className="text-sm text-surface-500">No tasks scheduled for today.</p>
                                    <motion.button
                                        whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                                        onClick={() => dispatch({ type: 'SET_VIEW', view: 'plan' })}
                                        className="btn-primary btn-sm mt-3"
                                    >
                                        Generate Plan
                                    </motion.button>
                                </div>
                            ) : (
                                <motion.div
                                    className="space-y-2"
                                    variants={staggerContainer}
                                    initial="hidden"
                                    animate="show"
                                >
                                    {todayTasks.map(task => (
                                        <TaskRow key={task.id} task={task} onComplete={() => actions.completeTask(task.id)} />
                                    ))}
                                </motion.div>
                            )}
                        </GlowCard>
                    </motion.div>
                </div>

                {/* Right: Activity & Quick actions */}
                <div className="space-y-6">
                    {/* Quick actions */}
                    <motion.div variants={slideUpItem}>
                        <GlowCard className="p-5">
                            <h2 className="font-semibold text-surface-900 mb-3 tracking-tight">Quick Actions</h2>
                            <div className="space-y-2">
                                <motion.button
                                    whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => dispatch({ type: 'TOGGLE_CREATE_TASK' })}
                                    className="btn-secondary w-full justify-start"
                                >
                                    <Plus className="h-4 w-4" /> Add Task
                                </motion.button>
                                <motion.button
                                    whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => dispatch({ type: 'TOGGLE_CREATE_GOAL' })}
                                    className="btn-secondary w-full justify-start"
                                >
                                    <Target className="h-4 w-4" /> New Goal
                                </motion.button>
                                <motion.button
                                    whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => dispatch({ type: 'SET_VIEW', view: 'plan' })}
                                    className="btn-secondary w-full justify-start"
                                >
                                    <CalendarDays className="h-4 w-4" /> Plan My Day
                                </motion.button>
                                <motion.button
                                    whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
                                    className="btn-secondary w-full justify-start"
                                >
                                    <Zap className="h-4 w-4" /> Ask AI Assistant
                                </motion.button>
                            </div>
                        </GlowCard>
                    </motion.div>

                    {/* Recent completions */}
                    {recentCompleted.length > 0 && (
                        <motion.div variants={slideUpItem}>
                            <GlowCard className="p-5">
                                <h2 className="font-semibold text-surface-900 mb-3 tracking-tight">Recently Completed</h2>
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
                            </GlowCard>
                        </motion.div>
                    )}

                    {/* Completion chart */}
                    {stats && stats.completionsByDay.length > 0 && (
                        <motion.div variants={slideUpItem}>
                            <GlowCard className="p-5">
                                <h2 className="font-semibold text-surface-900 mb-3 tracking-tight">Activity (30 days)</h2>
                                <div className="flex items-end gap-1 h-20">
                                    {stats.completionsByDay.slice(-14).map((day, i) => {
                                        const max = Math.max(...stats.completionsByDay.map(d => d.count), 1);
                                        const height = Math.max(4, (day.count / max) * 100);
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center justify-end">
                                                <div
                                                    className="w-full rounded-sm bg-gradient-to-t from-primary-600 to-primary-400 min-h-[4px] transition-all hover:from-primary-500 hover:to-primary-300"
                                                    style={{ height: `${height}%` }}
                                                    title={`${day.day}: ${day.count} tasks`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </GlowCard>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: any; label: string; value: string | number; color: string;
}) {
    return (
        <motion.div variants={slideUpItem}>
            <GlowCard className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                        <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-surface-900 tracking-tight">{value}</div>
                        <div className="text-xs text-surface-500">{label}</div>
                    </div>
                </div>
            </GlowCard>
        </motion.div>
    );
}

function TaskRow({ task, onComplete }: { task: any; onComplete: () => void }) {
    return (
        <motion.div
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
            variants={slideUpItem}
        >
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onComplete}
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 flex-shrink-0 transition-colors
          ${task.status === 'in_progress'
                        ? 'border-primary-400 bg-primary-500/20'
                        : 'border-surface-400 hover:border-primary-400'
                    }`}
            >
                {task.status === 'in_progress' && <div className="h-2 w-2 rounded-full bg-primary-500" />}
            </motion.button>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-800 truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    {task.due_date && (
                        <span className={`text-xs ${task.due_date < new Date().toISOString().split('T')[0] ? 'text-danger' : 'text-surface-500'}`}>
                            <Clock className="h-3 w-3 inline mr-0.5" />
                            {task.due_date}
                        </span>
                    )}
                    <EnergyBadge level={task.energy_level} />
                </div>
            </div>
            <span className="text-xs text-surface-500">{task.estimated_minutes}m</span>
        </motion.div>
    );
}

function EnergyBadge({ level }: { level: string }) {
    const config = {
        high: { label: 'High', class: 'text-red-400 bg-danger-light' },
        medium: { label: 'Med', class: 'text-yellow-400 bg-warning-light' },
        low: { label: 'Low', class: 'text-green-400 bg-success-light' },
    }[level] || { label: level, class: 'text-surface-500 bg-white/5' };

    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.class}`}>
            {config.label}
        </span>
    );
}

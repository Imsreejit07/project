import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarDays, Sun, Cloud, Moon, Zap, Clock, RefreshCw, Check, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import * as api from '@/api';
import { DailyPlanResult } from '../types';
import GlowCard from './GlowCard';

export default function PlanView() {
    const { state, actions } = useApp();
    const [plan, setPlan] = useState<DailyPlanResult | null>(state.dailyPlan);
    const [loading, setLoading] = useState(false);
    const [availableHours, setAvailableHours] = useState(8);

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const generatePlan = async () => {
        setLoading(true);
        try {
            const result = await api.generatePlan(dateStr, availableHours * 60);
            setPlan(result);
        } catch (e) {
            console.error('Failed to generate plan:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!plan) generatePlan();
    }, []);

    const slotConfig = {
        morning: { icon: Sun, label: 'Morning', color: 'text-warning', bg: 'bg-warning-light', timeRange: '8:00 AM - 12:00 PM' },
        afternoon: { icon: Cloud, label: 'Afternoon', color: 'text-primary-400', bg: 'bg-primary-500/15', timeRange: '12:00 PM - 5:00 PM' },
        evening: { icon: Moon, label: 'Evening', color: 'text-primary-300', bg: 'bg-accent-light', timeRange: '5:00 PM - 9:00 PM' },
    };

    const groupBySlot = (suggestions: any[]) => {
        const groups: Record<string, any[]> = { morning: [], afternoon: [], evening: [] };
        for (const s of suggestions) {
            if (groups[s.slot]) groups[s.slot].push(s);
        }
        return groups;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Daily Plan</h1>
                    <p className="text-surface-500 mt-1">{dayName}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-surface-500">Available:</label>
                        <select
                            className="input w-24"
                            value={availableHours}
                            onChange={e => setAvailableHours(Number(e.target.value))}
                        >
                            {[2, 3, 4, 5, 6, 7, 8, 10, 12].map(h => (
                                <option key={h} value={h}>{h} hours</option>
                            ))}
                        </select>
                    </div>
                    <motion.button
                        whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={generatePlan}
                        disabled={loading}
                        className="btn-primary"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {plan ? 'Regenerate' : 'Generate Plan'}
                    </motion.button>
                </div>
            </div>

            {loading ? (
                <GlowCard className="p-12 text-center">
                    <RefreshCw className="h-8 w-8 text-primary-400 mx-auto mb-3 animate-spin" />
                    <p className="text-surface-500">Analyzing your tasks and generating an optimized plan...</p>
                </GlowCard>
            ) : !plan || plan.suggestions.length === 0 ? (
                <GlowCard className="p-12 text-center">
                    <CalendarDays className="h-12 w-12 text-surface-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-surface-700 mb-2">No plan generated yet</h3>
                    <p className="text-sm text-surface-500 mb-4">
                        Add some tasks first, then generate a plan to organize your day.
                    </p>
                    <motion.button
                        whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                        onClick={generatePlan}
                        className="btn-primary"
                    >
                        Generate Plan
                    </motion.button>
                </GlowCard>
            ) : (
                <>
                    {/* Summary bar */}
                    <GlowCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="text-2xl font-bold text-surface-900 tracking-tight">{plan.suggestions.length}</span>
                                    <span className="text-sm text-surface-500 ml-1">tasks planned</span>
                                </div>
                                <div className="h-8 w-px bg-white/10" />
                                <div>
                                    <span className="text-2xl font-bold text-primary-400 tracking-tight">
                                        {Math.round(plan.total_minutes / 60 * 10) / 10}
                                    </span>
                                    <span className="text-sm text-surface-500 ml-1">hours of work</span>
                                </div>
                                <div className="h-8 w-px bg-white/10" />
                                <div>
                                    <span className="text-2xl font-bold text-success tracking-tight">
                                        {Math.round((1 - plan.total_minutes / (availableHours * 60)) * 100)}%
                                    </span>
                                    <span className="text-sm text-surface-500 ml-1">buffer remaining</span>
                                </div>
                            </div>
                        </div>
                    </GlowCard>

                    {/* Time slots */}
                    <div className="space-y-6">
                        {Object.entries(groupBySlot(plan.suggestions)).map(([slot, tasks]) => {
                            const config = slotConfig[slot as keyof typeof slotConfig];
                            const SlotIcon = config.icon;
                            const slotMinutes = tasks.reduce((sum: number, t: any) => sum + t.estimated_minutes, 0);

                            return (
                                <div key={slot}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bg}`}>
                                            <SlotIcon className={`h-4 w-4 ${config.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-surface-900 tracking-tight">{config.label}</h3>
                                            <span className="text-xs text-surface-500">{config.timeRange}</span>
                                        </div>
                                        {tasks.length > 0 && (
                                            <span className="text-xs text-surface-500 ml-auto">
                                                {tasks.length} task{tasks.length > 1 ? 's' : ''} · {slotMinutes}min
                                            </span>
                                        )}
                                    </div>

                                    {tasks.length === 0 ? (
                                        <div className="card p-4 border-dashed text-center">
                                            <p className="text-sm text-surface-500">No tasks scheduled</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {tasks.map((task: any, i: number) => (
                                                <GlowCard key={task.task_id} className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => actions.completeTask(task.task_id)}
                                                            className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface-400 hover:border-success transition-colors flex-shrink-0"
                                                        >
                                                        </motion.button>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-surface-800">{task.title}</p>
                                                            <p className="text-xs text-surface-500 mt-1">{task.reason}</p>
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <span className="inline-flex items-center gap-1 text-xs text-surface-500">
                                                                    <Clock className="h-3 w-3" />
                                                                    {task.estimated_minutes}min
                                                                </span>
                                                                <span className="text-xs text-surface-500">
                                                                    Score: {task.priority_score}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => actions.updateTask(task.task_id, { status: 'in_progress' })}
                                                            className="btn-sm btn-primary"
                                                        >
                                                            <Zap className="h-3 w-3" /> Start
                                                        </motion.button>
                                                    </div>
                                                </GlowCard>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Insights */}
                    {plan.insights.length > 0 && (
                        <GlowCard className="p-5 border-primary-500/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="h-4 w-4 text-primary-400" />
                                <h3 className="font-semibold text-surface-900 tracking-tight">Insights</h3>
                            </div>
                            <div className="space-y-2">
                                {plan.insights.map((insight, i) => (
                                    <p key={i} className="text-sm text-surface-700">{insight}</p>
                                ))}
                            </div>
                        </GlowCard>
                    )}
                </>
            )}
        </div>
    );
}

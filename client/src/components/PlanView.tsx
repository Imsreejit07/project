import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarDays, Sun, Cloud, Moon, Zap, Clock, RefreshCw, Check, Lightbulb } from 'lucide-react';
import * as api from '../api';
import { DailyPlanResult } from '../types';

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
        afternoon: { icon: Cloud, label: 'Afternoon', color: 'text-primary-500', bg: 'bg-primary-50', timeRange: '12:00 PM - 5:00 PM' },
        evening: { icon: Moon, label: 'Evening', color: 'text-accent', bg: 'bg-accent-light', timeRange: '5:00 PM - 9:00 PM' },
    };

    const groupBySlot = (suggestions: any[]) => {
        const groups: Record<string, any[]> = { morning: [], afternoon: [], evening: [] };
        for (const s of suggestions) {
            if (groups[s.slot]) groups[s.slot].push(s);
        }
        return groups;
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Daily Plan</h1>
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
                    <button
                        onClick={generatePlan}
                        disabled={loading}
                        className="btn-primary"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {plan ? 'Regenerate' : 'Generate Plan'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="card p-12 text-center">
                    <RefreshCw className="h-8 w-8 text-primary-400 mx-auto mb-3 animate-spin" />
                    <p className="text-surface-500">Analyzing your tasks and generating an optimized plan...</p>
                </div>
            ) : !plan || plan.suggestions.length === 0 ? (
                <div className="card p-12 text-center">
                    <CalendarDays className="h-12 w-12 text-surface-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-surface-700 mb-2">No plan generated yet</h3>
                    <p className="text-sm text-surface-500 mb-4">
                        Add some tasks first, then generate a plan to organize your day.
                    </p>
                    <button onClick={generatePlan} className="btn-primary">
                        Generate Plan
                    </button>
                </div>
            ) : (
                <>
                    {/* Summary bar */}
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="text-2xl font-bold text-surface-900">{plan.suggestions.length}</span>
                                    <span className="text-sm text-surface-500 ml-1">tasks planned</span>
                                </div>
                                <div className="h-8 w-px bg-surface-200" />
                                <div>
                                    <span className="text-2xl font-bold text-primary-600">
                                        {Math.round(plan.total_minutes / 60 * 10) / 10}
                                    </span>
                                    <span className="text-sm text-surface-500 ml-1">hours of work</span>
                                </div>
                                <div className="h-8 w-px bg-surface-200" />
                                <div>
                                    <span className="text-2xl font-bold text-success">
                                        {Math.round((1 - plan.total_minutes / (availableHours * 60)) * 100)}%
                                    </span>
                                    <span className="text-sm text-surface-500 ml-1">buffer remaining</span>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                            <h3 className="font-semibold text-surface-900">{config.label}</h3>
                                            <span className="text-xs text-surface-400">{config.timeRange}</span>
                                        </div>
                                        {tasks.length > 0 && (
                                            <span className="text-xs text-surface-400 ml-auto">
                                                {tasks.length} task{tasks.length > 1 ? 's' : ''} · {slotMinutes}min
                                            </span>
                                        )}
                                    </div>

                                    {tasks.length === 0 ? (
                                        <div className="card p-4 border-dashed text-center">
                                            <p className="text-sm text-surface-400">No tasks scheduled</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {tasks.map((task: any, i: number) => (
                                                <div key={task.task_id} className="card p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start gap-3">
                                                        <button
                                                            onClick={() => actions.completeTask(task.task_id)}
                                                            className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface-300 hover:border-success transition-colors flex-shrink-0"
                                                        >
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-surface-800">{task.title}</p>
                                                            <p className="text-xs text-surface-500 mt-1">{task.reason}</p>
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <span className="inline-flex items-center gap-1 text-xs text-surface-400">
                                                                    <Clock className="h-3 w-3" />
                                                                    {task.estimated_minutes}min
                                                                </span>
                                                                <span className="text-xs text-surface-300">
                                                                    Score: {task.priority_score}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => actions.updateTask(task.task_id, { status: 'in_progress' })}
                                                            className="btn-sm btn-primary"
                                                        >
                                                            <Zap className="h-3 w-3" /> Start
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Insights */}
                    {plan.insights.length > 0 && (
                        <div className="card p-5 bg-primary-50/50 border-primary-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="h-4 w-4 text-primary-600" />
                                <h3 className="font-semibold text-primary-900">Insights</h3>
                            </div>
                            <div className="space-y-2">
                                {plan.insights.map((insight, i) => (
                                    <p key={i} className="text-sm text-primary-800">{insight}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

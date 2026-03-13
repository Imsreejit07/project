import { useApp } from '../context/AppContext';
import {
    LayoutDashboard, Target, ListTodo, CalendarDays, BarChart3,
    Plus, ChevronDown, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'goals' as const, label: 'Goals', icon: Target },
    { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
    { id: 'plan' as const, label: 'Daily Plan', icon: CalendarDays },
    { id: 'insights' as const, label: 'Insights', icon: BarChart3 },
];

export default function Sidebar() {
    const { state, dispatch, actions } = useApp();
    const [expandGoals, setExpandGoals] = useState(true);

    const activeGoals = state.goals.filter(g => g.status === 'active');

    return (
        <aside className="hidden lg:flex w-64 flex-col border-r border-surface-200 bg-surface-0">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-surface-200 px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                    </svg>
                </div>
                <span className="text-lg font-semibold text-surface-900">FlowState</span>
            </div>

            {/* Quick add */}
            <div className="px-4 py-3">
                <button
                    onClick={() => dispatch({ type: 'TOGGLE_CREATE_TASK' })}
                    className="btn-primary w-full justify-center"
                >
                    <Plus className="h-4 w-4" />
                    New Task
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-auto scrollbar-thin px-3 py-2">
                <div className="space-y-0.5">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => dispatch({ type: 'SET_VIEW', view: item.id })}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${state.activeView === item.id
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                            {item.id === 'tasks' && state.stats && state.stats.pendingTasks > 0 && (
                                <span className="ml-auto text-xs bg-surface-200 text-surface-600 rounded-full px-2 py-0.5">
                                    {state.stats.pendingTasks}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Goals section */}
                <div className="mt-6">
                    <button
                        onClick={() => setExpandGoals(!expandGoals)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-400 hover:text-surface-600"
                    >
                        {expandGoals ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        Goals
                        <button
                            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_CREATE_GOAL' }); }}
                            className="ml-auto p-0.5 rounded hover:bg-surface-200"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </button>
                    {expandGoals && (
                        <div className="mt-1 space-y-0.5">
                            {activeGoals.length === 0 && (
                                <p className="px-3 py-2 text-xs text-surface-400 italic">No active goals</p>
                            )}
                            {activeGoals.map(goal => (
                                <button
                                    key={goal.id}
                                    onClick={() => {
                                        dispatch({ type: 'SET_SELECTED_GOAL', id: goal.id });
                                        dispatch({ type: 'SET_VIEW', view: 'goals' });
                                    }}
                                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors
                    ${state.selectedGoalId === goal.id
                                            ? 'bg-accent-light text-accent'
                                            : 'text-surface-600 hover:bg-surface-100'
                                        }`}
                                >
                                    <Target className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">{goal.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            {/* Stats footer */}
            {state.stats && (
                <div className="border-t border-surface-200 px-4 py-3">
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-lg bg-surface-50 px-2 py-1.5">
                            <div className="text-lg font-semibold text-primary-600">{state.stats.completedTasks}</div>
                            <div className="text-[10px] text-surface-500 uppercase tracking-wider">Done</div>
                        </div>
                        <div className="rounded-lg bg-surface-50 px-2 py-1.5">
                            <div className="text-lg font-semibold text-surface-700">{state.stats.pendingTasks}</div>
                            <div className="text-[10px] text-surface-500 uppercase tracking-wider">Pending</div>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}

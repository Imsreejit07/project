import { useApp } from '../context/AppContext';
import {
    LayoutDashboard, Target, ListTodo, CalendarDays, BarChart3,
    Plus, ChevronDown, ChevronRight, LogOut
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import * as api from '../api';

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
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const activeGoals = state.goals.filter(g => g.status === 'active');

    const handleLogoutConfirm = async () => {
        try {
            await api.logout();
        } finally {
            window.location.href = '/';
        }
    };

    return (
        <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 bg-[#0A0A0A]">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                    </svg>
                </div>
                <span className="text-lg font-semibold text-surface-900 tracking-tight">FlowState</span>
            </div>

            {/* Quick add */}
            <div className="px-4 py-3">
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => dispatch({ type: 'TOGGLE_CREATE_TASK' })}
                    className="btn-primary w-full justify-center"
                >
                    <Plus className="h-4 w-4" />
                    New Task
                </motion.button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-auto scrollbar-thin px-3 py-2">
                <div className="space-y-0.5">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => dispatch({ type: 'SET_VIEW', view: item.id })}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
                ${state.activeView === item.id
                                    ? 'bg-primary-500/10 text-primary-400 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.15)]'
                                    : 'text-surface-600 hover:bg-white/5 hover:text-surface-700'
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                            {item.id === 'tasks' && state.stats && state.stats.pendingTasks > 0 && (
                                <span className="ml-auto text-xs bg-white/5 text-surface-600 rounded-full px-2 py-0.5">
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
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-500 hover:text-surface-600"
                    >
                        {expandGoals ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        Goals
                        <button
                            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_CREATE_GOAL' }); }}
                            className="ml-auto p-0.5 rounded hover:bg-white/5"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </button>
                    {expandGoals && (
                        <div className="mt-1 space-y-0.5">
                            {activeGoals.length === 0 && (
                                <p className="px-3 py-2 text-xs text-surface-500 italic">No active goals</p>
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
                                            ? 'bg-accent-light text-primary-400'
                                            : 'text-surface-600 hover:bg-white/5'
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
                <div className="border-t border-white/5 px-4 py-3">
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-lg bg-white/5 px-2 py-1.5">
                            <div className="text-lg font-semibold text-primary-400">{state.stats.completedTasks}</div>
                            <div className="text-[10px] text-surface-500 uppercase tracking-wider">Done</div>
                        </div>
                        <div className="rounded-lg bg-white/5 px-2 py-1.5">
                            <div className="text-lg font-semibold text-surface-700">{state.stats.pendingTasks}</div>
                            <div className="text-[10px] text-surface-500 uppercase tracking-wider">Pending</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout button */}
            <div className="border-t border-white/5 px-4 py-3">
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-surface-600 hover:bg-white/10 hover:text-surface-700 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-96 rounded-2xl bg-[#0A0A0A] p-6 shadow-2xl border border-white/10">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-surface-900 tracking-tight">Logout Confirmation</h2>
                            <p className="mt-2 text-sm text-surface-600">
                                Are you sure you want to logout? You'll need to sign in again to access your tasks.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-white/10 transition-colors"
                            >
                                No, Keep me logged in
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                className="flex-1 rounded-lg bg-red-600/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}

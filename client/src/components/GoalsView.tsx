import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Target, Plus, ChevronRight, Edit2, Trash2, FolderOpen, Check } from 'lucide-react';

export default function GoalsView() {
    const { state, dispatch, actions } = useApp();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [filter, setFilter] = useState<string>('active');

    const goals = state.goals.filter(g => filter === 'all' || g.status === filter);
    const projects = state.projects;

    const goalProjects = (goalId: string) => projects.filter(p => p.goal_id === goalId);
    const goalTasks = (goalId: string) => state.tasks.filter(t => t.goal_id === goalId);
    const goalProgress = (goalId: string) => {
        const tasks = goalTasks(goalId);
        if (tasks.length === 0) return 0;
        return Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Goals</h1>
                    <p className="text-surface-500 mt-1">Define what matters and track your progress</p>
                </div>
                <button onClick={() => dispatch({ type: 'TOGGLE_CREATE_GOAL' })} className="btn-primary">
                    <Plus className="h-4 w-4" /> New Goal
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['active', 'paused', 'completed', 'all'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`btn-sm ${filter === f ? 'bg-primary-100 text-primary-700' : 'btn-ghost'}`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Goals list */}
            {goals.length === 0 ? (
                <div className="card p-12 text-center">
                    <Target className="h-12 w-12 text-surface-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-surface-700 mb-2">No goals yet</h3>
                    <p className="text-sm text-surface-500 mb-4">Goals help you connect daily tasks to meaningful outcomes.</p>
                    <button onClick={() => dispatch({ type: 'TOGGLE_CREATE_GOAL' })} className="btn-primary">
                        <Plus className="h-4 w-4" /> Create Your First Goal
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {goals.map(goal => {
                        const progress = goalProgress(goal.id);
                        const gProjects = goalProjects(goal.id);
                        const gTasks = goalTasks(goal.id);
                        const isExpanded = state.selectedGoalId === goal.id;

                        return (
                            <div key={goal.id} className="card-hover overflow-hidden">
                                <div
                                    className="p-5 cursor-pointer"
                                    onClick={() => dispatch({ type: 'SET_SELECTED_GOAL', id: isExpanded ? null : goal.id })}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light flex-shrink-0">
                                            <Target className="h-5 w-5 text-accent" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {editingId === goal.id ? (
                                                    <input
                                                        className="input text-lg font-semibold"
                                                        value={editTitle}
                                                        onChange={e => setEditTitle(e.target.value)}
                                                        onBlur={() => {
                                                            if (editTitle.trim()) actions.updateGoal(goal.id, { title: editTitle });
                                                            setEditingId(null);
                                                        }}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                if (editTitle.trim()) actions.updateGoal(goal.id, { title: editTitle });
                                                                setEditingId(null);
                                                            }
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <h3 className="text-lg font-semibold text-surface-900">{goal.title}</h3>
                                                )}
                                                <PriorityIndicator priority={goal.priority} />
                                            </div>
                                            {goal.description && (
                                                <p className="text-sm text-surface-500 mt-1 line-clamp-2">{goal.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="flex-1 max-w-xs">
                                                    <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-accent transition-all duration-500"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-xs text-surface-500">{progress}%</span>
                                                <span className="text-xs text-surface-400">
                                                    {gProjects.length} project{gProjects.length !== 1 ? 's' : ''} · {gTasks.length} task{gTasks.length !== 1 ? 's' : ''}
                                                </span>
                                                {goal.target_date && (
                                                    <span className="text-xs text-surface-400">Target: {goal.target_date}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={e => { e.stopPropagation(); setEditingId(goal.id); setEditTitle(goal.title); }}
                                                className="btn-icon btn-ghost p-1.5"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={e => { e.stopPropagation(); actions.deleteGoal(goal.id); }}
                                                className="btn-icon btn-ghost p-1.5 text-danger hover:text-danger"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                            <ChevronRight className={`h-4 w-4 text-surface-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded view */}
                                {isExpanded && (
                                    <div className="border-t border-surface-200 bg-surface-50 p-5 animate-slide-down">
                                        {goal.vision && (
                                            <div className="mb-4">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">Vision</h4>
                                                <p className="text-sm text-surface-600">{goal.vision}</p>
                                            </div>
                                        )}

                                        {/* Projects under this goal */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">Projects</h4>
                                                <button
                                                    onClick={() => dispatch({ type: 'TOGGLE_CREATE_PROJECT' })}
                                                    className="btn-ghost btn-sm text-xs"
                                                >
                                                    <Plus className="h-3 w-3" /> Add
                                                </button>
                                            </div>
                                            {gProjects.length === 0 ? (
                                                <p className="text-xs text-surface-400 italic">No projects linked</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {gProjects.map(p => (
                                                        <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-0">
                                                            <FolderOpen className="h-4 w-4 text-primary-500" />
                                                            <span className="text-sm text-surface-700">{p.title}</span>
                                                            <span className={`badge-${p.status === 'active' ? 'primary' : 'neutral'} ml-auto`}>
                                                                {p.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Tasks under this goal */}
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Tasks</h4>
                                            {gTasks.length === 0 ? (
                                                <p className="text-xs text-surface-400 italic">No tasks linked</p>
                                            ) : (
                                                <div className="space-y-1">
                                                    {gTasks.slice(0, 8).map(t => (
                                                        <div key={t.id} className="flex items-center gap-2 p-1.5">
                                                            <button
                                                                onClick={() => {
                                                                    if (t.status !== 'completed') actions.completeTask(t.id);
                                                                }}
                                                                className={`h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                                  ${t.status === 'completed' ? 'border-success bg-success' : 'border-surface-300 hover:border-primary-400'}`}
                                                            >
                                                                {t.status === 'completed' && <Check className="h-2.5 w-2.5 text-white" />}
                                                            </button>
                                                            <span className={`text-sm ${t.status === 'completed' ? 'text-surface-400 line-through' : 'text-surface-700'}`}>
                                                                {t.title}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {gTasks.length > 8 && (
                                                        <p className="text-xs text-surface-400 pl-6">+{gTasks.length - 8} more</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Status actions */}
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-surface-200">
                                            {goal.status !== 'completed' && (
                                                <button
                                                    onClick={() => actions.updateGoal(goal.id, { status: 'completed' })}
                                                    className="btn-sm btn-secondary"
                                                >
                                                    <Check className="h-3 w-3" /> Mark Complete
                                                </button>
                                            )}
                                            {goal.status === 'active' && (
                                                <button
                                                    onClick={() => actions.updateGoal(goal.id, { status: 'paused' })}
                                                    className="btn-sm btn-ghost"
                                                >
                                                    Pause
                                                </button>
                                            )}
                                            {goal.status === 'paused' && (
                                                <button
                                                    onClick={() => actions.updateGoal(goal.id, { status: 'active' })}
                                                    className="btn-sm btn-ghost"
                                                >
                                                    Resume
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PriorityIndicator({ priority }: { priority: number }) {
    if (priority <= 0) return null;
    const colors = ['', 'bg-blue-200', 'bg-blue-300', 'bg-warning', 'bg-orange-400', 'bg-danger'];
    return (
        <div className="flex gap-0.5" title={`Priority: ${priority}`}>
            {Array.from({ length: Math.min(priority, 5) }).map((_, i) => (
                <div key={i} className={`h-1.5 w-1.5 rounded-full ${colors[priority] || 'bg-surface-300'}`} />
            ))}
        </div>
    );
}

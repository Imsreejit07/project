import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { ListTodo, Plus, Check, Clock, Zap, Filter, ChevronDown, Trash2, Edit2, Calendar, Target, FolderOpen } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import GlowCard from './GlowCard';

type FilterState = {
    status: string;
    energy: string;
    sortBy: string;
};

function triggerConfetti(e: React.MouseEvent) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
        particleCount: 40,
        spread: 60,
        startVelocity: 20,
        gravity: 0.8,
        origin: { x, y },
        colors: ['#8B5CF6', '#a78bfa', '#c4b5fd', '#22c55e', '#fbbf24'],
        scalar: 0.7,
        ticks: 60,
    });
}

export default function TasksView() {
    const { state, dispatch, actions } = useApp();
    const [filters, setFilters] = useState<FilterState>({ status: 'active', energy: 'all', sortBy: 'priority' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    let tasks = [...state.tasks];

    // Filter
    if (filters.status === 'active') {
        tasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    } else if (filters.status !== 'all') {
        tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters.energy !== 'all') {
        tasks = tasks.filter(t => t.energy_level === filters.energy);
    }

    // Sort
    tasks.sort((a, b) => {
        if (filters.sortBy === 'priority') return b.priority - a.priority;
        if (filters.sortBy === 'due_date') {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return a.due_date.localeCompare(b.due_date);
        }
        if (filters.sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return 0;
    });

    // Group by status for kanban-like view
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const pending = tasks.filter(t => t.status === 'pending');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Tasks</h1>
                    <p className="text-surface-500 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ y: -2 }}
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-secondary btn-sm"
                    >
                        <Filter className="h-3.5 w-3.5" />
                        Filter
                        <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </motion.button>
                    <motion.button
                        whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => dispatch({ type: 'TOGGLE_CREATE_TASK' })}
                        className="btn-primary btn-sm"
                    >
                        <Plus className="h-4 w-4" /> Add Task
                    </motion.button>
                </div>
            </div>

            {/* Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <GlowCard className="p-4">
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <label className="label">Status</label>
                                    <select
                                        className="input w-36"
                                        value={filters.status}
                                        onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                                    >
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="all">All</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Energy</label>
                                    <select
                                        className="input w-32"
                                        value={filters.energy}
                                        onChange={e => setFilters(f => ({ ...f, energy: e.target.value }))}
                                    >
                                        <option value="all">All</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Sort By</label>
                                    <select
                                        className="input w-36"
                                        value={filters.sortBy}
                                        onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                                    >
                                        <option value="priority">Priority</option>
                                        <option value="due_date">Due Date</option>
                                        <option value="created">Newest</option>
                                    </select>
                                </div>
                            </div>
                        </GlowCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {tasks.length === 0 ? (
                <GlowCard className="p-12 text-center">
                    <ListTodo className="h-12 w-12 text-surface-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-surface-700 mb-2">No tasks found</h3>
                    <p className="text-sm text-surface-500 mb-4">Create tasks or adjust your filters.</p>
                    <motion.button
                        whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                        onClick={() => dispatch({ type: 'TOGGLE_CREATE_TASK' })}
                        className="btn-primary"
                    >
                        <Plus className="h-4 w-4" /> Create Task
                    </motion.button>
                </GlowCard>
            ) : (
                <LayoutGroup>
                    <motion.div className="space-y-2" layout>
                        {/* In Progress section */}
                        {inProgress.length > 0 && filters.status === 'active' && (
                            <motion.div className="mb-4" layout>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-400 mb-2 px-1">
                                    In Progress ({inProgress.length})
                                </h3>
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {inProgress.map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            goals={state.goals}
                                            projects={state.projects}
                                            editingId={editingId}
                                            editTitle={editTitle}
                                            onStartEdit={(id, title) => { setEditingId(id); setEditTitle(title); }}
                                            onSaveEdit={async (id) => {
                                                if (editTitle.trim()) await actions.updateTask(id, { title: editTitle });
                                                setEditingId(null);
                                            }}
                                            onEditTitleChange={setEditTitle}
                                            onComplete={(e) => { triggerConfetti(e); actions.completeTask(task.id); }}
                                            onDelete={() => actions.deleteTask(task.id)}
                                            onUpdateStatus={(status) => actions.updateTask(task.id, { status })}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* Pending section */}
                        {pending.length > 0 && filters.status === 'active' && (
                            <motion.div layout>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2 px-1">
                                    Pending ({pending.length})
                                </h3>
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {pending.map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            goals={state.goals}
                                            projects={state.projects}
                                            editingId={editingId}
                                            editTitle={editTitle}
                                            onStartEdit={(id, title) => { setEditingId(id); setEditTitle(title); }}
                                            onSaveEdit={async (id) => {
                                                if (editTitle.trim()) await actions.updateTask(id, { title: editTitle });
                                                setEditingId(null);
                                            }}
                                            onEditTitleChange={setEditTitle}
                                            onComplete={(e) => { triggerConfetti(e); actions.completeTask(task.id); }}
                                            onDelete={() => actions.deleteTask(task.id)}
                                            onUpdateStatus={(status) => actions.updateTask(task.id, { status })}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* Non-active filters show all in one list */}
                        {filters.status !== 'active' && (
                            <AnimatePresence mode="popLayout" initial={false}>
                                {tasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        goals={state.goals}
                                        projects={state.projects}
                                        editingId={editingId}
                                        editTitle={editTitle}
                                        onStartEdit={(id, title) => { setEditingId(id); setEditTitle(title); }}
                                        onSaveEdit={async (id) => {
                                            if (editTitle.trim()) await actions.updateTask(id, { title: editTitle });
                                            setEditingId(null);
                                        }}
                                        onEditTitleChange={setEditTitle}
                                        onComplete={(e) => { triggerConfetti(e); actions.completeTask(task.id); }}
                                        onDelete={() => actions.deleteTask(task.id)}
                                        onUpdateStatus={(status) => actions.updateTask(task.id, { status })}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </motion.div>
                </LayoutGroup>
            )}
        </div>
    );
}

function TaskCard({ task, goals, projects, editingId, editTitle, onStartEdit, onSaveEdit, onEditTitleChange, onComplete, onDelete, onUpdateStatus }: {
    task: any; goals: any[]; projects: any[];
    editingId: string | null; editTitle: string;
    onStartEdit: (id: string, title: string) => void;
    onSaveEdit: (id: string) => void;
    onEditTitleChange: (v: string) => void;
    onComplete: (e: React.MouseEvent) => void;
    onDelete: () => void;
    onUpdateStatus: (status: Task['status']) => void;
}) {
    const goal = goals.find(g => g.id === task.goal_id);
    const project = projects.find(p => p.id === task.project_id);
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.due_date && task.due_date < today && task.status !== 'completed';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ layout: { type: 'spring', stiffness: 420, damping: 34 }, duration: 0.2 }}
            className={`card p-4 mb-2 group transition-all
      ${task.status === 'in_progress' ? 'border-primary-500/20 bg-primary-500/5' : ''}
      ${task.status === 'completed' ? 'opacity-60' : ''}
      ${isOverdue ? 'border-danger/20' : ''}
    `}>
            <div className="flex items-start gap-3">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onComplete}
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 flex-shrink-0 transition-all
            ${task.status === 'completed'
                            ? 'border-success bg-success'
                            : task.status === 'in_progress'
                                ? 'border-primary-400 bg-primary-500/20 hover:bg-primary-500/30'
                                : 'border-surface-400 hover:border-primary-400'
                        }`}
                >
                    {task.status === 'completed' && <Check className="h-3 w-3 text-white" />}
                    {task.status === 'in_progress' && <div className="h-2 w-2 rounded-full bg-primary-500" />}
                </motion.button>

                <div className="flex-1 min-w-0">
                    {editingId === task.id ? (
                        <input
                            className="input font-medium"
                            value={editTitle}
                            onChange={e => onEditTitleChange(e.target.value)}
                            onBlur={() => onSaveEdit(task.id)}
                            onKeyDown={e => e.key === 'Enter' && onSaveEdit(task.id)}
                            autoFocus
                        />
                    ) : (
                        <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-surface-500' : 'text-surface-800'}`}>
                            {task.title}
                        </p>
                    )}

                    {task.description && (
                        <p className="text-xs text-surface-500 mt-1 line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {task.due_date && (
                            <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-danger font-medium' : 'text-surface-500'}`}>
                                <Calendar className="h-3 w-3" />
                                {task.due_date}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-surface-500">
                            <Clock className="h-3 w-3" />
                            {task.estimated_minutes}m
                        </span>
                        <EnergyBadge level={task.energy_level} />
                        {task.priority > 0 && (
                            <span className="text-xs text-surface-500">P{task.priority}</span>
                        )}
                        {goal && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary-400">
                                <Target className="h-3 w-3" />
                                {goal.title}
                            </span>
                        )}
                        {project && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary-300">
                                <FolderOpen className="h-3 w-3" />
                                {project.title}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status === 'pending' && (
                        <motion.button
                            whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                            onClick={() => onUpdateStatus('in_progress')}
                            className="btn-icon btn-ghost p-1.5"
                            title="Start"
                        >
                            <Zap className="h-3.5 w-3.5 text-primary-400" />
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ y: -2 }}
                        onClick={() => onStartEdit(task.id, task.title)}
                        className="btn-icon btn-ghost p-1.5"
                        title="Edit"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </motion.button>
                    <motion.button
                        whileHover={{ y: -2 }}
                        onClick={onDelete}
                        className="btn-icon btn-ghost p-1.5 text-danger"
                        title="Delete"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

function EnergyBadge({ level }: { level: string }) {
    const config: Record<string, { label: string; class: string }> = {
        high: { label: 'High Energy', class: 'text-red-400 bg-danger-light' },
        medium: { label: 'Medium', class: 'text-yellow-400 bg-warning-light' },
        low: { label: 'Low Energy', class: 'text-green-400 bg-success-light' },
    };
    const c = config[level] || { label: level, class: 'text-surface-500 bg-white/5' };
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.class}`}>
            <Zap className="h-2.5 w-2.5 inline mr-0.5" />
            {c.label}
        </span>
    );
}

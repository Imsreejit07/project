import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';

export default function CreateTaskModal() {
    const { state, dispatch, actions } = useApp();
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 1,
        energy_level: 'medium',
        estimated_minutes: 30,
        due_date: '',
        project_id: '',
        goal_id: '',
        tags: '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            await actions.createTask({
                title: form.title.trim(),
                description: form.description.trim(),
                priority: form.priority,
                energy_level: form.energy_level as any,
                estimated_minutes: form.estimated_minutes,
                due_date: form.due_date || undefined,
                project_id: form.project_id || undefined,
                goal_id: form.goal_id || undefined,
                tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            } as any);
            dispatch({ type: 'TOGGLE_CREATE_TASK' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalBackdrop onClose={() => dispatch({ type: 'TOGGLE_CREATE_TASK' })}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-surface-900">New Task</h2>
                    <button type="button" onClick={() => dispatch({ type: 'TOGGLE_CREATE_TASK' })} className="btn-icon btn-ghost">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div>
                    <label className="label">Title</label>
                    <input
                        className="input-lg"
                        placeholder="What needs to be done?"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        autoFocus
                    />
                </div>

                <div>
                    <label className="label">Description</label>
                    <textarea
                        className="input min-h-[80px] resize-none"
                        placeholder="Additional details (optional)"
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="label">Priority</label>
                        <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}>
                            <option value={0}>None</option>
                            <option value={1}>Low</option>
                            <option value={2}>Medium</option>
                            <option value={3}>High</option>
                            <option value={4}>Urgent</option>
                            <option value={5}>Critical</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Energy</label>
                        <select className="input" value={form.energy_level} onChange={e => setForm(f => ({ ...f, energy_level: e.target.value }))}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Time (min)</label>
                        <input
                            type="number"
                            className="input"
                            min={5}
                            step={5}
                            value={form.estimated_minutes}
                            onChange={e => setForm(f => ({ ...f, estimated_minutes: Number(e.target.value) }))}
                        />
                    </div>
                </div>

                <div>
                    <label className="label">Due Date</label>
                    <input
                        type="date"
                        className="input"
                        value={form.due_date}
                        onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Goal</label>
                        <select className="input" value={form.goal_id} onChange={e => setForm(f => ({ ...f, goal_id: e.target.value }))}>
                            <option value="">None</option>
                            {state.goals.filter(g => g.status === 'active').map(g => (
                                <option key={g.id} value={g.id}>{g.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Project</label>
                        <select className="input" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                            <option value="">None</option>
                            {state.projects.filter(p => p.status === 'active').map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label">Tags</label>
                    <input
                        className="input"
                        placeholder="Comma-separated tags"
                        value={form.tags}
                        onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={!form.title.trim() || saving} className="btn-primary flex-1">
                        {saving ? 'Creating...' : 'Create Task'}
                    </button>
                    <button type="button" onClick={() => dispatch({ type: 'TOGGLE_CREATE_TASK' })} className="btn-secondary">
                        Cancel
                    </button>
                </div>
            </form>
        </ModalBackdrop>
    );
}

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-surface-0 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-auto">
                {children}
            </div>
        </div>
    );
}

export { ModalBackdrop };

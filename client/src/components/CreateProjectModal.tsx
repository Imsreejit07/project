import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';
import { ModalBackdrop } from './CreateTaskModal';

export default function CreateProjectModal() {
    const { state, dispatch, actions } = useApp();
    const [form, setForm] = useState({
        title: '',
        description: '',
        goal_id: '',
        priority: 1,
        deadline: '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            await actions.createProject({
                title: form.title.trim(),
                description: form.description.trim(),
                goal_id: form.goal_id || undefined,
                priority: form.priority,
                deadline: form.deadline || undefined,
            } as any);
            dispatch({ type: 'TOGGLE_CREATE_PROJECT' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalBackdrop onClose={() => dispatch({ type: 'TOGGLE_CREATE_PROJECT' })}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-surface-900">New Project</h2>
                    <button type="button" onClick={() => dispatch({ type: 'TOGGLE_CREATE_PROJECT' })} className="btn-icon btn-ghost">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div>
                    <label className="label">Project Name</label>
                    <input
                        className="input-lg"
                        placeholder="What's this project about?"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        autoFocus
                    />
                </div>

                <div>
                    <label className="label">Description</label>
                    <textarea
                        className="input min-h-[80px] resize-none"
                        placeholder="Project details (optional)"
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Link to Goal</label>
                        <select className="input" value={form.goal_id} onChange={e => setForm(f => ({ ...f, goal_id: e.target.value }))}>
                            <option value="">No goal</option>
                            {state.goals.filter(g => g.status === 'active').map(g => (
                                <option key={g.id} value={g.id}>{g.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Priority</label>
                        <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}>
                            <option value={1}>Low</option>
                            <option value={2}>Medium</option>
                            <option value={3}>High</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label">Deadline</label>
                    <input
                        type="date"
                        className="input"
                        value={form.deadline}
                        onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={!form.title.trim() || saving} className="btn-primary flex-1">
                        {saving ? 'Creating...' : 'Create Project'}
                    </button>
                    <button type="button" onClick={() => dispatch({ type: 'TOGGLE_CREATE_PROJECT' })} className="btn-secondary">
                        Cancel
                    </button>
                </div>
            </form>
        </ModalBackdrop>
    );
}

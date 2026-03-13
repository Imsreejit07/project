import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';
import { ModalBackdrop } from './CreateTaskModal';

export default function CreateGoalModal() {
    const { dispatch, actions } = useApp();
    const [form, setForm] = useState({
        title: '',
        description: '',
        vision: '',
        priority: 2,
        target_date: '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            await actions.createGoal({
                title: form.title.trim(),
                description: form.description.trim(),
                vision: form.vision.trim(),
                priority: form.priority,
                target_date: form.target_date || undefined,
            } as any);
            dispatch({ type: 'TOGGLE_CREATE_GOAL' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalBackdrop onClose={() => dispatch({ type: 'TOGGLE_CREATE_GOAL' })}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-surface-900">New Goal</h2>
                    <button type="button" onClick={() => dispatch({ type: 'TOGGLE_CREATE_GOAL' })} className="btn-icon btn-ghost">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div>
                    <label className="label">Goal Title</label>
                    <input
                        className="input-lg"
                        placeholder="What do you want to achieve?"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        autoFocus
                    />
                </div>

                <div>
                    <label className="label">Description</label>
                    <textarea
                        className="input min-h-[80px] resize-none"
                        placeholder="What does this goal involve?"
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="label">Vision</label>
                    <textarea
                        className="input min-h-[60px] resize-none"
                        placeholder="What does success look like? (optional)"
                        value={form.vision}
                        onChange={e => setForm(f => ({ ...f, vision: e.target.value }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Priority</label>
                        <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}>
                            <option value={1}>Low</option>
                            <option value={2}>Medium</option>
                            <option value={3}>High</option>
                            <option value={4}>Very High</option>
                            <option value={5}>Critical</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Target Date</label>
                        <input
                            type="date"
                            className="input"
                            value={form.target_date}
                            onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={!form.title.trim() || saving} className="btn-primary flex-1">
                        {saving ? 'Creating...' : 'Create Goal'}
                    </button>
                    <button type="button" onClick={() => dispatch({ type: 'TOGGLE_CREATE_GOAL' })} className="btn-secondary">
                        Cancel
                    </button>
                </div>
            </form>
        </ModalBackdrop>
    );
}

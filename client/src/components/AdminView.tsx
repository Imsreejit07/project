import { useEffect, useState } from 'react';
import { getAdminStats, getAdminUsers, updateAdminUser } from '@/api';

export default function AdminView() {
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);

    async function load() {
        const [s, u] = await Promise.all([getAdminStats(), getAdminUsers(1)]);
        setStats(s as any);
        setUsers((u as any).users || []);
    }

    useEffect(() => {
        load().catch(console.error);
    }, []);

    async function togglePlan(userId: string, currentPlan: 'free' | 'pro') {
        const next = currentPlan === 'pro' ? 'free' : 'pro';
        await updateAdminUser(userId, { plan: next });
        load().catch(console.error);
    }

    if (!stats) return <div className="text-surface-400">Loading admin data...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>

            <div className="grid md:grid-cols-5 gap-3">
                {[
                    ['Users', stats.totalUsers],
                    ['Pro Users', stats.proUsers],
                    ['MRR', `$${stats.mrr}`],
                    ['Tasks', stats.totalTasks],
                    ['Active Today', stats.activeToday],
                ].map(([label, value]) => (
                    <div key={label} className="card-glow rounded-xl p-4 border border-surface-800">
                        <div className="text-xs text-surface-400 uppercase">{label}</div>
                        <div className="text-2xl font-bold mt-1">{value}</div>
                    </div>
                ))}
            </div>

            <div className="card-glow rounded-xl border border-surface-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-800 font-medium">Users</div>
                <div className="divide-y divide-surface-800">
                    {users.map((u) => (
                        <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                            <div>
                                <div className="font-medium">{u.name} <span className="text-xs text-surface-500">({u.email})</span></div>
                                <div className="text-xs text-surface-400">Plan: {u.plan} • Tasks: {u.task_count}</div>
                            </div>
                            <button onClick={() => togglePlan(u.id, u.plan)} className="btn-secondary text-xs px-3 py-1.5">
                                Switch to {u.plan === 'pro' ? 'Free' : 'Pro'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

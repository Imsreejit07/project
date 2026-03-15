import { useEffect, useState } from 'react';
import { BarChart3, Clock, Flame, TrendingUp, Tag, Lightbulb } from 'lucide-react';
import * as api from '@/api';
import { PatternAnalysis, UserStats } from '../types';
import GlowCard from './GlowCard';

export default function InsightsView() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [patterns, setPatterns] = useState<PatternAnalysis | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.getStats(), api.getPatterns()])
            .then(([s, p]) => { setStats(s); setPatterns(p); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-surface-500">Analyzing your patterns...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Insights</h1>
                <p className="text-surface-500 mt-1">Understand your work patterns and improve over time</p>
            </div>

            {/* Overview cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InsightCard icon={TrendingUp} label="Completion Rate" value={`${stats.completionRate}%`} subtitle={`${stats.completedTasks} of ${stats.totalTasks} tasks`} />
                    <InsightCard icon={Clock} label="Avg Session" value={`${stats.avgSessionDuration}min`} subtitle={`${stats.recentSessionCount} sessions (30d)`} />
                    <InsightCard icon={BarChart3} label="Focus Rating" value={stats.avgFocusRating > 0 ? `${stats.avgFocusRating}/5` : 'N/A'} subtitle="Average focus score" />
                    <InsightCard icon={Flame} label="Streak" value={patterns ? `${patterns.streaks.current}d` : '0d'} subtitle={patterns ? `Best: ${patterns.streaks.longest}d` : 'Start your streak!'} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Completion chart */}
                {stats && stats.completionsByDay.length > 0 && (
                    <GlowCard className="p-5">
                        <h3 className="font-semibold text-surface-900 mb-4 tracking-tight">Completions (30 days)</h3>
                        <div className="flex items-end gap-1 h-32">
                            {stats.completionsByDay.map((day, i) => {
                                const max = Math.max(...stats.completionsByDay.map(d => d.count), 1);
                                const height = Math.max(4, (day.count / max) * 100);
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                                        <span className="text-[9px] text-surface-500">{day.count}</span>
                                        <div
                                            className="w-full rounded-sm bg-gradient-to-t from-primary-600 to-primary-400 min-h-[4px] transition-all hover:from-primary-500 hover:to-primary-300"
                                            style={{ height: `${height}%` }}
                                            title={`${day.day}: ${day.count} tasks completed`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-surface-500">
                            <span>{stats.completionsByDay[0]?.day}</span>
                            <span>{stats.completionsByDay[stats.completionsByDay.length - 1]?.day}</span>
                        </div>
                    </GlowCard>
                )}

                {/* Productive time */}
                {patterns && (
                    <GlowCard className="p-5">
                        <h3 className="font-semibold text-surface-900 mb-4 tracking-tight">Your Productive Time</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-light">
                                    <Clock className="h-6 w-6 text-warning" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-surface-900 capitalize">{patterns.productiveSlot}</p>
                                    <p className="text-sm text-surface-500">Your peak focus time</p>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-surface-600">Avg tasks per day</span>
                                    <span className="font-medium text-surface-800">{patterns.avgTasksPerDay}</span>
                                </div>
                            </div>

                            {patterns.commonTags.length > 0 && (
                                <div>
                                    <p className="text-sm text-surface-600 mb-2">Common tags</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {patterns.commonTags.map(tag => (
                                            <span key={tag} className="badge-neutral">
                                                <Tag className="h-3 w-3 mr-1" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlowCard>
                )}
            </div>

            {/* Recommendations */}
            {patterns && patterns.recommendations.length > 0 && (
                <GlowCard className="p-5 border-primary-500/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="h-5 w-5 text-primary-400" />
                        <h3 className="font-semibold text-surface-900 tracking-tight">Recommendations</h3>
                    </div>
                    <div className="space-y-3">
                        {patterns.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/15 text-primary-400 text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-surface-700">{rec}</p>
                            </div>
                        ))}
                    </div>
                </GlowCard>
            )}

            {/* Empty state */}
            {(!stats || stats.totalTasks === 0) && (
                <GlowCard className="p-12 text-center">
                    <BarChart3 className="h-12 w-12 text-surface-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-surface-700 mb-2">No data yet</h3>
                    <p className="text-sm text-surface-500">Complete some tasks and the insights will appear here.</p>
                </GlowCard>
            )}
        </div>
    );
}

function InsightCard({ icon: Icon, label, value, subtitle }: {
    icon: any; label: string; value: string; subtitle: string;
}) {
    return (
        <GlowCard className="p-4">
            <div className="flex items-center gap-2 text-surface-500 mb-2">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-bold text-surface-900 tracking-tight">{value}</div>
            <div className="text-xs text-surface-500 mt-0.5">{subtitle}</div>
        </GlowCard>
    );
}

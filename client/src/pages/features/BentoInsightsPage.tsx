import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { BarChart3, TrendingUp, Clock, Flame, PieChart, Activity } from 'lucide-react';
import FeaturePageLayout from '../../components/FeaturePageLayout';
import GlowCard from '../../components/GlowCard';

function AnimatedChart() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const dataPoints = [30, 55, 40, 70, 45, 80, 65, 90, 50, 75, 85, 95];
    const max = Math.max(...dataPoints);

    return (
        <div ref={ref} className="max-w-3xl mx-auto">
            <GlowCard className="p-6">
                <h3 className="text-lg font-semibold text-surface-900 mb-6">Completion Rate — Last 12 Weeks</h3>

                {/* SVG Chart with pathLength animation */}
                <div className="relative h-48">
                    <svg viewBox="0 0 480 180" fill="none" className="w-full h-full" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((y) => (
                            <line key={y} x1="0" y1={180 - y * 160} x2="480" y2={180 - y * 160} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        ))}

                        {/* Area fill */}
                        <motion.path
                            d={`M0,180 ${dataPoints.map((p, i) => `L${i * (480 / (dataPoints.length - 1))},${180 - (p / max) * 160}`).join(' ')} L480,180 Z`}
                            fill="url(#areaGradient)"
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ duration: 1, delay: 0.5 }}
                        />

                        {/* Line path with animated pathLength */}
                        <motion.path
                            d={dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * (480 / (dataPoints.length - 1))},${180 - (p / max) * 160}`).join(' ')}
                            stroke="#8B5CF6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            initial={{ pathLength: 0 }}
                            animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
                            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as const }}
                        />

                        {/* Data points */}
                        {dataPoints.map((p, i) => (
                            <motion.circle
                                key={i}
                                cx={i * (480 / (dataPoints.length - 1))}
                                cy={180 - (p / max) * 160}
                                r="4"
                                fill="#08080A"
                                stroke="#8B5CF6"
                                strokeWidth="2"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                                transition={{ delay: 0.8 + i * 0.05, type: 'spring' as const, stiffness: 200 }}
                            />
                        ))}

                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(139,92,246,0.2)" />
                                <stop offset="100%" stopColor="rgba(139,92,246,0)" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Bento stat cards */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                    {[
                        { label: 'Avg Rate', value: '78%', delta: '+12%' },
                        { label: 'Best Week', value: '95%', delta: 'Week 12' },
                        { label: 'Sessions', value: '142', delta: '30 days' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            className="rounded-lg bg-white/5 p-3 text-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ delay: 1.2 + i * 0.1, type: 'spring' as const, damping: 20 }}
                        >
                            <div className="text-xl font-bold text-surface-900">{stat.value}</div>
                            <div className="text-xs text-surface-500">{stat.label}</div>
                            <div className="text-[10px] text-primary-400 mt-0.5">{stat.delta}</div>
                        </motion.div>
                    ))}
                </div>
            </GlowCard>
        </div>
    );
}

export default function BentoInsightsPage() {
    return (
        <FeaturePageLayout
            badge="Data Intelligence"
            title="Visualize your work with"
            titleHighlight="beautiful analytics."
            subtitle="Bento Insights transforms raw productivity data into gorgeous, interactive charts that reveal your performance patterns."
            demoSection={<AnimatedChart />}
            useCases={[
                { icon: <TrendingUp className="w-5 h-5" />, title: 'Trend Tracking', desc: 'Watch your completion rate evolve week over week with animated sparklines.' },
                { icon: <BarChart3 className="w-5 h-5" />, title: 'Session Logging', desc: 'Every work session is recorded with duration, focus rating, and task count.' },
                { icon: <PieChart className="w-5 h-5" />, title: 'Category Breakdown', desc: 'See how you split your time across goals, projects, and ad-hoc tasks.' },
                { icon: <Flame className="w-5 h-5" />, title: 'Streak Tracking', desc: 'Build and maintain daily productivity streaks to stay consistent.' },
                { icon: <Activity className="w-5 h-5" />, title: 'Focus Quality', desc: 'Rate your focus after each session to track cognitive performance.' },
                { icon: <Clock className="w-5 h-5" />, title: 'Time Analysis', desc: 'Discover which hours of the day produce your best work.' },
            ]}
            faqs={[
                { q: 'What data is tracked automatically?', a: 'Task completions, session duration, focus ratings, time-of-day patterns, and streak data are all tracked when you use FlowState.' },
                { q: 'Can I export my analytics?', a: 'Yes, Pro users can export all analytics data as CSV or PDF reports at any time.' },
                { q: 'How far back does historical data go?', a: 'Data is stored indefinitely. The dashboard shows 30-day trends by default, but you can query any date range.' },
            ]}
            prevPage={{ label: 'Flow Engine', href: '/features/flow-engine' }}
            nextPage={{ label: 'AI Strategist', href: '/features/ai-strategist' }}
        />
    );
}

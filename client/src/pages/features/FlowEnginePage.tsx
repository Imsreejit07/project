import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Sun, Cloud, Moon, Clock, Zap, Calendar, Coffee, Brain } from 'lucide-react';
import FeaturePageLayout from '../../components/FeaturePageLayout';
import GlowCard from '../../components/GlowCard';

const timelineItems = [
    { slot: 'Morning', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/15', time: '8:00 AM', tasks: ['Deep work session', 'Complex problem solving', 'Creative brainstorming'] },
    { slot: 'Afternoon', icon: Cloud, color: 'text-primary-400', bg: 'bg-primary-500/15', time: '1:00 PM', tasks: ['Team collaboration', 'Code reviews', 'Administrative tasks'] },
    { slot: 'Evening', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/15', time: '5:00 PM', tasks: ['Light planning', 'Documentation', 'Tomorrow preparation'] },
];

const itemVariants: Variants = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 100 } },
};

function TimelineDemo() {
    return (
        <div className="relative max-w-2xl mx-auto">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary-500/50 via-primary-400/30 to-transparent" />

            <div className="space-y-8">
                {timelineItems.map((item, i) => {
                    const ref = useRef<HTMLDivElement>(null);
                    const isInView = useInView(ref, { once: true, margin: '-100px' });
                    const Icon = item.icon;

                    return (
                        <motion.div
                            key={item.slot}
                            ref={ref}
                            variants={itemVariants}
                            initial="hidden"
                            animate={isInView ? 'visible' : 'hidden'}
                            transition={{ delay: i * 0.15 }}
                        >
                            <div className="flex gap-4">
                                <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-xl ${item.bg} flex-shrink-0`}>
                                    <Icon className={`h-6 w-6 ${item.color}`} />
                                </div>
                                <GlowCard className="flex-1 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-surface-900">{item.slot}</h3>
                                        <span className="text-xs text-surface-500">{item.time}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {item.tasks.map((task, j) => (
                                            <motion.div
                                                key={j}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                                                transition={{ delay: i * 0.15 + j * 0.1 + 0.2, type: 'spring' as const, damping: 20, stiffness: 100 }}
                                                className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-primary-500" />
                                                <span className="text-sm text-surface-700">{task}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </GlowCard>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export default function FlowEnginePage() {
    return (
        <FeaturePageLayout
            badge="Temporal Intelligence"
            title="Plan your day with"
            titleHighlight="chronological precision."
            subtitle="FlowState's Flow Engine divides your day into Morning, Afternoon, and Evening slots — matching high-energy tasks to peak focus windows."
            demoSection={<TimelineDemo />}
            useCases={[
                { icon: <Sun className="w-5 h-5" />, title: 'Energy-Aware Scheduling', desc: 'Assigns hard tasks to your peak energy periods and lightweight tasks to cool-down windows.' },
                { icon: <Calendar className="w-5 h-5" />, title: 'Adaptive Replanning', desc: 'If you miss a morning block, tasks cascade forward automatically without losing priority.' },
                { icon: <Coffee className="w-5 h-5" />, title: 'Break Intelligence', desc: 'Inserts optimal rest intervals between high-intensity focus blocks.' },
                { icon: <Clock className="w-5 h-5" />, title: 'Time Estimation', desc: 'Learns your speed patterns and adjusts task duration predictions over time.' },
                { icon: <Brain className="w-5 h-5" />, title: 'Context Switching Guard', desc: 'Groups similar tasks together to minimize cognitive load from topic jumps.' },
                { icon: <Zap className="w-5 h-5" />, title: 'Quick Reprioritization', desc: 'One-click drag to move tasks between time blocks when plans change.' },
            ]}
            faqs={[
                { q: 'How does FlowState decide task placement?', a: 'Tasks are scored by priority, energy level, deadline, and your historical productivity patterns. The AI optimizes placement using a weighted scoring algorithm.' },
                { q: 'Can I override the AI suggestions?', a: 'Absolutely. Drag and drop any task to a different time slot. The engine learns from your overrides.' },
                { q: 'What happens when I have too many tasks for one day?', a: 'The engine shows a capacity warning and suggests deferring low-priority tasks. It never overebooks your day.' },
            ]}
            nextPage={{ label: 'Bento Insights', href: '/features/bento-insights' }}
        />
    );
}

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Brain, Sparkles, Target, Lightbulb, MessageCircle, Wand2 } from 'lucide-react';
import FeaturePageLayout from '../../components/FeaturePageLayout';
import GlowCard from '../../components/GlowCard';

function NebulaDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div ref={ref} className="max-w-3xl mx-auto">
            <GlowCard className="p-8 relative overflow-hidden">
                {/* Nebula background */}
                <div
                    className="absolute inset-0 z-0"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Core glow */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3), rgba(139,92,246,0.05) 60%, transparent 80%)' }}
                        animate={{
                            scale: isHovered ? [1, 1.2, 1.1] : [1, 1.05, 1],
                            opacity: isHovered ? [0.6, 1, 0.8] : [0.4, 0.6, 0.4],
                        }}
                        transition={{ duration: isHovered ? 1 : 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    {/* Secondary glow */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)' }}
                        animate={{
                            scale: isHovered ? [1, 1.15, 1.05] : [1, 1.03, 1],
                            rotate: [0, 180, 360],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Particle dots */}
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-primary-400"
                            style={{
                                top: `${30 + Math.random() * 40}%`,
                                left: `${20 + Math.random() * 60}%`,
                            }}
                            animate={{
                                opacity: [0, 0.8, 0],
                                scale: [0.5, 1.5, 0.5],
                                y: [0, -20 + Math.random() * 40, 0],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 3,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                </div>

                {/* Content overlay */}
                <div className="relative z-10 text-center py-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring' as const, damping: 20, stiffness: 100 }}
                    >
                        <Brain className="w-16 h-16 text-primary-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-surface-900 mb-2">AI Strategist Neural Core</h3>
                        <p className="text-surface-500 max-w-md mx-auto">
                            Hover over the nebula to see the AI activate. This is how FlowState's intelligence breaks massive goals into small, achievable steps.
                        </p>
                    </motion.div>

                    {/* Simulated breakdown */}
                    <motion.div
                        className="mt-8 space-y-2 max-w-sm mx-auto"
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        {['Define project scope', 'Break into milestones', 'Generate task sequences', 'Assign energy levels', 'Schedule optimally'].map((step, i) => (
                            <motion.div
                                key={step}
                                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 text-sm text-surface-700"
                                initial={{ opacity: 0, x: -20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                transition={{ delay: 0.8 + i * 0.15, type: 'spring' as const, damping: 20 }}
                            >
                                <div className="h-5 w-5 rounded-full bg-primary-500/15 flex items-center justify-center text-[10px] font-bold text-primary-400 flex-shrink-0">{i + 1}</div>
                                {step}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </GlowCard>
        </div>
    );
}

export default function AIStrategistPage() {
    return (
        <FeaturePageLayout
            badge="Artificial Intelligence"
            title="Let AI break down"
            titleHighlight="impossible goals."
            subtitle="FlowState's AI Strategist powered by Gemini takes your high-level ambitions and transforms them into actionable daily step plans."
            demoSection={<NebulaDemo />}
            useCases={[
                { icon: <Target className="w-5 h-5" />, title: 'Goal Decomposition', desc: 'State a goal in plain language and watch AI create a full project breakdown.' },
                { icon: <Wand2 className="w-5 h-5" />, title: 'Smart Suggestions', desc: 'AI analyzes your workload and suggests the single best next action.' },
                { icon: <MessageCircle className="w-5 h-5" />, title: 'Natural Language Input', desc: 'Create tasks, goals, and plans by just typing or speaking naturally.' },
                { icon: <Lightbulb className="w-5 h-5" />, title: 'Pattern Insights', desc: 'Discovers your productivity patterns and recommends schedule optimizations.' },
                { icon: <Sparkles className="w-5 h-5" />, title: 'Auto-Prioritization', desc: 'Weighs deadlines, dependencies, and energy levels to rank your backlog.' },
                { icon: <Brain className="w-5 h-5" />, title: 'Contextual Memory', desc: 'AI remembers your past decisions to improve future suggestions continuously.' },
            ]}
            faqs={[
                { q: 'Which AI model powers the strategist?', a: 'FlowState uses Google Gemini for natural language understanding and task decomposition.' },
                { q: 'Is my data used to train the model?', a: 'No. Your productivity data stays private and is never used for model training.' },
                { q: 'How accurate is the AI at task estimation?', a: 'Accuracy improves over time. After 2 weeks of usage, time estimates become highly reliable.' },
            ]}
            prevPage={{ label: 'Bento Insights', href: '/features/bento-insights' }}
            nextPage={{ label: 'Architect', href: '/features/architect' }}
        />
    );
}

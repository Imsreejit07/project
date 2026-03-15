import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowRight, Sparkles, Timer, Moon, Eye, VolumeX, Focus, Minimize2, Brain, Target, BarChart3 } from 'lucide-react';
import TextReveal from '../components/TextReveal';
import GlowCard from '../components/GlowCard';
import Footer from '../components/Footer';

const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 100 } },
};

const features = [
    { icon: <Brain className="w-5 h-5" />, title: 'AI Planning Engine', href: '/features/flow-engine', desc: 'Builds your day based on priority, deadlines, and energy levels.' },
    { icon: <Target className="w-5 h-5" />, title: 'Goal-to-Task Alignment', href: '/features/flow-engine', desc: 'Every task maps back to your strategic goals.' },
    { icon: <ArrowRight className="w-5 h-5" />, title: 'Smart Next Action', href: '/features/flow-engine', desc: 'Know exactly what to work on next in one click.' },
    { icon: <BarChart3 className="w-5 h-5" />, title: 'Behavior Insights', href: '/features/bento-insights', desc: 'Track completion trends and focus quality over time.' },
    { icon: <Timer className="w-5 h-5" />, title: 'Zen Focus Mode', href: '/features/zen-mode', desc: 'Distraction-free timer with breathing rhythm guidance.' },
    { icon: <Focus className="w-5 h-5" />, title: 'Team Collaboration', href: '/features/connect', desc: 'Share projects and sync progress in real-time.' },
];

export default function FeaturesOverview() {
    return (
        <div className="min-h-screen bg-[#020203] text-surface-900">
            {/* Nav */}
            <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020203]/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-surface-500 hover:text-surface-900 font-medium transition-colors">
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        Back
                    </Link>
                    <div className="flex items-center gap-6 text-sm text-surface-500">
                        <Link to="/" className="hover:text-surface-800 transition-colors">Home</Link>
                        <Link to="/pricing" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Pricing</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative px-6 py-20 md:py-28 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-primary-500/10 to-transparent" />
                </div>
                <motion.div className="relative max-w-4xl mx-auto text-center" variants={stagger} initial="hidden" animate="show">
                    <motion.div variants={fadeUp}>
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 text-sm mb-6">
                            <Sparkles className="w-3.5 h-3.5" /> Core Features
                        </span>
                    </motion.div>
                    <TextReveal as="h1" className="text-4xl md:text-6xl font-black text-surface-900 leading-tight">
                        Everything you need to
                    </TextReveal>
                    <div className="overflow-hidden mt-1">
                        <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black gradient-text leading-tight">
                            master your workflow.
                        </motion.h1>
                    </div>
                    <motion.p variants={fadeUp} className="text-surface-500 text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
                        FlowState combines AI-powered planning, real-time insights, and distraction-free focus to help you achieve more.
                    </motion.p>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="px-6 pb-20">
                <motion.div
                    className="max-w-6xl mx-auto"
                    variants={stagger}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-80px' }}
                >
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((feature, i) => (
                            <motion.div key={i} variants={fadeUp} className="flex flex-col h-full">
                                <Link to={feature.href} className="flex flex-col h-full">
                                    <GlowCard className="p-5 flex flex-col h-full group cursor-pointer">
                                        <div className="mb-3 text-primary-400 group-hover:scale-110 transition-transform">{feature.icon}</div>
                                        <h3 className="text-lg font-semibold text-surface-900">{feature.title}</h3>
                                        <p className="mt-2 text-surface-500 text-sm leading-relaxed flex-grow">{feature.desc}</p>
                                        <div className="mt-4 flex items-center gap-2 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs font-medium">Learn more</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </GlowCard>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* CTA */}
            <section className="px-6 pb-20 text-center">
                <GlowCard className="max-w-3xl mx-auto p-10">
                    <h2 className="text-3xl font-bold text-surface-900 mb-3">Ready to reach your flow state?</h2>
                    <p className="text-surface-500 mb-6">Start organizing your work with AI-powered precision.</p>
                    <div className="flex gap-3 justify-center">
                        <Link to="/pricing" className="btn-primary px-6 py-3 shimmer-btn">View Pricing</Link>
                        <Link to="/" className="btn-secondary px-6 py-3">Back to Home</Link>
                    </div>
                </GlowCard>
            </section>

            <Footer />
        </div>
    );
}

import { ArrowRight, Zap, Target, Brain, Shield, BarChart3, Sparkles, Timer, Users, ChevronDown } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GlowCard from './GlowCard';
import TextReveal from './TextReveal';
import Footer from './Footer';

const staggerContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 100 } },
};

function Interactive3DCube() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const dragX = useMotionValue(0);
    const dragY = useMotionValue(0);

    // Rotation based on mouse position (tilt effect)
    const rotateX = useTransform(() => mouseY.get() / 10 + dragY.get() / 5, (v) => v);
    const rotateY = useTransform(() => -mouseX.get() / 10 + dragX.get() / 5, (v) => v);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ perspective: '1200px' }}
        >
            <motion.div
                className="relative w-48 h-48 md:w-64 md:h-64"
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                animate={{ rotateZ: [0, 360] }}
                transition={{ rotateZ: { duration: 30, repeat: Infinity, ease: 'linear' } }}
            >
                {/* Cube faces */}
                {[
                    { transform: 'translateZ(128px)', bg: 'from-primary-500/20 to-primary-600/10' },
                    { transform: 'translateZ(-128px) rotateY(180deg)', bg: 'from-primary-600/15 to-primary-700/10' },
                    { transform: 'translateX(128px) rotateY(90deg)', bg: 'from-primary-400/15 to-primary-500/10' },
                    { transform: 'translateX(-128px) rotateY(-90deg)', bg: 'from-violet-500/15 to-violet-600/10' },
                    { transform: 'translateY(-128px) rotateX(90deg)', bg: 'from-indigo-500/15 to-indigo-600/10' },
                    { transform: 'translateY(128px) rotateX(-90deg)', bg: 'from-purple-500/15 to-purple-600/10' },
                ].map((face, i) => (
                    <div
                        key={i}
                        className={`absolute inset-0 border border-primary-500/20 bg-gradient-to-br ${face.bg} backdrop-blur-sm rounded-xl shadow-lg`}
                        style={{ transform: face.transform, backfaceVisibility: 'hidden' }}
                    />
                ))}
                {/* Center glow */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translateZ(64px)' }}>
                    <div className="w-16 h-16 rounded-full bg-primary-500/30 blur-2xl animate-breathing" />
                </div>
            </motion.div>
        </div>
    );
}

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
    return (
        <div className="min-h-screen bg-[#020203] text-surface-900 overflow-hidden">
            {/* Nav */}
            <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020203]/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-surface-900 font-semibold">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                        </div>
                        FlowState
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm text-surface-500">
                        <Link to="/features" className="hover:text-surface-800 transition-colors">Features</Link>
                        <Link to="/pricing" className="hover:text-surface-800 transition-colors">Pricing</Link>
                        <motion.button
                            whileHover={{ y: -1 }}
                            onClick={onGetStarted}
                            className="btn-primary text-xs px-4 py-1.5"
                        >
                            Get Started
                        </motion.button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative px-6 py-20 md:py-28 min-h-[80vh] flex items-center">
                <Interactive3DCube />

                {/* Gradient overlays */}
                <div className="absolute inset-0 pointer-events-none z-[1]">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-gradient-radial from-primary-500/15 to-transparent" />
                    <div className="absolute top-40 -left-24 w-96 h-96 rounded-full bg-primary-400/10 blur-3xl" />
                    <div className="absolute bottom-0 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary-600/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020203] to-transparent" />
                </div>

                <motion.div className="relative max-w-6xl mx-auto z-[2] pointer-events-none" variants={staggerContainer} initial="hidden" animate="show">
                    <motion.div variants={fadeUp}>
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 text-sm mb-6">
                            <Sparkles className="w-4 h-4" /> AI-first productivity system
                        </span>
                    </motion.div>

                    <TextReveal as="h1" className="text-4xl md:text-6xl lg:text-7xl font-black text-surface-900 leading-tight max-w-4xl">
                        Focus on the right work,
                    </TextReveal>
                    <div className="overflow-hidden">
                        <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-black gradient-text leading-tight max-w-4xl">
                            every single day.
                        </motion.h1>
                    </div>

                    <motion.p variants={fadeUp} className="text-surface-500 text-lg md:text-xl mt-6 max-w-2xl leading-relaxed">
                        FlowState is your personal strategic assistant. It plans your day, prioritizes tasks, and keeps you in deep work mode.
                    </motion.p>

                    <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-3 pointer-events-auto">
                        <motion.button
                            whileHover={{ y: -2, boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onGetStarted}
                            className="btn-primary px-7 py-3 text-base font-semibold inline-flex items-center gap-2 justify-center shimmer-btn"
                        >
                            Get Started Free <ArrowRight className="w-4 h-4" />
                        </motion.button>
                        <Link
                            to="/pricing"
                            className="btn-secondary px-7 py-3 text-base font-semibold text-center inline-flex items-center justify-center"
                        >
                            View Pricing
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* Features grid with links */}
            <section id="features" className="px-6 pb-20 md:pb-28">
                <motion.div
                    className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-50px' }}
                >
                    {[
                        { icon: Brain, title: 'AI Planning Engine', desc: 'Builds your day based on priority, deadlines, and energy levels.', href: '/features/flow-engine' },
                        { icon: Target, title: 'Goal-to-Task Alignment', desc: 'Every task maps back to your strategic goals.', href: '/features/architect' },
                        { icon: Zap, title: 'Smart Next Action', desc: 'Know exactly what to work on next in one click.', href: '/features/ai-strategist' },
                        { icon: BarChart3, title: 'Behavior Insights', desc: 'Track completion trends and focus quality over time.', href: '/features/bento-insights' },
                        { icon: Timer, title: 'Zen Focus Mode', desc: 'Distraction-free timer with breathing rhythm guidance.', href: '/features/zen-mode' },
                        { icon: Users, title: 'Team Collaboration', desc: 'Share projects and sync progress in real-time.', href: '/features/connect' },
                    ].map((f) => (
                        <motion.div key={f.title} variants={fadeUp} className="flex flex-col h-full">
                            <Link to={f.href} className="flex flex-col h-full">
                                <GlowCard className="p-5 flex flex-col h-full group">
                                    <f.icon className="w-5 h-5 text-primary-400" />
                                    <h3 className="mt-3 text-lg font-semibold text-surface-900 group-hover:text-primary-400 transition-colors">{f.title}</h3>
                                    <p className="mt-2 text-surface-500 text-sm leading-relaxed flex-grow">{f.desc}</p>
                                    <span className="mt-3 text-xs text-primary-400 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Learn more <ArrowRight className="w-3 h-3" />
                                    </span>
                                </GlowCard>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* View All Features Button */}
                <motion.div
                    className="mt-12 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                >
                    <Link
                        to="/features"
                        className="btn-primary px-8 py-3 inline-flex items-center gap-2 shimmer-btn"
                    >
                        Explore All Features <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="px-6 py-20 md:py-28">
                <motion.div
                    className="max-w-3xl mx-auto"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.div variants={fadeUp} className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-black text-surface-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-surface-500 text-lg">
                            Everything you need to know about FlowState.
                        </p>
                    </motion.div>

                    <motion.div
                        className="space-y-3"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: '-50px' }}
                    >
                        {[
                            {
                                q: 'How does FlowState help me manage my time?',
                                a: 'FlowState uses AI to understand your priorities, deadlines, and energy levels. It automatically builds an optimized daily plan that maximizes your productivity while respecting your natural rhythms.',
                            },
                            {
                                q: 'Can I use FlowState with my team?',
                                a: 'Yes! With our Connect feature, you can share projects, assign tasks to team members, and sync progress in real-time. Perfect for small teams and collaborative workflows.',
                            },
                            {
                                q: 'What happens to my data if I cancel?',
                                a: 'Your data is yours. You can export all your tasks, goals, and insights as CSV or JSON at any time. Even after cancellation, you can still access and download your historical data.',
                            },
                            {
                                q: 'Is Zen Mode just a timer?',
                                a: 'No. Zen Mode is a distraction-free focus environment with breathing rhythm guidance, ambient soundscapes, and smart break detection. It learns your focus patterns and adapts over time.',
                            },
                            {
                                q: 'How accurate are the AI suggestions?',
                                a: 'The AI improves with every interaction. In the first week, suggestions are good. By week 3-4, they become highly personalized to your work style, energy levels, and patterns.',
                            },
                            {
                                q: 'Can I use FlowState offline?',
                                a: 'Yes. Your data syncs to your device, so you can access tasks and plans offline. Changes sync back when you\'re online again.',
                            },
                        ].map((item, i) => (
                            <FAQItem key={i} question={item.q} answer={item.a} index={i} />
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}

interface FAQItemProps {
    question: string;
    answer: string;
    index: number;
}

function FAQItem({ question, answer, index }: FAQItemProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            variants={fadeUp}
            className="group"
        >
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-primary-500/30 transition-all"
                whileHover={{ y: -2 }}
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-surface-900 pr-4">{question}</h3>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0"
                    >
                        <ChevronDown className="w-5 h-5 text-primary-400" />
                    </motion.div>
                </div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-white/10"
                    >
                        <p className="p-4 text-surface-600 leading-relaxed text-sm">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

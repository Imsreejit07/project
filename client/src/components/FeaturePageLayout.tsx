import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import TextReveal from './TextReveal';
import GlowCard from './GlowCard';

interface FAQ {
    q: string;
    a: string;
}

interface FeaturePageLayoutProps {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    demoSection: ReactNode;
    useCases: { icon: ReactNode; title: string; desc: string }[];
    faqs: FAQ[];
    nextPage?: { label: string; href: string };
    prevPage?: { label: string; href: string };
}

const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 100 } },
};

export default function FeaturePageLayout({
    badge, title, titleHighlight, subtitle,
    demoSection, useCases, faqs,
    nextPage, prevPage,
}: FeaturePageLayoutProps) {
    return (
        <div className="min-h-screen bg-[#020203] text-surface-900">
            {/* Nav */}
            <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020203]/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-surface-500 hover:text-surface-900 font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                    <div className="hidden md:flex items-center gap-6 text-sm text-surface-500">
                        <Link to="/features/flow-engine" className="hover:text-surface-800 transition-colors">Flow Engine</Link>
                        <Link to="/features/bento-insights" className="hover:text-surface-800 transition-colors">Insights</Link>
                        <Link to="/features/ai-strategist" className="hover:text-surface-800 transition-colors">AI Strategist</Link>
                        <Link to="/features/architect" className="hover:text-surface-800 transition-colors">Architect</Link>
                        <Link to="/features/zen-mode" className="hover:text-surface-800 transition-colors">Zen Mode</Link>
                        <Link to="/features/connect" className="hover:text-surface-800 transition-colors">Connect</Link>
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
                            <Sparkles className="w-3.5 h-3.5" /> {badge}
                        </span>
                    </motion.div>
                    <TextReveal as="h1" className="text-4xl md:text-6xl font-black text-surface-900 leading-tight">
                        {title}
                    </TextReveal>
                    <div className="overflow-hidden mt-1">
                        <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black gradient-text leading-tight">
                            {titleHighlight}
                        </motion.h1>
                    </div>
                    <motion.p variants={fadeUp} className="text-surface-500 text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </motion.p>
                </motion.div>
            </section>

            {/* Interactive Demo */}
            <section className="px-6 pb-20">
                <div className="max-w-6xl mx-auto">
                    {demoSection}
                </div>
            </section>

            {/* Use Cases */}
            <section className="px-6 pb-20">
                <motion.div
                    className="max-w-6xl mx-auto"
                    variants={stagger}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-80px' }}
                >
                    <TextReveal as="h2" className="text-3xl font-bold text-surface-900 mb-8 text-center">
                        Use Cases
                    </TextReveal>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {useCases.map((uc, i) => (
                            <motion.div key={i} variants={fadeUp} className="flex flex-col h-full">
                                <GlowCard className="p-5 flex flex-col h-full">
                                    <div className="mb-3 text-primary-400">{uc.icon}</div>
                                    <h3 className="text-lg font-semibold text-surface-900">{uc.title}</h3>
                                    <p className="mt-2 text-surface-500 text-sm leading-relaxed flex-grow">{uc.desc}</p>
                                </GlowCard>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* FAQ */}
            <section className="px-6 pb-20">
                <div className="max-w-3xl mx-auto">
                    <TextReveal as="h2" className="text-3xl font-bold text-surface-900 mb-8 text-center">
                        Technical FAQ
                    </TextReveal>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <GlowCard key={i} className="p-5">
                                <h4 className="text-base font-semibold text-surface-800">{faq.q}</h4>
                                <p className="mt-2 text-sm text-surface-500 leading-relaxed">{faq.a}</p>
                            </GlowCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Nav footer */}
            <section className="px-6 pb-20">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    {prevPage ? (
                        <Link to={prevPage.href} className="btn-secondary inline-flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> {prevPage.label}
                        </Link>
                    ) : <div />}
                    {nextPage ? (
                        <Link to={nextPage.href} className="btn-primary inline-flex items-center gap-2">
                            {nextPage.label} <ArrowRight className="w-4 h-4" />
                        </Link>
                    ) : <div />}
                </div>
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
        </div>
    );
}

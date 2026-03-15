import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, Zap } from 'lucide-react';
import GlowCard from '../components/GlowCard';
import TextReveal from '../components/TextReveal';

const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 100 } },
};

const plans = [
    {
        id: 'free',
        name: 'Free',
        monthlyPrice: 0,
        yearlyPrice: 0,
        desc: 'For individuals getting started with FlowState.',
        features: [
            'Up to 50 tasks',
            'Basic AI suggestions',
            'Daily planning (1 slot)',
            'Session tracking',
            '1 project',
            'Community support',
        ],
        cta: 'Get Started',
        popular: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        monthlyPrice: 40,
        yearlyPrice: 32,
        desc: 'For power users who want full AI and analytics.',
        features: [
            'Unlimited tasks',
            'Full AI Strategist (Gemini)',
            'Temporal planning (all slots)',
            'Advanced analytics & exports',
            'Unlimited projects & goals',
            'Zen Mode focus timer',
            'Connect collaboration',
            'Priority email support',
        ],
        cta: 'Start Pro Trial',
        popular: true,
    },
    {
        id: 'basic',
        name: 'Basic',
        monthlyPrice: 16,
        yearlyPrice: 12,
        desc: 'For professionals who need more power.',
        features: [
            'Up to 500 tasks',
            'Enhanced AI suggestions',
            'Temporal planning (all slots)',
            'Basic analytics',
            '10 projects',
            'Goal tracking',
            'Email support',
        ],
        cta: 'Start Basic Trial',
        popular: false,
    },
];

// Reorder for display: Free, Basic, Pro
const displayOrder = [plans[0], plans[2], plans[1]];

export default function PricingPage() {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <div className="min-h-screen bg-[#020203] text-surface-900">
            {/* Nav */}
            <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020203]/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-surface-900 font-semibold">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                        </div>
                        FlowState
                    </Link>
                    <Link to="/" className="btn-ghost text-sm">← Back to Home</Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative px-6 pt-20 pb-12 text-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-primary-500/10 to-transparent" />
                </div>
                <div className="relative">
                    <TextReveal as="h1" className="text-4xl md:text-6xl font-black text-surface-900 leading-tight">
                        Simple, transparent pricing.
                    </TextReveal>
                    <motion.p
                        className="text-surface-500 text-lg mt-4 max-w-xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, type: 'spring' as const, damping: 20 }}
                    >
                        Start free, scale when you need to. No hidden fees.
                    </motion.p>

                    {/* Annual/Monthly toggle */}
                    <motion.div
                        className="flex items-center justify-center gap-3 mt-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, type: 'spring' as const, damping: 20 }}
                    >
                        <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-surface-900' : 'text-surface-500'}`}>Monthly</span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="relative w-14 h-7 rounded-full bg-white/10 border border-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-colors"
                            aria-label="Toggle annual pricing"
                        >
                            <motion.div
                                className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg"
                                animate={{ x: isAnnual ? 28 : 0 }}
                                transition={{ type: 'spring' as const, damping: 20, stiffness: 300 }}
                            />
                        </button>
                        <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-surface-900' : 'text-surface-500'}`}>
                            Annual
                            <span className="ml-1.5 text-xs text-primary-400 font-semibold">Save 20%</span>
                        </span>
                    </motion.div>
                </div>
            </section>

            {/* Pricing cards */}
            <section className="px-6 pb-20">
                <motion.div
                    className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5"
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                >
                    {displayOrder.map((plan) => {
                        const price = isAnnual ? plan.yearlyPrice : plan.monthlyPrice;
                        return (
                            <motion.div key={plan.id} variants={fadeUp} className="relative flex flex-col h-full">
                                {/* Popular badge */}
                                {plan.popular && (
                                    <motion.div
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 z-20"
                                        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                                            <Sparkles className="w-3 h-3" /> Most Popular
                                        </span>
                                    </motion.div>
                                )}

                                <GlowCard
                                    className={`p-6 flex flex-col h-full ${plan.popular ? 'border-primary-500/30 ring-1 ring-primary-500/20' : ''}`}
                                    glowIntensity={plan.popular ? 0.25 : 0.15}
                                >
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-surface-900">{plan.name}</h3>
                                        <p className="text-surface-500 text-sm mt-1">{plan.desc}</p>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-surface-900">${price}</span>
                                            <span className="text-surface-500 text-sm">/mo</span>
                                        </div>
                                        {isAnnual && plan.monthlyPrice > 0 && (
                                            <p className="text-xs text-primary-400 mt-1">
                                                ${plan.yearlyPrice * 12}/year (billed annually)
                                            </p>
                                        )}
                                    </div>

                                    <ul className="space-y-2.5 flex-1">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2 text-sm text-surface-700">
                                                <Check className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <motion.button
                                        whileHover={{ y: -2, boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`w-full py-3 rounded-lg font-semibold text-sm transition-all relative overflow-hidden mt-auto ${plan.popular
                                                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                                                : 'bg-white/5 text-surface-700 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {/* Shimmer streak */}
                                        <span className="absolute inset-0 -translate-x-full animate-shimmer" style={{
                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                                        }} />
                                        <span className="relative z-10 inline-flex items-center gap-1.5">
                                            {plan.cta}
                                            {plan.popular && <Zap className="w-3.5 h-3.5" />}
                                        </span>
                                    </motion.button>
                                </GlowCard>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </section>

            {/* CTA */}
            <section className="px-6 pb-20 text-center">
                <GlowCard className="max-w-3xl mx-auto p-10">
                    <h2 className="text-3xl font-bold text-surface-900 mb-3">Ready to reach your flow state?</h2>
                    <p className="text-surface-500 mb-6">Start free today and upgrade when you need more power.</p>
                    <Link to="/" className="btn-primary px-8 py-3 inline-flex items-center gap-2 shimmer-btn">
                        Get Started Free <ArrowRight className="w-4 h-4" />
                    </Link>
                </GlowCard>
            </section>
        </div>
    );
}

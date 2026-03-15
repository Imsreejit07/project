import { motion } from 'framer-motion';
import { Mail, Github, Twitter, Youtube } from 'lucide-react';
import { useState } from 'react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 100 } },
};

const staggerContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

export default function Footer() {
    const [email, setEmail] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setSubscribeStatus('loading');
        try {
            // TODO: Replace with your actual newsletter subscription endpoint
            await new Promise(resolve => setTimeout(resolve, 800));
            setSubscribeStatus('success');
            setEmail('');
            setTimeout(() => setSubscribeStatus('idle'), 3000);
        } catch {
            setSubscribeStatus('error');
            setTimeout(() => setSubscribeStatus('idle'), 3000);
        }
    };

    return (
        <footer className="relative border-t border-white/[0.06] bg-[#020203] text-surface-900">
            {/* Gradient accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />

            <div className="max-w-6xl mx-auto px-6 py-16">
                {/* Main footer grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-50px' }}
                >
                    {/* Left column: Brand & Newsletter */}
                    <motion.div variants={fadeUp} className="lg:col-span-2">
                        {/* Brand */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                                </div>
                                <span className="text-lg font-bold gradient-text">FlowState</span>
                            </div>
                            <p className="text-sm text-surface-500 leading-relaxed">
                                Your personal strategic assistant. Plan smarter, execute faster, achieve more.
                            </p>
                        </div>

                        {/* Social icons */}
                        <div className="flex gap-3 mb-8">
                            {[
                                { icon: Twitter, href: 'https://twitter.com', label: 'X' },
                                { icon: Github, href: 'https://github.com', label: 'GitHub' },
                                { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
                            ].map(({ icon: Icon, href, label }) => (
                                <motion.a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-surface-400 hover:text-primary-400 hover:border-primary-500/30 hover:bg-primary-500/10 transition-all duration-300"
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label={label}
                                >
                                    <Icon className="h-4 w-4" />
                                </motion.a>
                            ))}
                        </div>

                        {/* Newsletter */}
                        <div>
                            <p className="text-xs font-semibold text-surface-400 mb-3 uppercase tracking-wider">Subscribe to our newsletter</p>
                            <form onSubmit={handleSubscribe} className="relative">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 to-violet-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                                    <div className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2 group-focus-within:border-primary-500/30 transition-colors">
                                        <Mail className="h-4 w-4 text-surface-400 flex-shrink-0 ml-2" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="flex-1 bg-transparent text-sm text-surface-900 placeholder:text-surface-500 outline-none"
                                            disabled={subscribeStatus === 'loading'}
                                        />
                                        <motion.button
                                            type="submit"
                                            disabled={!email || subscribeStatus === 'loading'}
                                            className="px-3 py-1.5 text-xs font-semibold bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 transition-colors flex-shrink-0"
                                            whileHover={{ y: -1 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                                        </motion.button>
                                    </div>
                                </div>
                                {subscribeStatus === 'success' && (
                                    <motion.p
                                        className="text-xs text-emerald-400 mt-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        Thanks for subscribing!
                                    </motion.p>
                                )}
                            </form>
                        </div>
                    </motion.div>

                    {/* Products */}
                    <motion.div variants={fadeUp}>
                        <h3 className="font-semibold text-surface-900 mb-4 text-sm uppercase tracking-wider text-primary-400">Products</h3>
                        <ul className="space-y-2.5">
                            {[
                                { label: 'Flow Engine', href: '/features/flow-engine' },
                                { label: 'AI Strategist', href: '/features/ai-strategist' },
                                { label: 'Zen Mode', href: '/features/zen-mode' },
                                { label: 'Insights', href: '/features/bento-insights' },
                            ].map(({ label, href }) => (
                                <li key={label}>
                                    <a
                                        href={href}
                                        className="text-sm text-surface-500 hover:text-primary-400 transition-colors"
                                    >
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Explore */}
                    <motion.div variants={fadeUp}>
                        <h3 className="font-semibold text-surface-900 mb-4 text-sm uppercase tracking-wider text-primary-400">Explore</h3>
                        <ul className="space-y-2.5">
                            {[
                                { label: 'Features', href: '#features' },
                                { label: 'Pricing', href: '/pricing' },
                                { label: 'Blog', href: '#' },
                                { label: 'Changelog', href: '#' },
                            ].map(({ label, href }) => (
                                <li key={label}>
                                    <a
                                        href={href}
                                        className="text-sm text-surface-500 hover:text-primary-400 transition-colors"
                                    >
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Company */}
                    <motion.div variants={fadeUp}>
                        <h3 className="font-semibold text-surface-900 mb-4 text-sm uppercase tracking-wider text-primary-400">Company</h3>
                        <ul className="space-y-2.5">
                            {[
                                { label: 'About', href: '#' },
                                { label: 'Contact', href: '#' },
                                { label: 'Privacy', href: '#' },
                                { label: 'Terms', href: '#' },
                            ].map(({ label, href }) => (
                                <li key={label}>
                                    <a
                                        href={href}
                                        className="text-sm text-surface-500 hover:text-primary-400 transition-colors"
                                    >
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </motion.div>

                {/* Bottom divider */}
                <div className="border-t border-white/[0.06]" />

                {/* Bottom section */}
                <motion.div
                    className="pt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-surface-500"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                >
                    <p>&copy; 2026 FlowState. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 sm:mt-0">
                        <a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary-400 transition-colors">Cookies</a>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}

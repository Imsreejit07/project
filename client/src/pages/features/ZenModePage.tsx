import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Timer, Moon, Eye, VolumeX, Focus, Minimize2 } from 'lucide-react';
import FeaturePageLayout from '../../components/FeaturePageLayout';
import GlowCard from '../../components/GlowCard';

function ZenDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const [isZen, setIsZen] = useState(false);

    // Display static timer without countdown
    const seconds = 25 * 60;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return (
        <div ref={ref} className="max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ type: 'spring' as const, damping: 20, stiffness: 100 }}
            >
                <GlowCard className="p-8 relative overflow-hidden">
                    {/* Breathing pulse background */}
                    <motion.div
                        className="absolute inset-0 z-0 pointer-events-none"
                        animate={isZen ? {
                            background: [
                                'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.05) 0%, transparent 60%)',
                                'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 70%)',
                                'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.05) 0%, transparent 60%)',
                            ],
                        } : {}}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* Breathing blur overlay */}
                    {isZen && (
                        <motion.div
                            className="absolute inset-0 z-0 pointer-events-none"
                            animate={{
                                backdropFilter: ['blur(0px)', 'blur(2px)', 'blur(0px)'],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    )}

                    <div className="relative z-10 text-center">
                        {/* Timer display */}
                        <motion.div
                            className="mb-6"
                            animate={isZen ? { scale: [1, 1.02, 1] } : {}}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <div className="text-7xl font-black text-surface-900 tracking-tighter tabular-nums">
                                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                            </div>
                            <p className="text-surface-500 text-sm mt-2">
                                {isZen ? 'Deep focus session active' : 'Pomodoro timer — 25 minutes'}
                            </p>
                        </motion.div>

                        {/* Current task */}
                        <div className="rounded-lg bg-white/5 p-3 mb-6 max-w-xs mx-auto">
                            <p className="text-xs text-surface-500 uppercase tracking-wider">Currently focusing on</p>
                            <p className="text-sm text-surface-800 font-medium mt-1">Your active focus task</p>
                        </div>

                        {/* Control */}
                        <motion.button
                            whileHover={{ y: -2, boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsZen(!isZen)}
                            className={`${isZen ? 'btn-secondary' : 'btn-primary shimmer-btn'} px-8 py-3 text-base font-semibold`}
                        >
                            {isZen ? 'Exit Zen Mode' : 'Enter Zen Mode'}
                        </motion.button>

                        {/* Zen indicators */}
                        {isZen && (
                            <motion.div
                                className="flex justify-center gap-4 mt-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {[
                                    { icon: VolumeX, label: 'Muted' },
                                    { icon: Eye, label: 'Dimmed' },
                                    { icon: Minimize2, label: 'Minimal' },
                                ].map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex items-center gap-1 text-xs text-primary-400">
                                        <Icon className="w-3.5 h-3.5" />
                                        {label}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </GlowCard>
            </motion.div>
        </div>
    );
}

export default function ZenModePage() {
    return (
        <FeaturePageLayout
            badge="Focus Engineering"
            title="Eliminate distractions with"
            titleHighlight="deep focus mode."
            subtitle="Zen Mode dims your interface, mutes notifications, and creates a breathing rhythm that guides you into a flow state."
            demoSection={<ZenDemo />}
            useCases={[
                { icon: <Timer className="w-5 h-5" />, title: 'Pomodoro Timer', desc: 'Built-in 25/5 Pomodoro timer with automatic break scheduling.' },
                { icon: <Moon className="w-5 h-5" />, title: 'Interface Dimming', desc: 'Non-essential UI elements fade to near-invisible during focus sessions.' },
                { icon: <VolumeX className="w-5 h-5" />, title: 'Notification Silencing', desc: 'All in-app notifications are queued until the session ends.' },
                { icon: <Eye className="w-5 h-5" />, title: 'Single-Task View', desc: 'Only the current task is visible, removing all other cognitive load.' },
                { icon: <Focus className="w-5 h-5" />, title: 'Focus Rating', desc: 'Rate your focus quality after each session to track improvement.' },
                { icon: <Minimize2 className="w-5 h-5" />, title: 'Minimal Mode', desc: 'Reduces the interface to just timer, task name, and complete button.' },
            ]}
            faqs={[
                { q: 'Does Zen Mode block external notifications?', a: 'Zen Mode silences in-app notifications. Browser/OS notifications depend on your system settings.' },
                { q: 'Can I customize the timer duration?', a: 'Yes. You can set custom focus and break durations from 5 minutes to 120 minutes.' },
                { q: 'What is the breathing rhythm?', a: 'The background pulses gently at 4-second intervals, mimicking a calming breathing pattern to reduce anxiety.' },
            ]}
            prevPage={{ label: 'Architect', href: '/features/architect' }}
            nextPage={{ label: 'Connect', href: '/features/connect' }}
        />
    );
}

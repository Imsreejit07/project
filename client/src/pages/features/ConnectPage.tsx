import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Share2, Globe, MessageSquare, Lock, Wifi } from 'lucide-react';
import FeaturePageLayout from '../../components/FeaturePageLayout';
import GlowCard from '../../components/GlowCard';

const avatars = [
    { name: 'AK', color: 'from-violet-500 to-purple-600', x: 15, y: 25 },
    { name: 'MJ', color: 'from-blue-500 to-cyan-500', x: 65, y: 15 },
    { name: 'RW', color: 'from-pink-500 to-rose-500', x: 40, y: 60 },
    { name: 'SL', color: 'from-emerald-500 to-green-500', x: 80, y: 55 },
    { name: 'TP', color: 'from-amber-500 to-orange-500', x: 25, y: 75 },
    { name: 'NK', color: 'from-indigo-500 to-blue-600', x: 70, y: 80 },
];

function CollabDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <div ref={ref} className="max-w-3xl mx-auto">
            <GlowCard className="p-8 relative overflow-hidden" style={{ minHeight: 360 }}>
                {/* Grid background */}
                <div className="absolute inset-0 z-0 opacity-20"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(139,92,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.15) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Scanning light effect */}
                <motion.div
                    className="absolute top-0 bottom-0 w-40 z-[1] pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.08), transparent)' }}
                    animate={{ x: ['-160px', 'calc(100% + 160px)'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full z-[2] pointer-events-none">
                    {avatars.map((a, i) =>
                        avatars.slice(i + 1).map((b, j) => (
                            <motion.line
                                key={`${i}-${j}`}
                                x1={`${a.x}%`} y1={`${a.y}%`}
                                x2={`${b.x}%`} y2={`${b.y}%`}
                                stroke="rgba(139,92,246,0.15)"
                                strokeWidth="1"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                                transition={{ delay: 0.5 + (i + j) * 0.05, duration: 0.8 }}
                            />
                        ))
                    )}
                </svg>

                {/* Floating avatars */}
                {avatars.map((avatar, i) => (
                    <motion.div
                        key={avatar.name}
                        className="absolute z-[3]"
                        style={{ left: `${avatar.x}%`, top: `${avatar.y}%`, transform: 'translate(-50%, -50%)' }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={isInView ? {
                            scale: 1,
                            opacity: 1,
                            y: [0, -8, 0],
                        } : { scale: 0, opacity: 0 }}
                        transition={{
                            scale: { delay: 0.2 + i * 0.1, type: 'spring' as const, stiffness: 200 },
                            opacity: { delay: 0.2 + i * 0.1 },
                            y: { delay: 1 + i * 0.3, duration: 3, repeat: Infinity, ease: 'easeInOut' },
                        }}
                    >
                        <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${avatar.color} flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-[#08080A]`}>
                            {avatar.name}
                        </div>
                        <motion.div
                            className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-[#08080A]"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </motion.div>
                ))}

                {/* Center info card */}
                <motion.div
                    className="absolute z-[4] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ delay: 1, type: 'spring' as const, damping: 20 }}
                >
                    <div className="bg-[#08080A]/90 backdrop-blur-xl rounded-xl border border-white/10 p-4 shadow-2xl text-center">
                        <Globe className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                        <div className="text-sm font-semibold text-surface-900">6 collaborators</div>
                        <div className="text-xs text-surface-500">All in sync</div>
                    </div>
                </motion.div>
            </GlowCard>
        </div>
    );
}

export default function ConnectPage() {
    return (
        <FeaturePageLayout
            badge="Team Collaboration"
            title="Build together with"
            titleHighlight="real-time sync."
            subtitle="Connect brings team collaboration to FlowState — share projects, sync progress, and work together in real-time."
            demoSection={<CollabDemo />}
            useCases={[
                { icon: <Share2 className="w-5 h-5" />, title: 'Project Sharing', desc: 'Share entire project trees with collaborators and track shared progress.' },
                { icon: <Users className="w-5 h-5" />, title: 'Team Workspaces', desc: 'Create shared workspaces where everyone sees the same goals and tasks.' },
                { icon: <Wifi className="w-5 h-5" />, title: 'Live Updates', desc: 'Changes sync instantly across all connected devices and team members.' },
                { icon: <MessageSquare className="w-5 h-5" />, title: 'Task Comments', desc: 'Discuss tasks inline with threaded comments and @mentions.' },
                { icon: <Lock className="w-5 h-5" />, title: 'Permission Control', desc: 'Set viewer, editor, or admin roles for each team member per project.' },
                { icon: <Globe className="w-5 h-5" />, title: 'Public Dashboards', desc: 'Share a read-only view of your progress with stakeholders.' },
            ]}
            faqs={[
                { q: 'Is Connect available on the free plan?', a: 'Connect is a Pro feature. Free users can share up to 1 project with 1 collaborator.' },
                { q: 'How does real-time sync work?', a: 'We use WebSockets for instant updates. Changes propagate within 100ms to all connected clients.' },
                { q: 'Can I revoke access to a shared project?', a: 'Yes. Project owners can add or remove collaborators and change permission levels at any time.' },
            ]}
            prevPage={{ label: 'Zen Mode', href: '/features/zen-mode' }}
        />
    );
}

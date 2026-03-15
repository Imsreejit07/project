import { motion } from 'framer-motion';
import GlowCard from './GlowCard';
import Skeleton from './Skeleton';

const staggerContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const slideUpItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 100 } },
};

export default function DashboardLoading() {
    return (
        <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.3 } }}
        >
            {/* Header Skeletons */}
            <motion.div variants={slideUpItem} className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 max-w-full" />
            </motion.div>

            {/* Quick Stats Grid */}
            <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={staggerContainer}>
                {[1, 2, 3, 4].map((i) => (
                    <motion.div key={i} variants={slideUpItem}>
                        <GlowCard className="p-4 bg-[#08080A]/80 border-transparent">
                            <div className="flex items-center gap-3">
                                {/* Icon skeleton */}
                                <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                                <div className="space-y-2 flex-1">
                                    {/* Value skeleton */}
                                    <Skeleton className="h-6 w-1/2" />
                                    {/* Label skeleton */}
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            </div>
                        </GlowCard>
                    </motion.div>
                ))}
            </motion.div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Priority focus */}
                <div className="lg:col-span-2 space-y-6">
                    {/* AI Suggestions Skeleton */}
                    <motion.div variants={slideUpItem}>
                        <GlowCard className="p-5 bg-[#08080A]/80 border-transparent">
                            <div className="flex items-center gap-2 mb-4">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <Skeleton className="h-5 w-40" />
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                                        <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                                        <div className="flex-1 space-y-2 py-1">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                        <Skeleton className="h-8 w-16 rounded-lg flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </GlowCard>
                    </motion.div>

                    {/* Today's tasks skeleton */}
                    <motion.div variants={slideUpItem}>
                        <GlowCard className="p-5 bg-[#08080A]/80 border-transparent">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                                <Skeleton className="h-8 w-24 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                                        <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-2/3" />
                                        </div>
                                        <Skeleton className="h-4 w-8" />
                                    </div>
                                ))}
                            </div>
                        </GlowCard>
                    </motion.div>
                </div>

                {/* Right: Activity Skeletons */}
                <div className="space-y-6">
                    {/* Quick Actions Skeleton */}
                    <motion.div variants={slideUpItem}>
                        <GlowCard className="p-5 bg-[#08080A]/80 border-transparent">
                            <Skeleton className="h-5 w-32 mb-4" />
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                                ))}
                            </div>
                        </GlowCard>
                    </motion.div>

                    {/* Chart Skeleton */}
                    <motion.div variants={slideUpItem}>
                        <GlowCard className="p-5 bg-[#08080A]/80 border-transparent">
                            <Skeleton className="h-5 w-40 mb-4" />
                            <div className="flex items-end gap-1 h-20">
                                {Array.from({ length: 14 }).map((_, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                                        <Skeleton 
                                            className="w-full rounded-sm" 
                                            style={{ height: `${20 + Math.random() * 80}%` }} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </GlowCard>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

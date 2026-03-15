import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

export default function SplinePreloader({ onComplete }: { onComplete: () => void }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate resource loading (0 to 100% over ~2-3 seconds)
        const duration = 2500; // 2.5s minimum loader time
        const interval = 50;
        const steps = duration / interval;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            // Use an easing function for more realistic loading feel (fast start, slow end)
            const easeOutQuart = 1 - Math.pow(1 - currentStep / steps, 4);
            const nextProgress = Math.min(100, Math.floor(easeOutQuart * 100));
            
            setProgress(nextProgress);

            if (currentStep >= steps) {
                clearInterval(timer);
                setTimeout(onComplete, 400); // Brief pause at 100% before firing complete
            }
        }, interval);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            <motion.div 
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020203] overflow-hidden"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Background ambient glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[500px] h-[500px] rounded-full bg-primary-500/10 blur-3xl" />
                </div>

                {/* 3D Spline Cube - 100px */}
                <div className="relative w-[100px] h-[100px] mb-8">
                    <Suspense fallback={<div className="w-full h-full rounded-xl bg-white/5 animate-pulse-subtle" />}>
                        <div className="absolute inset-0 scale-[0.4] origin-center -translate-y-4">
                            <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
                        </div>
                    </Suspense>
                </div>

                {/* Loading Counter & Bar */}
                <div className="text-center relative z-10">
                    <div className="text-2xl font-black text-surface-900 tracking-tighter tabular-nums mb-4 flex items-baseline justify-center gap-1">
                        {progress}
                        <span className="text-sm text-surface-500 font-medium">%</span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden relative">
                        <motion.div 
                            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-primary-600 to-primary-400"
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: 'easeOut', duration: 0.1 }}
                        />
                    </div>
                    
                    <div className="mt-4 text-xs font-medium text-primary-400/80 tracking-widest uppercase">
                        Initializing FlowState
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

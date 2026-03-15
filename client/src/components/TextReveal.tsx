import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface TextRevealProps {
    children: string;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
    delay?: number;
}

const revealVariants: Variants = {
    hidden: { y: '100%' },
    visible: (delay: number) => ({
        y: '0%',
        transition: {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1] as const,
            delay,
        },
    }),
};

export default function TextReveal({
    children,
    className = '',
    as: Tag = 'h2',
    delay = 0,
}: TextRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <div ref={ref} className="overflow-hidden">
            <motion.div
                custom={delay}
                variants={revealVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
            >
                {Tag === 'h1' && <h1 className={className}>{children}</h1>}
                {Tag === 'h2' && <h2 className={className}>{children}</h2>}
                {Tag === 'h3' && <h3 className={className}>{children}</h3>}
                {Tag === 'p' && <p className={className}>{children}</p>}
                {Tag === 'span' && <span className={className}>{children}</span>}
            </motion.div>
        </div>
    );
}

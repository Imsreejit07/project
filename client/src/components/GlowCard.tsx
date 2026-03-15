import { useRef, useCallback, type ReactNode, type MouseEvent } from 'react';

interface GlowCardProps {
    children: ReactNode;
    className?: string;
    glowColor?: string;
    glowIntensity?: number;
    style?: React.CSSProperties;
}

export default function GlowCard({
    children,
    className = '',
    glowColor = '139,92,246',
    glowIntensity = 0.15,
    style,
}: GlowCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const borderRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);

    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            if (!cardRef.current || !glowRef.current || !borderRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const bg = `radial-gradient(600px circle at ${x}px ${y}px, rgba(${glowColor},${glowIntensity}), transparent 40%)`;
            const border = `radial-gradient(400px circle at ${x}px ${y}px, rgba(${glowColor},${glowIntensity + 0.1}), transparent 40%)`;
            glowRef.current.style.background = bg;
            borderRef.current.style.background = border;
        });
    }, [glowColor, glowIntensity]);

    const handleEnter = useCallback(() => {
        if (glowRef.current) glowRef.current.style.opacity = '1';
        if (borderRef.current) borderRef.current.style.opacity = '1';
    }, []);

    const handleLeave = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        if (glowRef.current) glowRef.current.style.opacity = '0';
        if (borderRef.current) borderRef.current.style.opacity = '0';
    }, []);

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            className={`relative rounded-xl bg-[#08080A] border border-white/[0.06] overflow-hidden ${className}`}
            style={{ isolation: 'isolate', ...style }}
        >
            <div
                ref={glowRef}
                className="pointer-events-none absolute inset-0 z-0 rounded-xl transition-opacity duration-300"
                style={{ opacity: 0 }}
            />
            <div
                ref={borderRef}
                className="pointer-events-none absolute inset-0 z-0 rounded-xl transition-opacity duration-300"
                style={{
                    opacity: 0,
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                    padding: '1px',
                }}
            />
            <div className={`relative z-10 ${className.includes('flex') ? 'flex flex-col' : ''} ${className.includes('h-full') ? 'h-full' : ''}`}>{children}</div>
        </div>
    );
}

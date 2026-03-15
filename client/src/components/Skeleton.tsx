import React from 'react';

/**
 * A high-end skeleton placeholder component matching Bridgemind UI aesthetics.
 * Uses a diagonal 1.5s light streak shimmer effect over a bg-white/5 base.
 */
export default function Skeleton({
    className = '',
    style,
}: {
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div 
            className={`skeleton-shimmer rounded-md ${className}`} 
            style={style}
        />
    );
}

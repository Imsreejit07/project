/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8B5CF6',
                    600: '#7C3AED',
                    700: '#6D28D9',
                    800: '#5B21B6',
                    900: '#4C1D95',
                },
                surface: {
                    0: '#020203',
                    50: '#08080A',
                    100: '#111113',
                    200: '#1A1A1E',
                    300: '#262630',
                    400: '#525263',
                    500: '#737380',
                    600: '#a3a3b0',
                    700: '#d4d4dd',
                    800: '#e5e5eb',
                    900: '#f5f5f8',
                    950: '#fafafc',
                },
                success: { DEFAULT: '#22c55e', light: 'rgba(34,197,94,0.15)' },
                warning: { DEFAULT: '#eab308', light: 'rgba(234,179,8,0.15)' },
                danger: { DEFAULT: '#ef4444', light: 'rgba(239,68,68,0.15)' },
                accent: { DEFAULT: '#8B5CF6', light: 'rgba(139,92,246,0.15)' },
                glow: {
                    purple: 'rgba(139,92,246,0.15)',
                    border: 'rgba(139,92,246,0.3)',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            letterSpacing: {
                tighter: '-0.05em',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
            animation: {
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-out',
                'pulse-subtle': 'pulseSubtle 2s infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'breathing': 'breathing 3s ease-in-out infinite',
                'scan-line': 'scanLine 4s ease-in-out infinite',
                'shimmer-skeleton': 'shimmerSkeleton 1.5s infinite linear',
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                pulseSubtle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                breathing: {
                    '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
                    '50%': { transform: 'scale(1.05)', opacity: '1' },
                },
                scanLine: {
                    '0%': { transform: 'translateX(-100%)' },
                    '50%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
                shimmerSkeleton: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
            },
        },
    },
    plugins: [],
};

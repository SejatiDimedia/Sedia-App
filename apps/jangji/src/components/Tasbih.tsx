'use client';

import { useState, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RotateCcw, Fingerprint } from 'lucide-react';

export default function Tasbih() {
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(33);
    const controls = useAnimation();

    const handleIncrement = useCallback(() => {
        setCount(prev => prev + 1);

        // Haptic feedback if available
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(20);
        }

        // Tap animation
        controls.start({
            scale: [1, 0.95, 1],
            transition: { duration: 0.1 }
        });
    }, [controls]);

    const handleReset = () => {
        setCount(0);
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([30, 30, 30]);
        }
    };

    // Progress calculation
    const progress = Math.min((count % target) / target * 100, 100);

    return (
        <div className="flex flex-col items-center gap-10">
            {/* Display and Progress */}
            <div className="relative flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="h-64 w-64 -rotate-90 transform">
                    <circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-secondary/30"
                    />
                    <motion.circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray="691"
                        strokeDashoffset={691 - (691 * progress) / 100}
                        strokeLinecap="round"
                        className="text-primary"
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    />
                </svg>

                {/* Counter Text */}
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Tap</span>
                    <motion.span
                        key={count}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-7xl font-black tabular-nums text-primary"
                    >
                        {count}
                    </motion.span>
                    <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <span className="text-[10px] font-bold text-primary">TARGET {target}</span>
                    </div>
                </div>
            </div>

            {/* Target Selection */}
            <div className="flex gap-4">
                {[33, 99, 1000].map(val => (
                    <button
                        key={val}
                        onClick={() => {
                            setTarget(val);
                            setCount(0);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${target === val
                            ? 'bg-primary/10 border-primary text-primary shadow-sm'
                            : 'bg-background border-secondary text-muted-foreground hover:bg-secondary/30'
                            }`}
                    >
                        {val === 1000 ? 'Free' : val}
                    </button>
                ))}
            </div>

            {/* Interaction Buttons */}
            <div className="w-full flex items-center justify-center gap-6">
                <button
                    onClick={handleReset}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/30 text-muted-foreground hover:bg-secondary/50 transition-colors border border-primary/10 active:scale-90"
                >
                    <RotateCcw className="h-6 w-6" />
                </button>

                <motion.button
                    animate={controls}
                    onClick={handleIncrement}
                    className="flex-1 max-w-[200px] h-20 bg-primary text-white rounded-[2.5rem] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <Fingerprint className="h-8 w-8" />
                    <span className="text-xl font-bold uppercase tracking-wider">Tap Dzikir</span>
                </motion.button>
            </div>

            <p className="text-xs text-muted-foreground/60 font-medium text-center">
                Tap tombol besar atau sembarang di area layar <br /> (Hanya bekerja pada mode sentuh)
            </p>
        </div>
    );
}

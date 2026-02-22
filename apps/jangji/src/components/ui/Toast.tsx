'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type = 'success', isVisible, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose, duration]);

    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />
    };

    const colors = {
        success: 'border-green-500/20 bg-green-50/90 dark:bg-green-500/10',
        error: 'border-red-500/20 bg-red-50/90 dark:bg-red-500/10',
        info: 'border-blue-500/20 bg-blue-50/90 dark:bg-blue-500/10'
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`fixed bottom-8 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md ${colors[type]}`}
                >
                    {icons[type]}
                    <span className="text-sm font-bold text-foreground">{message}</span>
                    <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

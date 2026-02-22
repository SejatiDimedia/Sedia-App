'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'primary' | 'danger';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    type = 'primary'
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm dark:bg-black/60"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 10 }}
                            className="w-full max-w-sm overflow-hidden rounded-3xl bg-background border border-secondary/30 p-6 shadow-2xl pointer-events-auto"
                        >
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                    <AlertCircle className="h-8 w-8" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-foreground">{title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {message}
                                    </p>
                                </div>

                                <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 rounded-xl bg-secondary/30 py-3 text-sm font-bold text-foreground transition-all hover:bg-secondary/50"
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all ${type === 'danger' ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 'bg-primary shadow-primary/20 hover:bg-primary/90'}`}
                                    >
                                        {confirmText}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

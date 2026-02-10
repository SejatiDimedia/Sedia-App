"use client";

import { useState, useEffect } from "react";
import { X, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import KatsiraLogo from "@/components/KatsiraLogo";

interface GreetingPopupProps {
    outletName: string;
    greeting: string;
    primaryColor?: string;
}

export function GreetingPopup({ outletName, greeting, primaryColor = "#2e6a69" }: GreetingPopupProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Show immediately (or with slight delay) every time the component mounts
        const timer = setTimeout(() => setIsOpen(true), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    // Staggered animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any } // Custom easeOutCubic
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
                    />

                    {/* Popup Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white/90 backdrop-blur-3xl shadow-2xl ring-1 ring-white/50"
                    >
                        {/* Subtle Gradient Spot */}
                        <div
                            className="absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-10 blur-3xl pointer-events-none"
                            style={{ backgroundColor: primaryColor }}
                        />
                        <div
                            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-10 blur-3xl pointer-events-none"
                            style={{ backgroundColor: primaryColor }}
                        />

                        <div className="relative p-8 text-center flex flex-col items-center">
                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 rounded-full p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-90"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="w-full"
                            >
                                <motion.div variants={itemVariants} className="mb-6 space-y-2">
                                    <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                                        Selamat Datang di
                                    </span>
                                    <h1
                                        className="text-3xl font-brand font-black text-zinc-900 tracking-tight leading-tight"
                                    >
                                        {outletName}
                                    </h1>
                                </motion.div>

                                <motion.div variants={itemVariants} className="mb-8">
                                    <div className="relative">
                                        <span className="absolute -top-4 -left-2 text-4xl text-zinc-200 font-serif leading-none">“</span>
                                        <p className="text-lg leading-relaxed text-zinc-600 font-medium px-4">
                                            {greeting}
                                        </p>
                                        <span className="absolute -bottom-6 -right-2 text-4xl text-zinc-200 font-serif leading-none transform rotate-180">“</span>
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants} className="w-full">
                                    <button
                                        onClick={handleClose}
                                        className="group relative flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:shadow-lg active:scale-[0.98] overflow-hidden"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        <div className="absolute inset-0 bg-black/10 translate-y-full transition-transform group-hover:translate-y-0 duration-300" />
                                        <ShoppingBag className="h-4 w-4 relative z-10" />
                                        <span className="relative z-10">Mulai Pesan</span>
                                    </button>
                                </motion.div>

                                <motion.div variants={itemVariants} className="mt-8 flex justify-center opacity-30 grayscale transition-all hover:opacity-80 hover:grayscale-0">
                                    <div className="flex items-center gap-1.5 scale-90">
                                        <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest">Powered by</span>
                                        <KatsiraLogo size={12} primaryColor="#27272a" />
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}


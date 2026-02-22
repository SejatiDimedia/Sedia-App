'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, BookOpen, CloudLightning, ShieldCheck } from 'lucide-react';

interface WelcomeScreenProps {
    onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F5F7F5] dark:bg-[#0D0D0D] p-6 text-center"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                    <span className="absolute top-10 -left-10 font-arabic text-[300px] leading-none text-primary">
                        القرآن
                    </span>
                    <span className="absolute -bottom-20 -right-20 font-arabic text-[400px] leading-none text-primary">
                        كريم
                    </span>
                </div>

                <div className="relative z-10 max-w-lg w-full">
                    {/* Logo Section */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                        className="mb-8 flex flex-col items-center"
                    >
                        <div className="relative h-24 w-24 mb-4 rounded-3xl bg-primary/10 p-4 shadow-inner">
                            <Image
                                src="/Jangji_Logo.png"
                                alt="Jangji Logo"
                                fill
                                className="object-contain p-2"
                            />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-primary">Jangji</h1>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground mt-1">Jejak Ngaji</p>
                    </motion.div>

                    {/* Content Section */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Selamat Datang di Jangji</h2>
                            <p className="text-muted-foreground">
                                Aplikasi Al-Quran modern yang dirancang untuk menemani ibadah Anda di mana pun, kapan pun.
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="grid grid-cols-1 gap-4 text-left">
                            <FeatureItem
                                icon={<BookOpen className="h-5 w-5 text-primary" />}
                                title="Akses Offline"
                                description="Baca Al-Quran tanpa bergantung koneksi internet."
                            />
                            <FeatureItem
                                icon={<CloudLightning className="h-5 w-5 text-primary" />}
                                title="Sinkronisasi Cloud"
                                description="Lanjutkan bacaan di berbagai gadget dengan akun Google."
                            />
                            <FeatureItem
                                icon={<ShieldCheck className="h-5 w-5 text-primary" />}
                                title="Ringan & Cepat"
                                description="Teknologi Lean yang hemat memori dan baterai."
                            />
                        </div>

                        {/* CTA Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onStart}
                            className="group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                        >
                            Mulai Membaca
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </motion.button>

                        <p className="text-xs text-muted-foreground mt-4 opacity-60">
                            Versi 1.0.0 • Karya Sedia Ecosystem
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex items-start gap-4 rounded-2xl bg-white/50 dark:bg-white/5 p-4 border border-secondary/20 transition-colors hover:border-primary/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-foreground text-sm">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

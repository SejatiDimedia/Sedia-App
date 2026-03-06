'use client';

import React, { useState } from 'react';
import { useStats } from '@/hooks/use-stats';
import { X, Calendar, TrendingUp, Info, Target, Activity, Flame, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function StatsModal({ isOpen, onClose }: StatsModalProps) {
    const { streak, weeklyActivity, predictedKhatamDate, goal, totalAyahsRead, todayCount, todayTapCount, setKhatamTarget, khatamCount, lastKhatamAt, addManualKhatam, updateManualKhatam, deleteManualKhatam, khatamHistory, khatamMonthlyActivity } = useStats();
    const [manualDateTime, setManualDateTime] = useState(() => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    });
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [editingManualId, setEditingManualId] = useState<number | null>(null);
    const [editingDateTime, setEditingDateTime] = useState('');
    const nowMs = new Date().getTime();

    const maxCount = Math.max(...weeklyActivity.map(a => a.count), 1);
    const maxKhatamMonthlyCount = Math.max(...khatamMonthlyActivity.map(m => m.count), 1);

    const handleSetGoal = async (days: number) => {
        await setKhatamTarget(days);
    };

    const handleAddManualKhatam = async () => {
        const timestamp = new Date(manualDateTime).getTime();
        if (Number.isNaN(timestamp)) {
            setSaveMessage('Tanggal tidak valid.');
            return;
        }
        await addManualKhatam(timestamp, 'Manual input from stats modal');
        setSaveMessage('Riwayat khatam berhasil ditambahkan.');
    };

    const toDateTimeLocal = (timestamp: number) => {
        const d = new Date(timestamp);
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    const startEditManual = (id: number, completedAt: number) => {
        setEditingManualId(id);
        setEditingDateTime(toDateTimeLocal(completedAt));
    };

    const cancelEditManual = () => {
        setEditingManualId(null);
        setEditingDateTime('');
    };

    const saveEditManual = async (id: number) => {
        const timestamp = new Date(editingDateTime).getTime();
        if (Number.isNaN(timestamp)) {
            setSaveMessage('Tanggal edit tidak valid.');
            return;
        }
        await updateManualKhatam(id, timestamp, 'Manual input from stats modal');
        setSaveMessage('Riwayat manual berhasil diperbarui.');
        cancelEditManual();
    };

    const handleDeleteManual = async (id: number) => {
        await deleteManualKhatam(id);
        setSaveMessage('Riwayat manual berhasil dihapus.');
        if (editingManualId === id) {
            cancelEditManual();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-background border border-primary/20 shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-7 border-b border-primary/10">
                            <div className="flex items-center gap-3">
                                <Activity className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-bold text-foreground">Statistik Khatam</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-primary active:scale-90"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-7 sm:p-9 space-y-10 custom-scrollbar">
                            {/* Weekly Chart */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Aktivitas 7 Hari Terakhir</h4>
                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                                        Minggu Ini
                                    </span>
                                </div>

                                <div className="flex items-end justify-between gap-2 h-44 pt-4">
                                    {weeklyActivity.map((day, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                                            <div className="relative w-full flex-1 flex flex-col justify-end">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${(day.count / maxCount) * 100}%` }}
                                                    className={`w-full max-w-[22px] mx-auto rounded-t-lg transition-all ${day.count > 0
                                                            ? 'bg-primary shadow-sm group-hover:bg-primary/90'
                                                            : 'bg-secondary/50'
                                                        }`}
                                                />
                                                {day.count > 0 && (
                                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        <span className="text-[10px] font-bold text-white bg-primary px-2.5 py-1 rounded-lg shadow-lg">
                                                            {day.count} Ayat
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                                {day.dayName}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Lifetime Stats */}
                            <section className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-secondary/30 border border-primary/10 transition-colors hover:bg-secondary/40">
                                    <TrendingUp className="h-6 w-6 text-primary mb-3" />
                                    <p className="text-3xl font-black text-foreground tracking-tight tabular-nums">{totalAyahsRead.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Ayat</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-secondary/30 border border-primary/10 transition-colors hover:bg-secondary/40">
                                    <Flame className="h-6 w-6 text-primary mb-3 fill-current" />
                                    <p className="text-3xl font-black text-foreground tracking-tight tabular-nums">{streak}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Streak Hari</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-secondary/30 border border-primary/10 transition-colors hover:bg-secondary/40 col-span-2">
                                    <Calendar className="h-6 w-6 text-primary mb-3" />
                                    <p className="text-3xl font-black text-foreground tracking-tight tabular-nums">{khatamCount}x</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Khatam Penuh</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {lastKhatamAt
                                            ? `Terakhir: ${new Date(lastKhatamAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`
                                            : 'Belum ada riwayat khatam penuh'}
                                    </p>
                                </div>
                                <div className="p-6 rounded-3xl bg-secondary/30 border border-primary/10 transition-colors hover:bg-secondary/40 col-span-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hari Ini</p>
                                    <p className="text-2xl font-black text-foreground tracking-tight tabular-nums">{todayCount} / {todayTapCount}</p>
                                    <p className="text-xs text-muted-foreground">Ayat unik vs total tap</p>
                                </div>
                            </section>

                            {/* Khatam Prediction */}
                            <section className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-start gap-5 transition-colors hover:bg-primary/10">
                                <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-foreground">Prediksi Khatam</h4>
                                    <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                                        {predictedKhatamDate ? (
                                            <>Insyaallah akan Khatam pada tanggal <span className="text-primary font-bold">{predictedKhatamDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>.</>
                                        ) : (
                                            <>Mulai membaca sekarang untuk memprediksi tanggal Khatam Bapak.</>
                                        )}
                                    </p>
                                </div>
                            </section>

                            <section className="space-y-4 p-6 rounded-[2rem] bg-primary/5 border border-primary/10">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Chart Khatam 6 Bulan</h4>
                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                                        Bulanan
                                    </span>
                                </div>
                                <div className="flex items-end justify-between gap-2 h-40 pt-3">
                                    {khatamMonthlyActivity.map((item, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                            <div className="relative w-full flex-1 flex flex-col justify-end">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${(item.count / maxKhatamMonthlyCount) * 100}%` }}
                                                    className={`w-full max-w-[24px] mx-auto rounded-t-lg ${item.count > 0 ? 'bg-primary' : 'bg-secondary/50'}`}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4 p-6 rounded-[2rem] bg-secondary/20 border border-primary/10">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <h4 className="font-bold text-foreground">Tambah Riwayat Khatam Manual</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Gunakan ini kalau sudah khatam sebelumnya (misal 1 bulan lalu).
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="datetime-local"
                                        value={manualDateTime}
                                        onChange={(e) => setManualDateTime(e.target.value)}
                                        className="flex-1 rounded-xl border border-primary/20 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                                    />
                                    <button
                                        onClick={handleAddManualKhatam}
                                        className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                                    >
                                        Tambah Riwayat Khatam
                                    </button>
                                </div>
                                {saveMessage && (
                                    <p className="text-xs font-medium text-primary">{saveMessage}</p>
                                )}
                            </section>

                            <section className="space-y-4 p-6 rounded-[2rem] bg-secondary/20 border border-primary/10">
                                <div className="flex items-center gap-3">
                                    <Activity className="h-5 w-5 text-primary" />
                                    <h4 className="font-bold text-foreground">Riwayat Khatam</h4>
                                </div>
                                {khatamHistory.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">Belum ada riwayat khatam.</p>
                                ) : (
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                        {khatamHistory.map((item, index) => (
                                            <div
                                                key={`${item.completedAt}-${index}`}
                                                className="rounded-xl border border-primary/10 bg-background/70 px-3 py-2"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-foreground">
                                                            {new Date(item.completedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </p>
                                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                                            {item.source === 'manual' ? 'Manual' : 'Otomatis'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {item.note && (
                                                            <span className="hidden sm:inline text-[10px] text-muted-foreground">{item.note}</span>
                                                        )}
                                                        {item.source === 'manual' && item.id && (
                                                            <>
                                                                <button
                                                                    onClick={() => startEditManual(item.id!, item.completedAt)}
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 text-primary"
                                                                    title="Edit riwayat manual"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteManual(item.id!)}
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500"
                                                                    title="Hapus riwayat manual"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {editingManualId && (
                                    <div className="mt-3 space-y-2 rounded-xl border border-primary/20 bg-background p-3">
                                        <p className="text-xs font-bold text-primary">Edit tanggal khatam manual</p>
                                        <input
                                            type="datetime-local"
                                            value={editingDateTime}
                                            onChange={(e) => setEditingDateTime(e.target.value)}
                                            className="w-full rounded-lg border border-primary/20 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                                        />
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={cancelEditManual}
                                                className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-bold text-muted-foreground"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={() => saveEditManual(editingManualId)}
                                                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white"
                                            >
                                                Simpan
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Goal Setting */}
                            <section className="space-y-6 pt-8 border-t border-primary/10">
                                <div className="flex items-center gap-3">
                                    <Target className="h-5 w-5 text-primary" />
                                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Target Khatam</h4>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {[30, 60, 90].map((days) => (
                                        <button
                                            key={days}
                                            onClick={() => handleSetGoal(days)}
                                            className={`py-5 rounded-2xl border transition-all flex flex-col items-center gap-1 active:scale-95 ${goal && Math.round((goal.targetKhatamDate - nowMs) / 86400000) === days
                                                    ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20'
                                                    : 'bg-secondary/40 border-primary/10 text-muted-foreground hover:bg-secondary/60 hover:border-primary/20'
                                                }`}
                                        >
                                            <span className="text-2xl font-black">{days}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Hari</span>
                                        </button>
                                    ))}
                                </div>

                                {goal && (
                                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 text-[12px] text-muted-foreground font-medium italic leading-relaxed">
                                        <Info className="h-5 w-5 shrink-0 opacity-50" />
                                        <span>Target saat ini: <strong>{goal.dailyTargetAyahs} ayat</strong> per hari untuk Khatam <strong>{Math.round((goal.targetKhatamDate - nowMs) / 86400000)} hari</strong> lagi.</span>
                                    </div>
                                )}
                            </section>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

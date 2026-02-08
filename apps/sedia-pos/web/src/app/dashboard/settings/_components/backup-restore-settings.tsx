"use client";

import { useState, useEffect } from "react";
import { Download, Upload, CloudUpload, RefreshCcw, FileJson, FileSpreadsheet, RotateCcw, AlertTriangle, CheckCircle2, Database, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BackupRestoreSettings() {
    const [isExporting, setIsExporting] = useState(false);
    const [isCloudBackingUp, setIsCloudBackingUp] = useState(false);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [backups, setBackups] = useState<any[]>([]);

    useEffect(() => {
        const fetchBackups = async () => {
            try {
                const response = await fetch('/api/settings/backup/cloud');
                if (response.ok) {
                    const data = await response.json();
                    setBackups(data);
                }
            } catch (error) {
                console.error("Failed to fetch backups", error);
            }
        };
        fetchBackups();
    }, []);

    const handleExport = async (format: 'json' | 'csv') => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/settings/backup/export');
            if (!response.ok) throw new Error("Export failed");

            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sedia-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast.success(`Berhasil mengekspor data dalam format ${format.toUpperCase()}`);
        } catch (error) {
            toast.error("Gagal mengekspor data");
        } finally {
            setIsExporting(false);
        }
    };

    const handleCloudBackup = async () => {
        setIsCloudBackingUp(true);
        try {
            const response = await fetch('/api/settings/backup/cloud', {
                method: 'POST'
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Backup failed");
            }
            toast.success("Backup cloud berhasil dibuat!");
            // Refresh backup list logic would go here
        } catch (error: any) {
            toast.error(error.message || "Gagal membuat backup cloud");
        } finally {
            setIsCloudBackingUp(false);
        }
    };

    const handleRestore = async () => {
        if (!selectedFile) return;

        try {
            toast.loading("Sedang memulihkan data...", { id: "restore" });

            const fileReader = new FileReader();
            fileReader.readAsText(selectedFile);

            fileReader.onload = async () => {
                try {
                    const backupData = JSON.parse(fileReader.result as string);
                    const response = await fetch('/api/settings/backup/import', {
                        method: 'POST',
                        body: JSON.stringify(backupData),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || "Restore failed");
                    }

                    toast.success("Data berhasil dipulihkan!", { id: "restore" });
                    setIsRestoreModalOpen(false);
                    setSelectedFile(null);
                    // Reload page to reflect restored data
                    window.location.reload();
                } catch (e: any) {
                    toast.error(e.message || "Gagal memproses file backup", { id: "restore" });
                }
            };
        } catch (error) {
            toast.error("Gagal memulihkan data", { id: "restore" });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-zinc-900">Backup & Pemulihan</h3>
                    <p className="text-sm text-zinc-500">Amankan data toko Anda dengan backup berkala</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Export Section */}
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <Download className="h-5 w-5" />
                    </div>
                    <h4 className="mb-2 font-medium text-zinc-900">Ekspor Data Manual</h4>
                    <p className="mb-6 text-sm text-zinc-500">
                        Unduh salinan lengkap data toko Anda ke perangkat lokal.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleExport('json')}
                            disabled={isExporting}
                            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                        >
                            <FileJson className="h-4 w-4" />
                            Ekspor JSON
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            disabled={isExporting}
                            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Ekspor CSV
                        </button>
                    </div>
                </div>

                {/* Cloud Backup Section */}
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <CloudUpload className="h-5 w-5" />
                    </div>
                    <h4 className="mb-2 font-medium text-zinc-900">Cloud Backup (Sedia Cloud)</h4>
                    <p className="mb-6 text-sm text-zinc-500">
                        Simpan backup secara aman di server Sedia Cloud untuk pemulihan cepat.
                    </p>
                    <button
                        onClick={handleCloudBackup}
                        disabled={isCloudBackingUp}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isCloudBackingUp ? (
                            <RefreshCcw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Database className="h-4 w-4" />
                        )}
                        Backup ke Cloud Sekarang
                    </button>
                </div>
            </div>

            {/* Restore Section */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                            <RotateCcw className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-zinc-900">Pulihkan Data (Restore)</h4>
                            <p className="text-sm text-zinc-500 max-w-md">
                                Ingin kembali ke versi sebelumnya? Unggah file backup Anda untuk memulihkan seluruh data toko.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsRestoreModalOpen(true)}
                        className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
                    >
                        Buka Wizard Pemulihan
                    </button>
                </div>
            </div>

            {/* Backup History Table Placeholder */}
            <div>
                <h4 className="mb-4 font-medium text-zinc-900">Riwayat Backup Cloud</h4>
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-4 py-3 font-medium text-zinc-700">Tanggal</th>
                                <th className="px-4 py-3 font-medium text-zinc-700">Tipe</th>
                                <th className="px-4 py-3 font-medium text-zinc-700">Ukuran</th>
                                <th className="px-4 py-3 font-medium text-zinc-700">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {backups.map((backup) => (
                                <tr key={backup.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 text-zinc-900">{new Date(backup.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600 capitalize">{backup.type === 'auto' ? 'Otomatis' : 'Manual'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-500">{backup.fileSize ? `${(backup.fileSize / 1024).toFixed(1)} KB` : '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${backup.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            backup.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {backup.status === 'completed' ? 'Berhasil' : backup.status === 'failed' ? 'Gagal' : 'Proses'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button className="text-primary-600 hover:underline font-medium">Pulihkan</button>
                                    </td>
                                </tr>
                            ))}
                            {backups.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-400">Belum ada riwayat backup</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Restore Modal */}
            {isRestoreModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="mb-6 flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900">Pulihkan Data</h2>
                            <p className="mt-2 text-zinc-500">
                                Pemulihan data akan menimpa data saat ini. Pastikan Anda memiliki backup terbaru sebelum melanjutkan.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div
                                className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${selectedFile ? "border-primary-500 bg-primary-50" : "border-zinc-200 hover:border-primary-400"
                                    }`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file) setSelectedFile(file);
                                }}
                            >
                                <input
                                    type="file"
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    accept=".json"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setSelectedFile(file);
                                    }}
                                />
                                <Upload className={`mb-3 h-10 w-10 ${selectedFile ? "text-primary-600" : "text-zinc-400 group-hover:text-primary-500"}`} />
                                <p className="text-sm font-medium text-zinc-900">
                                    {selectedFile ? selectedFile.name : "Klik atau seret file backup (.json) ke sini"}
                                </p>
                                <p className="mt-1 text-xs text-zinc-400">Hanya file .json yang didukung</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsRestoreModalOpen(false);
                                        setSelectedFile(null);
                                    }}
                                    className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleRestore}
                                    disabled={!selectedFile}
                                    className="flex-1 rounded-xl bg-primary-500 py-3 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
                                >
                                    Mulai Pemulihan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

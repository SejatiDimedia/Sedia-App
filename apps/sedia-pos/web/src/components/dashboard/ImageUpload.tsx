"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, ImageIcon, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    description?: string;
}

export function ImageUpload({ value, onChange, label, description }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    // Track key uploaded in the CURRENT session/mount to cleanup if replaced
    const [sessionUploadedKey, setSessionUploadedKey] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset error when value change
    useEffect(() => {
        setImageError(false);
    }, [value]);

    // Clean up R2 from previous session upload if replaced
    const cleanupSessionUpload = async (key: string) => {
        try {
            console.log("ImageUpload: Cleaning up session orphan:", key);
            await fetch("/api/upload/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key }),
            });
        } catch (e) {
            console.error("Cleanup failed:", e);
        }
    };

    // Clean up object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            if (localPreview) {
                URL.revokeObjectURL(localPreview);
            }
        };
    }, [localPreview]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast.error("Hanya file gambar yang diperbolehkan");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB");
            return;
        }

        // Cleanup previous unsaved upload from this session
        if (sessionUploadedKey) {
            cleanupSessionUpload(sessionUploadedKey);
        }

        // Set local preview immediately
        const objectUrl = URL.createObjectURL(file);
        setLocalPreview(objectUrl);
        setImageError(false); // Reset error on new upload

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data.key) {
                console.log("ImageUpload: Upload success, key:", data.key);
                setSessionUploadedKey(data.key);
                onChange(data.key);
                toast.success("Gambar berhasil diunggah");
            } else {
                toast.error(data.error || "Gagal mengunggah gambar");
                setLocalPreview(null); // Clear preview on failure
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Terjadi kesalahan saat mengunggah");
            setLocalPreview(null);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const removeImage = () => {
        if (sessionUploadedKey) {
            cleanupSessionUpload(sessionUploadedKey);
            setSessionUploadedKey(null);
        }
        onChange("");
        setLocalPreview(null);
        setImageError(false);
    };

    const previewSrc = localPreview || value;

    return (
        <div className="space-y-4">
            {label && (
                <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
                    {label}
                </label>
            )}

            <div className={`group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${imageError ? 'border-rose-200 bg-rose-50' : 'border-zinc-100 bg-zinc-50 hover:border-primary-200'}`}>
                {previewSrc && !imageError ? (
                    <>
                        <img
                            src={previewSrc}
                            alt="Preview"
                            className={`h-full w-full object-cover transition-all ${uploading ? 'opacity-50 blur-[2px]' : 'group-hover:scale-105'}`}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                console.error("Image load failed for URL:", target.src);
                                setImageError(true);
                            }}
                        />
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
                                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-rose-600 backdrop-blur-sm"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </>
                ) : imageError ? (
                    <div className="text-center p-6">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-bold text-rose-700">Gagal Memuat Gambar</p>
                        <p className="mt-1 text-[10px] text-rose-500 px-4">
                            Cek koneksi atau pastikan izin publik R2 sudah aktif.
                        </p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-rose-700"
                        >
                            Ganti Gambar
                        </button>
                    </div>
                ) : (
                    <div className="text-center p-6 grayscale group-hover:grayscale-0 transition-all">
                        {uploading ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-2" />
                                <p className="text-xs font-bold text-primary-600 animate-pulse">Mengunggah...</p>
                            </div>
                        ) : (
                            <>
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-100 mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3">
                                    <Upload className="h-8 w-8 text-zinc-400" />
                                </div>
                                <p className="text-sm font-bold text-zinc-900">Pilih Gambar</p>
                                <p className="mt-1 text-[10px] font-medium text-zinc-400">
                                    JPG, PNG, atau WEBP (Maks. 5MB)
                                </p>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-4 rounded-lg bg-zinc-100 px-4 py-1.5 text-xs font-bold text-zinc-600 transition-all hover:bg-zinc-200"
                                >
                                    Pilih File
                                </button>
                            </>
                        )}
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    className="hidden"
                    accept="image/*"
                />
            </div>

            {description && !value && (
                <p className="text-[10px] text-zinc-400 italic">
                    {description}
                </p>
            )}
        </div>
    );
}

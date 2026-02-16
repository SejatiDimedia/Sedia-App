"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, ImageIcon, Loader2, AlertTriangle, RotateCcw, RotateCw, Check } from "lucide-react";
import { toast } from "react-hot-toast";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    description?: string;
}

export function ImageUpload({ value, onChange, label, description }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false); // For canvas processing
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);

    // Rotation & Staging State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [rotation, setRotation] = useState(0);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        // Set local preview immediately for editing
        const objectUrl = URL.createObjectURL(file);
        setLocalPreview(objectUrl);
        setSelectedFile(file);
        setRotation(0); // Reset rotation
        setImageError(false);

        // Clear input value to allow selecting same file again if canceled
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const rotateImage = (degrees: number) => {
        setRotation((prev) => (prev + degrees) % 360);
    };

    const cancelUpload = () => {
        setSelectedFile(null);
        setLocalPreview(null);
        setRotation(0);
        if (localPreview) URL.revokeObjectURL(localPreview);
    };

    const processAndUpload = async () => {
        if (!selectedFile || !localPreview) return;

        setProcessing(true);
        try {
            // 1. Load image to get dimensions
            const img = new Image();
            img.src = localPreview;
            await new Promise((resolve) => { img.onload = resolve; });

            // 2. Setup Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");

            // Calculate new dimensions based on rotation
            // If 90 or 270 degrees, swap width and height
            const isVertical = Math.abs(rotation) === 90 || Math.abs(rotation) === 270;
            canvas.width = isVertical ? img.height : img.width;
            canvas.height = isVertical ? img.width : img.height;

            // 3. Draw & Rotate
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            // 4. Convert to Blob
            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, selectedFile.type, 0.9)
            );

            if (!blob) throw new Error("Canvas to Blob failed");

            // 5. Upload
            await performUpload(blob);

        } catch (error) {
            console.error("Processing error:", error);
            toast.error("Gagal memproses gambar");
            setProcessing(false);
        }
    };

    const performUpload = async (fileBlob: Blob) => {
        setUploading(true);

        // Cleanup previous unsaved upload from this session
        if (sessionUploadedKey) {
            cleanupSessionUpload(sessionUploadedKey);
        }

        const formData = new FormData();
        // Append with original name but potentially processed content
        formData.append("file", fileBlob, selectedFile?.name || "image.jpg");

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

                // Clear staging state
                setSelectedFile(null);
                setProcessing(false);
            } else {
                toast.error(data.error || "Gagal mengunggah gambar");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Terjadi kesalahan saat mengunggah");
        } finally {
            setUploading(false);
            setProcessing(false);
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
        setSelectedFile(null);
    };

    const previewSrc = localPreview || value;
    const isEditing = !!selectedFile; // True if we are in "Crop/Rotate" mode

    return (
        <div className="space-y-4">
            {label && (
                <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
                    {label}
                </label>
            )}

            <div className={`group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${imageError ? 'border-rose-200 bg-rose-50' : 'border-zinc-100 bg-zinc-50 hover:border-primary-200'}`}>

                {/* PREVIEW / EDITING MODE */}
                {previewSrc && !imageError ? (
                    <>
                        <img
                            src={previewSrc}
                            alt="Preview"
                            className={`h-full w-full object-cover transition-all ${uploading || processing ? 'opacity-50 blur-[2px]' : ''}`}
                            style={{
                                // Apply rotation visually during edit mode
                                transform: isEditing ? `rotate(${rotation}deg)` : 'none',
                                // Ensure image fits within container during rotation if needed, simply object-cover handles most
                            }}
                            onError={(e) => {
                                // Only trigger error if NOT simply waiting for processing
                                if (!processing) {
                                    const target = e.target as HTMLImageElement;
                                    console.error("Image load failed for URL:", target.src);
                                    setImageError(true);
                                }
                            }}
                        />

                        {(uploading || processing) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-[1px] z-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-2" />
                                <span className="text-xs font-bold text-primary-700">
                                    {processing ? "Memproses..." : "Mengunggah..."}
                                </span>
                            </div>
                        )}

                        {/* EDIT CONTROLS OVERLAY */}
                        {isEditing && !uploading && !processing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 p-4">
                                <div className="flex gap-4 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => rotateImage(-90)}
                                        className="p-2 rounded-full bg-white/20 hover:bg-white text-white hover:text-zinc-900 transition-all backdrop-blur-sm"
                                        title="Putar Kiri"
                                    >
                                        <RotateCcw className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => rotateImage(90)}
                                        className="p-2 rounded-full bg-white/20 hover:bg-white text-white hover:text-zinc-900 transition-all backdrop-blur-sm"
                                        title="Putar Kanan"
                                    >
                                        <RotateCw className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="flex gap-2 w-full max-w-[200px]">
                                    <button
                                        type="button"
                                        onClick={cancelUpload}
                                        className="flex-1 py-2 px-3 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg border border-white/40 backdrop-blur-sm transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={processAndUpload}
                                        className="flex-1 py-2 px-3 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-1"
                                    >
                                        <Check className="h-3 w-3" />
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* REMOVE BUTTON (Only shown when NOT editing and NOT uploading) */}
                        {!isEditing && !uploading && (
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-rose-600 backdrop-blur-sm"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
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
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*"
                />
            </div>

            {description && !value && !selectedFile && (
                <p className="text-[10px] text-zinc-400 italic">
                    {description}
                </p>
            )}
        </div>
    );
}

import { useState, useCallback } from "react";

interface FileUploaderProps {
    onUploadComplete?: () => void;
    folderId?: string | null;
}

export default function FileUploader({ onUploadComplete, folderId }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        setUploadProgress(`Uploading ${file.name}...`);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            if (folderId) {
                formData.append("folderId", folderId);
            }

            const response = await fetch("/api/files/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setUploadProgress(`${file.name} uploaded successfully!`);
            setTimeout(() => setUploadProgress(null), 3000);
            onUploadComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        for (const file of files) {
            await uploadFile(file);
        }
    }, [folderId, onUploadComplete]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
            await uploadFile(file);
        }
        e.target.value = ""; // Reset input
    };

    return (
        <div className="w-full">
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
                    ${isDragging
                        ? "border-sky-500 bg-sky-50"
                        : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                    }
                    ${isUploading ? "pointer-events-none opacity-70" : "cursor-pointer"}
                `}
            >
                <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                />

                <div className="flex flex-col items-center gap-3">
                    {/* Upload Icon */}
                    <div className={`
                        w-14 h-14 rounded-xl flex items-center justify-center transition-colors
                        ${isDragging ? "bg-sky-100 text-sky-500" : "bg-gray-100 text-gray-400"}
                    `}>
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>

                    {/* Text */}
                    <div>
                        <p className="text-gray-900 font-medium">
                            {isDragging ? "Drop files here" : "Drag & drop files here"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            or click to browse
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress/Status */}
            {uploadProgress && (
                <div className="mt-4 p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 text-sm flex items-center gap-2">
                    {isUploading && (
                        <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    {uploadProgress}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}

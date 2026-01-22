import { useState, useCallback } from "react";

interface FileUploaderProps {
    onUploadComplete?: () => void;
    folderId?: string | null;
}

interface QueuedFile {
    file: File;
    id: string;
    status: "pending" | "uploading" | "completed" | "error";
    progress: number;
    error?: string;
}

export default function FileUploader({ onUploadComplete, folderId }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const addFilesToQueue = (files: File[]) => {
        const newFiles: QueuedFile[] = files.map((file) => ({
            file,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: "pending" as const,
            progress: 0,
        }));
        setQueuedFiles((prev) => [...prev, ...newFiles]);
    };

    const removeFromQueue = (id: string) => {
        setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const uploadFile = async (queuedFile: QueuedFile): Promise<boolean> => {
        const { file, id } = queuedFile;

        setQueuedFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, status: "uploading" as const, progress: 0 } : f))
        );

        try {
            const formData = new FormData();
            formData.append("file", file);
            if (folderId) {
                formData.append("folderId", folderId);
            }

            // Use XMLHttpRequest for progress tracking
            return new Promise((resolve) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        setQueuedFiles((prev) =>
                            prev.map((f) => (f.id === id ? { ...f, progress } : f))
                        );
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setQueuedFiles((prev) =>
                            prev.map((f) =>
                                f.id === id ? { ...f, status: "completed" as const, progress: 100 } : f
                            )
                        );
                        resolve(true);
                    } else {
                        const error = JSON.parse(xhr.responseText)?.error || "Upload failed";
                        setQueuedFiles((prev) =>
                            prev.map((f) =>
                                f.id === id ? { ...f, status: "error" as const, error } : f
                            )
                        );
                        resolve(false);
                    }
                };

                xhr.onerror = () => {
                    setQueuedFiles((prev) =>
                        prev.map((f) =>
                            f.id === id ? { ...f, status: "error" as const, error: "Network error" } : f
                        )
                    );
                    resolve(false);
                };

                xhr.open("POST", "/api/files/upload");
                xhr.send(formData);
            });
        } catch {
            setQueuedFiles((prev) =>
                prev.map((f) =>
                    f.id === id ? { ...f, status: "error" as const, error: "Upload failed" } : f
                )
            );
            return false;
        }
    };

    const startUpload = async () => {
        if (isUploading) return;

        const pendingFiles = queuedFiles.filter((f) => f.status === "pending");
        if (pendingFiles.length === 0) return;

        setIsUploading(true);

        for (const qf of pendingFiles) {
            await uploadFile(qf);
        }

        setIsUploading(false);
        onUploadComplete?.();

        // Clear completed files after 3 seconds
        setTimeout(() => {
            setQueuedFiles((prev) => prev.filter((f) => f.status !== "completed"));
        }, 3000);
    };

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const files = Array.from(e.dataTransfer.files);
            addFilesToQueue(files);
        },
        []
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        addFilesToQueue(files);
        e.target.value = ""; // Reset input
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const pendingCount = queuedFiles.filter((f) => f.status === "pending").length;
    const hasFilesInQueue = queuedFiles.length > 0;

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

            {/* File Queue */}
            {hasFilesInQueue && (
                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                            {pendingCount > 0 ? `${pendingCount} file(s) ready to upload` : "Upload Complete"}
                        </p>
                        {pendingCount > 0 && (
                            <button
                                onClick={startUpload}
                                disabled={isUploading}
                                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Start Upload
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* File List */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2 max-h-60 overflow-y-auto">
                        {queuedFiles.map((qf) => (
                            <div
                                key={qf.id}
                                className="bg-white rounded-lg p-3 border border-gray-200"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Status Icon */}
                                    <div className="flex-shrink-0">
                                        {qf.status === "pending" && (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        )}
                                        {qf.status === "uploading" && (
                                            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                        {qf.status === "completed" && (
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                        {qf.status === "error" && (
                                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{qf.file.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {formatSize(qf.file.size)}
                                            {qf.status === "uploading" && ` • ${qf.progress}%`}
                                            {qf.status === "error" && (
                                                <span className="text-red-500"> • {qf.error}</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Remove Button (only for pending) */}
                                    {qf.status === "pending" && (
                                        <button
                                            onClick={() => removeFromQueue(qf.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                {qf.status === "uploading" && (
                                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-sky-500 rounded-full transition-all duration-300"
                                            style={{ width: `${qf.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Max file size note */}
            <p className="text-xs text-gray-400 text-center mt-3">Maximum 100 MB per file</p>
        </div>
    );
}

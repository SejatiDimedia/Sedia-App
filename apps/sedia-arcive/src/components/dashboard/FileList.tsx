import { useState, useEffect } from "react";
import FilePreviewModal from "./FilePreviewModal";
import ShareModal from "./ShareModal";
import ConfirmationModal from "./ConfirmationModal";

interface FileItem {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    url: string;
    createdAt: string;
}

interface FileListProps {
    refreshTrigger?: number;
    folderId?: string | null;
    onDeleteComplete?: () => void;
}

export default function FileList({ refreshTrigger, folderId, onDeleteComplete }: FileListProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null);

    const fetchFiles = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (folderId) params.set("folderId", folderId);

            const response = await fetch(`/api/files?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load files");
            }

            setFiles(data.files);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load files");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [refreshTrigger, folderId]);

    // State for deletion confirmation
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

    const handleDeleteClick = (e: React.MouseEvent, file: FileItem) => {
        e.stopPropagation();
        setDeleteConfirmation({ id: file.id, name: file.name });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;

        setDeletingId(deleteConfirmation.id);
        try {
            const response = await fetch("/api/files", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileId: deleteConfirmation.id }),
            });

            if (!response.ok) {
                throw new Error("Failed to delete file");
            }

            setFiles((prev) => prev.filter((f) => f.id !== deleteConfirmation.id));
            if (onDeleteComplete) onDeleteComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed");
        } finally {
            setDeletingId(null);
            setDeleteConfirmation(null);
        }
    };

    const handleDownload = (e: React.MouseEvent, file: FileItem) => {
        e.stopPropagation();
        const link = document.createElement("a");
        link.href = file.url;
        link.download = file.name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) {
            return (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }
        if (mimeType.startsWith("video/")) {
            return (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            );
        }
        if (mimeType === "application/pdf") {
            return (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        }
        return (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                        <div className="w-full aspect-square bg-gray-200 rounded-lg mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p>No files yet</p>
                <p className="text-sm mt-1 text-gray-400">Upload files to get started</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {files.map((file) => (
                    <div
                        key={file.id}
                        draggable={true}
                        onDragStart={(e) => {
                            e.dataTransfer.setData("application/json", JSON.stringify({
                                type: "file",
                                id: file.id,
                                folderId: folderId // Current folder (source)
                            }));
                            e.dataTransfer.effectAllowed = "move";
                        }}
                        className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors shadow-sm hover:shadow-md cursor-pointer active:cursor-grabbing active:scale-95 transition-transform"
                        onClick={() => setPreviewFile(file)}
                    >
                        {/* Preview / Icon */}
                        <div className="block">
                            {file.mimeType.startsWith("image/") ? (
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    className="w-full aspect-square object-cover rounded-lg bg-gray-100"
                                />
                            ) : (
                                <div className={`w-full aspect-square rounded-lg flex items-center justify-center border border-transparent ${file.mimeType.startsWith("video/") ? "bg-pink-50 text-pink-500" :
                                    file.mimeType === "application/pdf" ? "bg-red-50 text-red-500" :
                                        "bg-indigo-50 text-indigo-500"
                                    }`}>
                                    {getFileIcon(file.mimeType)}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="mt-3">
                            <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                                {file.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {formatSize(file.size)}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {/* Share Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShareTarget({ id: file.id, name: file.name }); }}
                                className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors shadow-sm"
                                title="Share"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>
                            {/* Download Button */}
                            <button
                                onClick={(e) => handleDownload(e, file)}
                                className="p-2 bg-sky-100 text-sky-600 hover:bg-sky-200 rounded-lg transition-colors shadow-sm"
                                title="Download"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                            {/* Delete Button */}
                            <button
                                onClick={(e) => handleDeleteClick(e, file)}
                                disabled={deletingId === file.id}
                                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                title="Delete"
                            >
                                {deletingId === file.id ? (
                                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview Modal */}
            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile}
            />

            {/* Share Modal */}
            <ShareModal
                isOpen={!!shareTarget}
                onClose={() => setShareTarget(null)}
                targetType="file"
                targetId={shareTarget?.id || ""}
                targetName={shareTarget?.name || ""}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteConfirmation}
                onClose={() => setDeleteConfirmation(null)}
                onConfirm={confirmDelete}
                title="Delete File"
                message={`Are you sure you want to delete "${deleteConfirmation?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                isDangerous={true}
                isLoading={!!deletingId}
            />
        </>
    );
}

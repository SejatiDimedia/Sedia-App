import { useState, useEffect } from "react";
import FilePreviewModal from "./FilePreviewModal";
import ShareModal from "./ShareModal";
import ConfirmationModal from "./ConfirmationModal";
import RenameModal from "./RenameModal";
import { useDownload } from "./DownloadManager";

interface FileItem {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    url: string;
    createdAt: string;
    folderId: string | null;
    folderName: string | null;
    isStarred: boolean;
}

interface FileListProps {
    refreshTrigger?: number;
    folderId?: string | null;
    onDeleteComplete?: () => void;
    starredOnly?: boolean;
    compact?: boolean;
    onSelect?: (item: any) => void;
    selectedId?: string;
    viewMode?: "grid" | "list";
}

export default function FileList({
    refreshTrigger,
    folderId,
    onDeleteComplete,
    starredOnly = false,
    compact = false,
    onSelect,
    selectedId,
    viewMode = "grid"
}: FileListProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [shareTarget, setShareTarget] = useState<{ id?: string; name: string; ids?: string[] } | null>(null);
    const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);

    // Selection State
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

    // Download hook
    const { startDownload } = useDownload();

    const fetchFiles = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (folderId) params.set("folderId", folderId);
            if (starredOnly) params.set("starred", "true");

            const response = await fetch(`/api/files?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load files");
            }

            setFiles(data.files);
            // Clear selection on refresh/folder change
            setSelectedFiles(new Set());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load files");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [refreshTrigger, folderId]);

    // Delete Confirmation State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        isBulk: boolean;
        targetId?: string;
    }>({
        isOpen: false,
        title: "",
        message: "",
        isBulk: false,
    });

    const handleDeleteClick = (e: React.MouseEvent, file: FileItem) => {
        e.stopPropagation();
        setConfirmState({
            isOpen: true,
            title: "Delete File",
            message: `Are you sure you want to delete "${file.name}"?`,
            isBulk: false,
            targetId: file.id
        });
    };

    const handleBulkDeleteClick = () => {
        setConfirmState({
            isOpen: true,
            title: "Delete Selected Files",
            message: `Are you sure you want to delete ${selectedFiles.size} selected file(s)?`,
            isBulk: true
        });
    };

    const handleBulkShareClick = () => {
        if (selectedFiles.size === 0) return;
        setShareTarget({
            ids: Array.from(selectedFiles),
            name: `${selectedFiles.size} files`
        });
    };

    const confirmDelete = async () => {
        const idsToDelete = confirmState.isBulk ? Array.from(selectedFiles) : [confirmState.targetId!];

        try {
            // Optimistic update
            if (confirmState.isBulk) {
                setDeletingId("bulk");
            } else {
                setDeletingId(confirmState.targetId!);
            }

            await Promise.all(idsToDelete.map(id =>
                fetch("/api/files", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileId: id }),
                }).then(res => { if (!res.ok) throw new Error("Failed"); })
            ));

            setFiles((prev) => prev.filter((f) => !idsToDelete.includes(f.id)));
            setSelectedFiles((prev) => {
                const next = new Set(prev);
                idsToDelete.forEach(id => next.delete(id));
                return next;
            });

            if (onDeleteComplete) onDeleteComplete();
        } catch (err) {
            setError("Some files failed to delete");
        } finally {
            setDeletingId(null);
            setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleRename = async (newName: string) => {
        if (!renamingFile) return;

        try {
            await fetch("/api/files", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileId: renamingFile.id, name: newName }),
            });

            setFiles(prev => prev.map(f => f.id === renamingFile.id ? { ...f, name: newName } : f));
        } catch (err) {
            console.error("Failed to rename file");
            throw err; // Let modal handle error display
        }
    };

    const handleDownload = (e: React.MouseEvent, file: FileItem) => {
        e.stopPropagation();
        startDownload(file.url, file.name);
    };

    const handleBulkDownload = () => {
        if (selectedFiles.size === 0) return;
        const filesToDownload = files.filter(f => selectedFiles.has(f.id));

        // Queue all files for download
        filesToDownload.forEach(file => {
            startDownload(file.url, file.name);
        });
    };

    const toggleSelection = (e: React.MouseEvent, fileId: string) => {
        e.stopPropagation();
        setSelectedFiles((prev) => {
            const next = new Set(prev);
            if (next.has(fileId)) {
                next.delete(fileId);
            } else {
                next.add(fileId);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedFiles.size === files.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(files.map(f => f.id)));
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
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

    // Custom Checkbox Component
    const Checkbox = ({ checked }: { checked: boolean }) => (
        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${checked
            ? "bg-sky-500 border-sky-500"
            : "bg-white border-gray-300 hover:border-gray-400 group-hover:border-gray-400"
            }`}>
            {checked && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
        </div>
    );

    if (isLoading) {
        if (viewMode === "list") {
            return (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 border-b border-gray-100 bg-gray-50/50" />
                    ))}
                </div>
            );
        }
        return (
            <div className={`grid gap-4 ${compact
                ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                }`}>
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
            {/* Bulk Actions Bar */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 group cursor-pointer"
                    >
                        <Checkbox checked={selectedFiles.size > 0 && selectedFiles.size === files.length} />
                        <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                            {selectedFiles.size > 0 ? `${selectedFiles.size} selected` : 'Select All'}
                        </span>
                    </button>

                    {selectedFiles.size > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 animate-fade-in-left pl-2 border-l border-gray-200 ml-2">
                                {/* Bulk Delete */}
                                <button
                                    onClick={handleBulkDeleteClick}
                                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                                {/* Bulk Share */}
                                <button
                                    onClick={handleBulkShareClick}
                                    className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share
                                </button>
                                {/* Bulk Download */}
                                <button
                                    onClick={handleBulkDownload}
                                    className="px-3 py-1.5 text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {viewMode === "list" ? (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                    <div className="flex items-center">
                                        <button onClick={toggleSelectAll} className="p-1 rounded hover:bg-gray-200">
                                            <Checkbox checked={selectedFiles.size > 0 && selectedFiles.size === files.length} />
                                        </button>
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {files.map((file) => (
                                <tr
                                    key={file.id}
                                    draggable={true}
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData("application/json", JSON.stringify({
                                            type: "file",
                                            id: file.id,
                                            folderId: folderId
                                        }));
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onSelect) onSelect({ ...file, type: "file" });
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewFile(file);
                                    }}
                                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedFiles.has(file.id) || selectedId === file.id ? "bg-sky-50 hover:bg-sky-100" : ""}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => toggleSelection(e, file.id)}>
                                        <Checkbox checked={selectedFiles.has(file.id)} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100">
                                                {file.mimeType.startsWith("image/") ? (
                                                    <img className="h-10 w-10 rounded-lg object-cover" src={file.url} alt="" />
                                                ) : (
                                                    <div className="h-6 w-6">
                                                        {getFileIcon(file.mimeType)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={file.name}>{file.name}</div>
                                                {!folderId && file.folderName && (
                                                    <div className="text-xs text-gray-500">In {file.folderName}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatSize(file.size)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(file.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleDownload(e, file)} className="p-1 text-sky-600 hover:bg-sky-50 rounded">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            </button>
                                            <button onClick={(e) => handleDeleteClick(e, file)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={`grid gap-4 ${compact
                    ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                    }`}>
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
                            className={`group relative bg-white border rounded-xl p-4 transition-all shadow-sm hover:shadow-md cursor-pointer active:cursor-grabbing active:scale-95 transition-transform ${selectedFiles.has(file.id) || selectedId === file.id ? "border-sky-500 ring-1 ring-sky-500 bg-sky-50" : "border-gray-200 hover:border-gray-300"}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onSelect) onSelect({ ...file, type: "file" });
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                setPreviewFile(file);
                            }}
                        >
                            {/* Checkbox (Visible on hover or selected) */}
                            <div
                                className={`absolute top-2 left-2 z-10 ${selectedFiles.has(file.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity cursor-pointer`}
                                onClick={(e) => toggleSelection(e, file.id)}
                            >
                                <Checkbox checked={selectedFiles.has(file.id)} />
                            </div>

                            {/* Preview / Icon */}
                            <div className="block mt-2">
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
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-gray-500">
                                        {formatSize(file.size)}
                                    </p>
                                    {/* Folder Location Indicator */}
                                    {!folderId && file.folderName && (
                                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={`In ${file.folderName}`}>
                                            {file.folderName}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                {/* Star Button */}
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            const newStatus = !file.isStarred;
                                            // Optimistic update
                                            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isStarred: newStatus } : f));

                                            await fetch("/api/files", {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ fileId: file.id, isStarred: newStatus }),
                                            });

                                            // Specific for starred page: remove if unstarred
                                            if (starredOnly && !newStatus) {
                                                setFiles(prev => prev.filter(f => f.id !== file.id));
                                            }
                                        } catch (err) {
                                            console.error("Failed to toggle star");
                                            // Revert
                                            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isStarred: !file.isStarred } : f));
                                        }
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors shadow-sm ${file.isStarred ? "bg-yellow-100 text-yellow-500 hover:bg-yellow-200" : "bg-white text-gray-400 hover:text-yellow-500 hover:bg-gray-100"}`}
                                    title={file.isStarred ? "Unstar" : "Star"}
                                >
                                    <svg className={`w-4 h-4 ${file.isStarred ? "fill-current" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </button>
                                {/* Share Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShareTarget({ id: file.id, name: file.name }); }}
                                    className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors shadow-sm"
                                    title="Share"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </button>
                                {/* Download Button */}
                                <button
                                    onClick={(e) => handleDownload(e, file)}
                                    className="p-1.5 bg-sky-100 text-sky-600 hover:bg-sky-200 rounded-lg transition-colors shadow-sm"
                                    title="Download"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                                {/* Rename Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setRenamingFile(file); }}
                                    className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors shadow-sm"
                                    title="Rename"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                {/* Delete Button */}
                                <button
                                    onClick={(e) => handleDeleteClick(e, file)}
                                    className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors shadow-sm"
                                    title="Delete"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                targetIds={shareTarget?.ids}
                targetName={shareTarget?.name || ""}
            />

            {/* Rename Modal */}
            <RenameModal
                isOpen={!!renamingFile}
                onClose={() => setRenamingFile(null)}
                onRename={handleRename}
                currentName={renamingFile?.name || ""}
                type="file"
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDelete}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.isBulk ? `Delete ${selectedFiles.size} Files` : "Delete"}
                isDangerous={true}
                isLoading={!!deletingId}
            />
        </>
    );
}

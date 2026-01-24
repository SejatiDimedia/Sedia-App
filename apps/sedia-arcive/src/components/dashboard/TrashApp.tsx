import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ConfirmationModal from "./ConfirmationModal";

interface TrashFile {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    url: string;
    deletedAt: string;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) {
        return (
            <svg className="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        );
    }
    if (mimeType === "application/pdf") {
        return (
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        );
    }
    return (
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

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

export default function TrashApp() {
    const [files, setFiles] = useState<TrashFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Confirmation Modal State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        action: "delete" | "empty" | "restore";
        targetId?: string; // If null/undefined and action is delete/restore, it means bulk action
    }>({
        isOpen: false,
        title: "",
        message: "",
        action: "delete",
    });

    const fetchTrash = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/trash");
            if (!response.ok) throw new Error("Failed to fetch trash");
            const data = await response.json();
            setFiles(data.files || []);
            // Clear selection on refresh
            setSelectedFiles(new Set());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load trash");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrash();
    }, [fetchTrash]);

    const confirmRestore = (fileId?: string) => {
        // Single restore
        if (fileId) {
            const file = files.find(f => f.id === fileId);
            setConfirmState({
                isOpen: true,
                title: "Restore File",
                message: `Are you sure you want to restore "${file?.name || 'this file'}"?`,
                action: "restore",
                targetId: fileId
            });
            return;
        }

        // Bulk restore
        if (selectedFiles.size === 0) return;
        setConfirmState({
            isOpen: true,
            title: "Restore Selected Files",
            message: `Are you sure you want to restore ${selectedFiles.size} selected file(s)?`,
            action: "restore",
            targetId: undefined
        });
    };

    const confirmPermanentDelete = (fileId?: string) => {
        // Single delete
        if (fileId) {
            const file = files.find(f => f.id === fileId);
            setConfirmState({
                isOpen: true,
                title: "Permanently Delete File",
                message: `Are you sure you want to permanently delete "${file?.name || 'this file'}"? This action CANNOT be undone.`,
                action: "delete",
                targetId: fileId
            });
            return;
        }

        // Bulk delete
        if (selectedFiles.size === 0) return;
        setConfirmState({
            isOpen: true,
            title: "Permanently Delete Selected",
            message: `Are you sure you want to permanently delete ${selectedFiles.size} selected file(s)? This action CANNOT be undone.`,
            action: "delete",
            targetId: undefined
        });
    };

    const confirmEmptyTrash = () => {
        setConfirmState({
            isOpen: true,
            title: "Empty Trash",
            message: "Are you sure you want to permanently delete ALL files in trash? This action CANNOT be undone.",
            action: "empty"
        });
    };

    const executeAction = async () => {
        const action = confirmState.action;
        const targetId = confirmState.targetId;

        // RESTORE LOGIC
        if (action === "restore") {
            const idsToRestore = targetId ? [targetId] : Array.from(selectedFiles);
            if (idsToRestore.length === 0) return;

            setActionLoading(targetId || "bulk");
            try {
                // In a real app, you might want a bulk API endpoint.
                // For now, loop through requests or Promise.all if the API supports single only.
                // Assuming we reuse the single endpoint for simplicity:
                await Promise.all(idsToRestore.map(id =>
                    fetch("/api/trash", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileId: id }),
                    }).then(res => { if (!res.ok) throw new Error(`Failed to restore ${id}`) })
                ));

                setFiles(prev => prev.filter(f => !idsToRestore.includes(f.id)));
                setSelectedFiles(prev => {
                    const next = new Set(prev);
                    idsToRestore.forEach(id => next.delete(id));
                    return next;
                });
            } catch (err) {
                console.error("Restore error:", err);
            } finally {
                setActionLoading(null);
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        }

        // DELETE LOGIC
        else if (action === "delete") {
            const idsToDelete = targetId ? [targetId] : Array.from(selectedFiles);
            if (idsToDelete.length === 0) return;

            setActionLoading(targetId || "bulk");
            try {
                await Promise.all(idsToDelete.map(id =>
                    fetch("/api/trash", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileId: id }),
                    }).then(res => { if (!res.ok) throw new Error(`Failed to delete ${id}`) })
                ));

                setFiles(prev => prev.filter(f => !idsToDelete.includes(f.id)));
                setSelectedFiles(prev => {
                    const next = new Set(prev);
                    idsToDelete.forEach(id => next.delete(id));
                    return next;
                });
            } catch (err) {
                console.error("Delete error:", err);
            } finally {
                setActionLoading(null);
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        }

        // EMPTY TRASH LOGIC
        else if (action === "empty") {
            setActionLoading("all");
            try {
                // Bulk delete via API
                await fetch("/api/trash", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ emptyTrash: true }),
                });
                setFiles([]);
                setSelectedFiles(new Set());
            } catch (err) {
                console.error("Empty trash error:", err);
            } finally {
                setActionLoading(null);
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        }
    };

    const toggleSelection = (fileId: string) => {
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                activePage="trash"
                onCollapsedChange={setSidebarCollapsed}
                mobileMenuOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
                <Header
                    title="Trash"
                    onMobileMenuOpen={() => setMobileMenuOpen(true)}
                />
                <main className="p-6">
                    {/* Info Banner */}
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-amber-800">Trash</p>
                            <p className="text-sm text-amber-600 mt-0.5">
                                Files in trash can be restored or permanently deleted. Permanent deletion cannot be undone.
                            </p>
                        </div>
                    </div>

                    {/* Actions Bar */}
                    {files.length > 0 && (
                        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {/* Select All */}
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center gap-2 group cursor-pointer"
                                >
                                    <Checkbox checked={selectedFiles.size > 0 && selectedFiles.size === files.length} />
                                    <span className="text-sm text-gray-700">Select All ({files.length})</span>
                                </button>

                                {selectedFiles.size > 0 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => confirmRestore()}
                                            disabled={!!actionLoading}
                                            className="px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                                        >
                                            Restore ({selectedFiles.size})
                                        </button>
                                        <button
                                            onClick={() => confirmPermanentDelete()}
                                            disabled={!!actionLoading}
                                            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            Delete ({selectedFiles.size})
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={confirmEmptyTrash}
                                disabled={actionLoading !== null}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {actionLoading === "all" ? "Emptying..." : "Empty Trash"}
                            </button>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-sky-600 rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && files.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Trash is empty</h3>
                            <p className="text-sm text-gray-500">Deleted files will appear here</p>
                        </div>
                    )}

                    {/* File List */}
                    {!isLoading && !error && files.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="divide-y divide-gray-100">
                                {files.map((file) => (
                                    <div
                                        key={file.id}
                                        className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${selectedFiles.has(file.id) ? "bg-sky-50" : ""}`}
                                    >
                                        <div onClick={(e) => { e.stopPropagation(); toggleSelection(file.id); }} className="cursor-pointer">
                                            <Checkbox checked={selectedFiles.has(file.id)} />
                                        </div>
                                        <div className="flex-shrink-0">
                                            {getFileIcon(file.mimeType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(file.size)} • Deleted {formatDate(file.deletedAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => confirmRestore(file.id)}
                                                disabled={!!actionLoading}
                                                className="px-3 py-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === file.id ? "..." : "Restore"}
                                            </button>
                                            <button
                                                onClick={() => confirmPermanentDelete(file.id)}
                                                disabled={!!actionLoading}
                                                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeAction}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.action === "restore" ? "Restore" : "Delete Forever"}
                isDangerous={confirmState.action !== "restore"}
                isLoading={!!actionLoading}
            />
        </div>
    );
}

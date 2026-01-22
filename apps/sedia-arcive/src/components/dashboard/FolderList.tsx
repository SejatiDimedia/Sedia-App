import { useState, useEffect } from "react";
import ShareModal from "./ShareModal";
import ConfirmationModal from "./ConfirmationModal";

interface FolderItem {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: string;
}

interface FolderListProps {
    parentId: string | null;
    onFolderClick: (folderId: string, folderName: string) => void;
    refreshTrigger?: number;
    onDeleteComplete?: () => void;
    onMoveComplete?: () => void;
}

export default function FolderList({ parentId, onFolderClick, refreshTrigger, onDeleteComplete, onMoveComplete }: FolderListProps) {
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const fetchFolders = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (parentId) params.set("parentId", parentId);

            const response = await fetch(`/api/folders?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load folders");
            }

            setFolders(data.folders);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load folders");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, [parentId, refreshTrigger]);

    // State for deletion confirmation
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

    const handleDeleteClick = (e: React.MouseEvent, folder: FolderItem) => {
        e.stopPropagation();
        setDeleteConfirmation({ id: folder.id, name: folder.name });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;

        setDeletingId(deleteConfirmation.id);
        try {
            const response = await fetch("/api/folders", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId: deleteConfirmation.id }),
            });

            if (!response.ok) {
                throw new Error("Failed to delete folder");
            }

            setFolders((prev) => prev.filter((f) => f.id !== deleteConfirmation.id));
            if (onDeleteComplete) onDeleteComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed");
        } finally {
            setDeletingId(null);
            setDeleteConfirmation(null);
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, folder: FolderItem) => {
        e.dataTransfer.setData("application/json", JSON.stringify({
            type: "folder",
            id: folder.id,
            parentId: parentId // Current parent (source)
        }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, targetFolderId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverId !== targetFolderId) {
            setDragOverId(targetFolderId);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        setDragOverId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
        e.preventDefault();
        setDragOverId(null);

        const data = e.dataTransfer.getData("application/json");
        if (!data) return;

        try {
            const parsedData = JSON.parse(data);
            const { type, id, folderId: sourceFolderId, parentId: sourceParentId } = parsedData;

            // Don't move if dropped on same folder it came from
            if (type === "file" && sourceFolderId === targetFolderId) return;
            if (type === "folder" && sourceParentId === targetFolderId) return;
            if (type === "folder" && id === targetFolderId) return; // Can't drop on itself

            let endpoint = "";
            let body = {};

            if (type === "file") {
                endpoint = "/api/files";
                body = { fileId: id, folderId: targetFolderId };
            } else if (type === "folder") {
                endpoint = "/api/folders";
                body = { folderId: id, parentId: targetFolderId };
            }

            const response = await fetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to move item");
            }

            // Success
            if (onMoveComplete) onMoveComplete();
        } catch (err) {
            console.error("Drop error:", err);
            setError(err instanceof Error ? err.message : "Failed to move item");
            // Clear error after 3 seconds
            setTimeout(() => setError(null), 3000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex gap-4 mb-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-32 h-24 bg-white border border-gray-200 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
            </div>
        );
    }

    if (folders.length === 0) {
        return null; // Don't show anything if no folders
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
                {folders.map((folder) => (
                    <div
                        key={folder.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, folder)}
                        onDragOver={(e) => handleDragOver(e, folder.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, folder.id)}
                        onClick={() => onFolderClick(folder.id, folder.name)}
                        className={`group relative bg-white border rounded-xl p-4 transition-all cursor-pointer ${dragOverId === folder.id
                            ? "border-sky-500 ring-2 ring-sky-200 bg-sky-50 scale-105 shadow-lg z-10"
                            : "border-gray-200 hover:border-sky-300 hover:shadow-md"
                            }`}
                    >
                        {/* Folder Icon */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 transition-colors group-hover:bg-sky-200">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-700 truncate max-w-full text-center group-hover:text-gray-900 transition-colors" title={folder.name}>
                                {folder.name}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {/* Share Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShareTarget({ id: folder.id, name: folder.name }); }}
                                className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors shadow-sm"
                                title="Share"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>
                            {/* Delete Button */}
                            <button
                                onClick={(e) => handleDeleteClick(e, folder)}
                                disabled={deletingId === folder.id}
                                className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                title="Delete"
                            >
                                {deletingId === folder.id ? (
                                    <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={!!shareTarget}
                onClose={() => setShareTarget(null)}
                targetType="folder"
                targetId={shareTarget?.id || ""}
                targetName={shareTarget?.name || ""}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteConfirmation}
                onClose={() => setDeleteConfirmation(null)}
                onConfirm={confirmDelete}
                title="Delete Folder"
                message={`Are you sure you want to delete folder "${deleteConfirmation?.name}"? All files inside will be permanently deleted.`}
                confirmText="Delete Folder"
                isDangerous={true}
                isLoading={!!deletingId}
            />
        </>
    );
}


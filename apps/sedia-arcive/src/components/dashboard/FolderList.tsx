import { useState, useEffect } from "react";
import ShareModal from "./ShareModal";
import ConfirmationModal from "./ConfirmationModal";
import RenameModal from "./RenameModal";

interface FolderItem {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: string;
    isShared?: boolean;
    isStarred: boolean;
}

interface FolderListProps {
    parentId: string | null;
    onFolderClick: (folderId: string, folderName: string) => void;
    refreshTrigger?: number;
    onDeleteComplete?: () => void;
    onMoveComplete?: () => void;

    starredOnly?: boolean;
    onSelect?: (item: any) => void;
    selectedId?: string;
    viewMode?: "grid" | "list";
}

export default function FolderList({
    parentId,
    onFolderClick,
    refreshTrigger,
    onDeleteComplete,
    onMoveComplete,
    starredOnly = false,
    onSelect,
    selectedId,
    viewMode = "grid"
}: FolderListProps) {
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null);
    const [renamingFolder, setRenamingFolder] = useState<FolderItem | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const fetchFolders = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (parentId) params.set("parentId", parentId);
            if (starredOnly) params.set("starred", "true");

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
    }


    const handleRename = async (newName: string) => {
        if (!renamingFolder) return;

        try {
            await fetch("/api/folders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId: renamingFolder.id, name: newName }),
            });

            setFolders(prev => prev.map(f => f.id === renamingFolder.id ? { ...f, name: newName } : f));
        } catch (err) {
            console.error("Failed to rename folder");
            throw err;
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
            {viewMode === "list" ? (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                            {folders.map((folder) => (
                                <tr
                                    key={folder.id}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, folder)}
                                    onDragOver={(e) => handleDragOver(e, folder.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, folder.id)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onSelect) onSelect({ ...folder, type: "folder" });
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        onFolderClick(folder.id, folder.name);
                                    }}
                                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${dragOverId === folder.id
                                        ? "bg-sky-50 outline outline-2 outline-sky-500 -outline-offset-2"
                                        : selectedId === folder.id
                                            ? "bg-sky-50"
                                            : ""
                                        }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap w-10">
                                        <div className={`p-2 rounded-lg ${folder.isShared ? "bg-amber-100 text-amber-500" : "bg-sky-100 text-sky-600"}`}>
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                                            </svg>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{folder.name}</span>
                                            {folder.isShared && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">Shared</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); setRenamingFolder(folder); }} className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={(e) => handleDeleteClick(e, folder)} className="p-1 text-red-500 hover:bg-red-50 rounded">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
                    {folders.map((folder) => (
                        <div
                            key={folder.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, folder)}
                            onDragOver={(e) => handleDragOver(e, folder.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, folder.id)}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onSelect) onSelect({ ...folder, type: "folder" });
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                onFolderClick(folder.id, folder.name);
                            }}
                            className={`group relative bg-white border rounded-xl p-4 transition-all cursor-pointer ${dragOverId === folder.id
                                ? "border-sky-500 ring-2 ring-sky-200 bg-sky-50 scale-105 shadow-lg z-10"
                                : selectedId === folder.id
                                    ? "border-sky-500 ring-1 ring-sky-500 bg-sky-50"
                                    : "border-gray-200 hover:border-sky-300 hover:shadow-md"
                                }`}
                        >
                            {/* Folder Icon */}
                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-opacity-80 ${folder.isShared ? "bg-amber-100 text-amber-500" : "bg-sky-100 text-sky-600"}`}>
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                                        {folder.isShared && (
                                            <g transform="translate(14, 14) scale(0.4)">
                                                <circle cx="12" cy="12" r="10" fill="white" />
                                                <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                            </g>
                                        )}
                                    </svg>
                                </div>
                                <div className="text-center w-full">
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-full group-hover:text-gray-900 transition-colors" title={folder.name}>
                                        {folder.name}
                                    </p>
                                    {folder.isShared && (
                                        <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
                                            Shared
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="absolute top-1 right-1 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                                {/* Star Button */}
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            const newStatus = !folder.isStarred;
                                            // Optimistic update
                                            setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, isStarred: newStatus } : f));

                                            await fetch("/api/folders", {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ folderId: folder.id, isStarred: newStatus }),
                                            });

                                            // Specific for starred page: remove if unstarred
                                            if (starredOnly && !newStatus) {
                                                setFolders(prev => prev.filter(f => f.id !== folder.id));
                                            }
                                        } catch (err) {
                                            console.error("Failed to toggle star");
                                            // Revert
                                            setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, isStarred: !folder.isStarred } : f));
                                        }
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors shadow-sm ${folder.isStarred ? "bg-yellow-100 text-yellow-500 hover:bg-yellow-200" : "bg-white text-gray-400 hover:text-yellow-500 hover:bg-gray-100"}`}
                                    title={folder.isStarred ? "Unstar" : "Star"}
                                >
                                    <svg className={`w-3 h-3 ${folder.isStarred ? "fill-current" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </button>
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
                                {/* Rename Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setRenamingFolder(folder); }}
                                    className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors shadow-sm"
                                    title="Rename"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
            )}

            {/* Share Modal */}
            <ShareModal
                isOpen={!!shareTarget}
                onClose={() => setShareTarget(null)}
                targetType="folder"
                targetId={shareTarget?.id || ""}
                targetName={shareTarget?.name || ""}
            />

            {/* Rename Modal */}
            <RenameModal
                isOpen={!!renamingFolder}
                onClose={() => setRenamingFolder(null)}
                onRename={handleRename}
                currentName={renamingFolder?.name || ""}
                type="folder"
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


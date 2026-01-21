import { useState, useEffect } from "react";

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
}

export default function FolderList({ parentId, onFolderClick, refreshTrigger }: FolderListProps) {
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const handleDelete = async (e: React.MouseEvent, folderId: string) => {
        e.stopPropagation();
        if (!confirm("Delete this folder? Files inside will be moved to root.")) return;

        setDeletingId(folderId);
        try {
            const response = await fetch("/api/folders", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId }),
            });

            if (!response.ok) {
                throw new Error("Failed to delete folder");
            }

            setFolders((prev) => prev.filter((f) => f.id !== folderId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed");
        } finally {
            setDeletingId(null);
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
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
            {folders.map((folder) => (
                <div
                    key={folder.id}
                    onClick={() => onFolderClick(folder.id, folder.name)}
                    className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer"
                >
                    {/* Folder Icon */}
                    <div className="flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-full text-center" title={folder.name}>
                            {folder.name}
                        </p>
                    </div>

                    {/* Delete Button */}
                    <button
                        onClick={(e) => handleDelete(e, folder.id)}
                        disabled={deletingId === folder.id}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-all disabled:opacity-50"
                    >
                        {deletingId === folder.id ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </button>
                </div>
            ))}
        </div>
    );
}

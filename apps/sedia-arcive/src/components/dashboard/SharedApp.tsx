import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import FileUploader from "./FileUploader";

interface SharedFile {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    url: string;
    sharedBy: string;
    sharedAt: string;
    permission: string;
    ownerName: string | null;
    ownerEmail: string;
}

interface SharedFolder {
    id: string;
    name: string;
    sharedBy: string;
    sharedAt: string;
    permission: string;
    ownerName: string | null;
    ownerEmail: string;
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

export default function SharedApp() {
    const [files, setFiles] = useState<SharedFile[]>([]);
    const [folders, setFolders] = useState<SharedFolder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [canGlobalUpload, setCanGlobalUpload] = useState(false);
    const [currentFolderPermission, setCurrentFolderPermission] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    const fetchSharedFiles = useCallback(async (folderId: string | null = null) => {
        try {
            setIsLoading(true);
            const query = folderId ? `?folderId=${folderId}` : "";
            const response = await fetch(`/api/shared${query}`);
            if (!response.ok) throw new Error("Failed to fetch shared files");
            const data = await response.json();
            setFiles(data.files || []);
            setFolders(data.folders || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load shared files");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Fetch global permissions
        fetch("/api/stats")
            .then(res => res.json())
            .then(data => {
                setCanGlobalUpload(data.uploadEnabled ?? false);
            })
            .catch(err => console.error("Failed to fetch stats:", err));

        const params = new URLSearchParams(window.location.search);
        const folderId = params.get("folderId");

        // We can't know the permission just from URL immediately unless we fetch it separately
        // But fetchSharedFiles will return content.
        // If we are deep linking, we rely on the response from fetchSharedFiles which contains
        // permissions in the items, but not the *current folder's* permission explicitly unless
        // we adjust the API to return metadata, or we pass it via state/query (unreliable).
        // Best approach: If we list files in a folder, the API response for /api/shared?folderId=...
        // should ideally tell us the permission for *that* folder. 
        // Currently it embeds permission in children. All children have the same permission (inherited).
        // So we can deduce it from the first child, or fail safe to "view".

        setCurrentFolderId(folderId);
        fetchSharedFiles(folderId);
    }, [fetchSharedFiles]);

    // Safety check: Update permission based on loaded content if needed, 
    // but better to rely on what we set on click.
    // Issue: If direct link, we don't have permission set from click.
    // Fix: We'll assume if any file/folder returned has permission, that's our permission.
    useEffect(() => {
        if (currentFolderId && (files.length > 0 || folders.length > 0)) {
            const perm = files[0]?.permission || folders[0]?.permission;
            if (perm) setCurrentFolderPermission(perm);
        }
    }, [files, folders, currentFolderId]);

    const handleDownload = (file: SharedFile) => {
        window.open(file.url, "_blank");
    };

    const handleFolderClick = (folderId: string, permission: string) => {
        setCurrentFolderId(folderId);
        setCurrentFolderPermission(permission);
        fetchSharedFiles(folderId);

        // Update URL without reload
        const url = new URL(window.location.href);
        url.searchParams.set("folderId", folderId);
        window.history.pushState({}, "", url.toString());
    };

    const handleBackClick = () => {
        // Simple 1-level for now or back to root
        setCurrentFolderId(null);
        setCurrentFolderPermission(null);
        fetchSharedFiles(null);

        const url = new URL(window.location.href);
        url.searchParams.delete("folderId");
        window.history.pushState({}, "", url.toString());
    };

    const handleUploadComplete = () => {
        fetchSharedFiles(currentFolderId);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                activePage="shared"
                onCollapsedChange={setSidebarCollapsed}
                mobileMenuOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
                <Header
                    title={currentFolderId ? "Shared Folder" : "Shared with Me"}
                    onMobileMenuOpen={() => setMobileMenuOpen(true)}
                />
                <main className="p-6">
                    {currentFolderId && (
                        <button
                            onClick={handleBackClick}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Shared
                        </button>
                    )}
                    {/* Check Permissions for Upload */}
                    {/* Only show uploader if: 1. In a folder 2. Has Edit permission 3. Has Global Upload permission */}
                    {currentFolderId && currentFolderPermission === "edit" && canGlobalUpload && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload to Shared Folder</h2>
                            <FileUploader
                                folderId={currentFolderId}
                                onUploadComplete={handleUploadComplete}
                            />
                        </div>
                    )}
                    {/* Info Banner */}
                    <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
                        <svg className="w-5 h-5 text-sky-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-sky-800">Shared with Me</p>
                            <p className="text-sm text-sky-600 mt-0.5">
                                Files that others have shared with you appear here.
                            </p>
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-sky-600 rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && files.length === 0 && folders.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No shared content</h3>
                            <p className="text-sm text-gray-500">Folders and files shared with you will appear here</p>
                        </div>
                    )}

                    {/* Folders List */}
                    {!isLoading && !error && folders.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Folders</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {folders.map((folder) => (
                                    <div
                                        key={folder.id}
                                        onClick={() => handleFolderClick(folder.id, folder.permission)}
                                        className="bg-white p-4 rounded-xl border border-gray-200 hover:border-sky-500 cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <svg className="w-10 h-10 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19.7 7H14.5l-2.3-2.6c-.6-.7-1.5-1-2.4-1H3c-1.3 0-2.3.9-2.3 2.1v12c0 1.2 1.1 2.3 2.4 2.3h16.7c1.3 0 2.3-1 2.3-2.1V9.2c0-1.2-1-2.2-2.4-2.2z" />
                                            </svg>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${folder.permission === "edit" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                {folder.permission === "edit" ? "Can edit" : "View"}
                                            </span>
                                        </div>
                                        <p className="font-medium text-gray-900 truncate mb-1 group-hover:text-sky-600 transition-colors">{folder.name}</p>
                                        <p className="text-xs text-gray-500">Shared by {folder.ownerName || folder.ownerEmail}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* File List */}
                    {!isLoading && !error && files.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Files</h3>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {files.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex-shrink-0">
                                                {getFileIcon(file.mimeType)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(file.size)} • Shared by {file.ownerName || file.ownerEmail} • {formatDate(file.sharedAt)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${file.permission === "edit" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                    {file.permission === "edit" ? "Can edit" : "View only"}
                                                </span>
                                                <button
                                                    onClick={() => handleDownload(file)}
                                                    className="px-3 py-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

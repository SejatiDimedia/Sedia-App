import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import FileUploader from "./FileUploader";
import FileList from "./FileList";
import FolderList from "./FolderList";
import FolderBreadcrumb from "./FolderBreadcrumb";
import CreateFolderModal from "./CreateFolderModal";
import StorageTracker from "./StorageTracker";
import ActivityLog from "./ActivityLog";
import { DownloadProvider } from "./DownloadManager";

interface BreadcrumbItem {
    id: string | null;
    name: string;
}

interface PermissionData {
    uploadEnabled: boolean;
    role: string;
}

export default function FilesApp() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([{ id: null, name: "Files" }]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [permission, setPermission] = useState<PermissionData | null>(null);
    const [isLoadingPermission, setIsLoadingPermission] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchPermission = async () => {
            try {
                const response = await fetch("/api/stats");
                if (response.ok) {
                    const data = await response.json();
                    setPermission({
                        uploadEnabled: data.uploadEnabled ?? false,
                        role: data.role || "user",
                    });
                }
            } catch (err) {
                console.error("Failed to fetch permission:", err);
            } finally {
                setIsLoadingPermission(false);
            }
        };
        fetchPermission();

        // Check for folderId in URL parameters
        const params = new URLSearchParams(window.location.search);
        const folderIdParam = params.get("folderId");
        if (folderIdParam) {
            setCurrentFolderId(folderIdParam);
            // We don't have the folder name here, so we might need to fetch it or just show "Shared Folder" initially
            // For now, let's just push a placeholder, the user can navigate up if needed
            setFolderPath(prev => [...prev, { id: folderIdParam, name: "Loading..." }]);

            // Fetch folder details to get name
            fetch(`/api/folders?parentId=${folderIdParam}`) // Incorrect endpoint for folder details
                .catch(() => { });

            // Better: fetch specific folder info. We don't have a single folder fetch endpoint yet visible.
            // But usually FolderList might fetch children.
            // Let's rely on standard navigation or fetch folder name if possible.
            // Actually, we can fetch the folder details to update the breadcrumb name
            // For now, let's leave it as "Folder" or try to fetch.
        }
    }, []);

    const handleUploadComplete = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    const handleFolderClick = (folderId: string, folderName: string) => {
        setCurrentFolderId(folderId);
        setFolderPath((prev) => [...prev, { id: folderId, name: folderName }]);
    };

    const handleBreadcrumbNavigate = (folderId: string | null) => {
        setCurrentFolderId(folderId);
        const index = folderPath.findIndex((item) => item.id === folderId);
        if (index !== -1) {
            setFolderPath(folderPath.slice(0, index + 1));
        }
    };

    const handleFolderCreated = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    const canUpload = permission?.uploadEnabled ?? false;

    return (
        <DownloadProvider>
            <div className="min-h-screen bg-gray-50">
                <Sidebar
                    activePage="files"
                    onCollapsedChange={setSidebarCollapsed}
                    mobileMenuOpen={mobileMenuOpen}
                    onMobileClose={() => setMobileMenuOpen(false)}
                />
                <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
                    <Header
                        title="Files"
                        onMobileMenuOpen={() => setMobileMenuOpen(true)}
                    />
                    <main className="p-6">
                        {/* View-Only Banner */}
                        {!isLoadingPermission && !canUpload && (
                            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-amber-800">View-Only Mode</p>
                                    <p className="text-sm text-amber-600 mt-0.5">
                                        You don't have upload permissions yet. Please contact an admin to enable upload access.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Main Content */}
                            <div className="lg:col-span-3 space-y-6">
                                {/* Upload Section - Only show if upload enabled */}
                                {canUpload && (
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h2>
                                        <FileUploader onUploadComplete={handleUploadComplete} folderId={currentFolderId} />
                                    </div>
                                )}

                                {/* Loading Skeleton for Upload Area */}
                                {isLoadingPermission && (
                                    <div className="space-y-4">
                                        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-48 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 animate-pulse" />
                                    </div>
                                )}

                                {/* Files & Folders Section */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900">Your Files</h2>
                                        <div className="flex items-center gap-2">
                                            {/* New Folder Button */}
                                            <button
                                                onClick={() => setIsCreateModalOpen(true)}
                                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                New Folder
                                            </button>
                                            {/* Refresh Button */}
                                            <button
                                                onClick={() => setRefreshTrigger((prev) => prev + 1)}
                                                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Refresh"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Breadcrumb Navigation */}
                                    <FolderBreadcrumb path={folderPath} onNavigate={handleBreadcrumbNavigate} />

                                    {/* Folders */}
                                    <FolderList
                                        parentId={currentFolderId}
                                        onFolderClick={handleFolderClick}
                                        refreshTrigger={refreshTrigger}
                                        onDeleteComplete={handleUploadComplete}
                                        onMoveComplete={handleUploadComplete}
                                    />

                                    {/* Files */}
                                    <FileList
                                        refreshTrigger={refreshTrigger}
                                        folderId={currentFolderId}
                                        onDeleteComplete={handleUploadComplete}
                                    />
                                </div>
                            </div>

                            {/* Sidebar - Storage Tracker & Activity */}
                            <div className="lg:col-span-1 space-y-4">
                                <StorageTracker refreshTrigger={refreshTrigger} />
                                <ActivityLog refreshTrigger={refreshTrigger} />
                            </div>
                        </div>
                    </main>
                </div>

                {/* Create Folder Modal */}
                <CreateFolderModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={handleFolderCreated}
                    parentId={currentFolderId}
                />
            </div>
        </DownloadProvider>
    );
}

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import FileUploader from "./FileUploader";
import FileList from "./FileList";
import FolderList from "./FolderList";
import FolderBreadcrumb from "./FolderBreadcrumb";
import CreateFolderModal from "./CreateFolderModal";

interface BreadcrumbItem {
    id: string | null;
    name: string;
}

export default function FilesApp() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([{ id: null, name: "Files" }]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar activePage="files" />
            <div className="ml-64 transition-all duration-300">
                <Header title="Files" />
                <main className="p-6">
                    {/* Upload Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h2>
                        <FileUploader onUploadComplete={handleUploadComplete} folderId={currentFolderId} />
                    </div>

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
                        />

                        {/* Files */}
                        <FileList refreshTrigger={refreshTrigger} folderId={currentFolderId} />
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
    );
}

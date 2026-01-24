import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import FileList from "./FileList";
import FolderList from "./FolderList";
import StorageTracker from "./StorageTracker";
import StarredStats from "./StarredStats";
import { DownloadProvider } from "./DownloadManager";

export default function StarredApp() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <DownloadProvider>
            <div className="min-h-screen bg-gray-50">
                <Sidebar
                    activePage="starred"
                    onCollapsedChange={setSidebarCollapsed}
                    mobileMenuOpen={mobileMenuOpen}
                    onMobileClose={() => setMobileMenuOpen(false)}
                />
                <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
                    <Header
                        title="Starred"
                        onMobileMenuOpen={() => setMobileMenuOpen(true)}
                    />
                    <main className="p-6">
                        {/* Info Banner */}
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                            <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-yellow-800">Starred Files</p>
                                <p className="text-sm text-yellow-600 mt-0.5">
                                    Files and folders you star will appear here for quick access.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <div className="lg:col-span-3 space-y-6">
                                {/* Files & Folders Section */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900">Starred Items</h2>
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

                                    {/* Folders */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium text-gray-500 mb-3">Folders</h3>
                                        <FolderList
                                            parentId={null}
                                            onFolderClick={() => { window.location.href = "/dashboard/files"; }}
                                            refreshTrigger={refreshTrigger}
                                            starredOnly={true}
                                        />
                                    </div>

                                    {/* Files */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-3">Files</h3>
                                        <FileList
                                            refreshTrigger={refreshTrigger}
                                            folderId={null} // Global search
                                            starredOnly={true}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Right Sidebar */}
                            <div className="lg:col-span-1 space-y-4">
                                <StorageTracker refreshTrigger={refreshTrigger} />
                                <StarredStats refreshTrigger={refreshTrigger} />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </DownloadProvider>
    );
}

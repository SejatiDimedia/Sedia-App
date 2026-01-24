import { useState, useEffect } from "react";


interface FileInfoSidebarProps {
    selectedItem: {
        id: string;
        name: string;
        type: "file" | "folder";
        mimeType?: string;
        size?: number;
        createdAt?: string;
        updatedAt?: string;
        url?: string;
        folderName?: string | null;
        isStarred?: boolean;
    } | null;
    onClose: () => void;
    onAction: (action: string, item: any) => void;
}

export default function FileInfoSidebar({ selectedItem, onClose, onAction }: FileInfoSidebarProps) {
    if (!selectedItem) return null;

    const isFile = selectedItem.type === "file";

    const getIcon = () => {
        if (!isFile) {
            return (
                <div className="w-24 h-24 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600 mb-4 mx-auto">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                    </svg>
                </div>
            );
        }

        if (selectedItem.mimeType?.startsWith("image/")) {
            return (
                <div className="w-full aspect-square bg-gray-100 rounded-2xl mb-4 overflow-hidden border border-gray-200">
                    <img src={selectedItem.url} alt={selectedItem.name} className="w-full h-full object-cover" />
                </div>
            );
        }

        return (
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-4 mx-auto ${selectedItem.mimeType?.startsWith("video/") ? "bg-pink-100 text-pink-500" :
                selectedItem.mimeType === "application/pdf" ? "bg-red-100 text-red-500" :
                    "bg-indigo-100 text-indigo-500"
                }`}>
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
        );
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Details</h3>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Preview */}
                <div className="text-center mb-6">
                    {getIcon()}
                    <h4 className="font-medium text-gray-900 break-words mb-1">{selectedItem.name}</h4>
                    <p className="text-sm text-gray-500">
                        {isFile ? (selectedItem.size ? formatFileSize(selectedItem.size) : 'Unknown size') : 'Folder'}
                    </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-4 gap-2 mb-8">
                    <button
                        onClick={() => onAction("download", selectedItem)}
                        className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                        title="Download"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors">
                            <svg className="w-5 h-5 text-gray-600 group-hover:text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                        <span className="text-[10px] text-gray-600 font-medium">Download</span>
                    </button>

                    <button
                        onClick={() => onAction("star", selectedItem)}
                        className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                        title={selectedItem.isStarred ? "Unstar" : "Star"}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedItem.isStarred ? "bg-yellow-100 text-yellow-500" : "bg-gray-100 text-gray-600 group-hover:bg-yellow-50 group-hover:text-yellow-600"}`}>
                            <svg className={`w-5 h-5 ${selectedItem.isStarred ? "fill-current" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <span className="text-[10px] text-gray-600 font-medium">Favorite</span>
                    </button>

                    <button
                        onClick={() => onAction("rename", selectedItem)}
                        className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                        title="Rename"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <svg className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <span className="text-[10px] text-gray-600 font-medium">Rename</span>
                    </button>

                    <button
                        onClick={() => onAction("delete", selectedItem)}
                        className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                        title="Delete"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                            <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <span className="text-[10px] text-gray-600 font-medium">Delete</span>
                    </button>
                </div>

                {/* Metadata List */}
                <div className="space-y-4">
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Information</h5>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Type</p>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                                {isFile ? (selectedItem.mimeType || "Unknown File") : "Folder"}
                            </p>
                        </div>
                        {isFile && (
                            <div>
                                <p className="text-xs text-gray-500 mb-0.5">Size</p>
                                <p className="text-sm font-medium text-gray-900">{formatFileSize(selectedItem.size || 0)}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Location</p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {selectedItem.folderName || "My Files"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Created</p>
                            <p className="text-sm font-medium text-gray-900">
                                {selectedItem.createdAt ? formatDate(selectedItem.createdAt) : "Unknown"}
                            </p>
                        </div>
                        {isFile && (
                            <div>
                                <p className="text-xs text-gray-500 mb-0.5">Last Modified</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {selectedItem.updatedAt ? formatDate(selectedItem.updatedAt) : "Unknown"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper functions (duplicated locally if utils file is not accessible, but ideally imported)
function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

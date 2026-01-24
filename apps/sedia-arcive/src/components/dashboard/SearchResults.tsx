import { useState, useEffect, useRef } from "react";
import FilePreviewModal from "./FilePreviewModal";
import SearchFilter from "./SearchFilter";

interface FileResult {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    url: string;
    type: "file";
}

interface FolderResult {
    id: string;
    name: string;
    type: "folder";
}

interface SearchResultsProps {
    onFolderClick?: (folderId: string, folderName: string) => void;
}

export default function SearchResults({ onFolderClick }: SearchResultsProps) {
    const [query, setQuery] = useState("");
    const [files, setFiles] = useState<FileResult[]>([]);
    const [folders, setFolders] = useState<FolderResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<FileResult | null>(null);
    const [filters, setFilters] = useState({ type: "all", starred: false, date: "all" });
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const debounce = setTimeout(async () => {
            const hasFilters = filters.type !== "all" || filters.starred || filters.date !== "all";

            if (query.length < 2 && !hasFilters) {
                setFiles([]);
                setFolders([]);
                return;
            }

            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (query) params.set("q", query);
                if (filters.type !== "all") params.set("type", filters.type);
                if (filters.starred) params.set("starred", "true");
                if (filters.date !== "all") params.set("date", filters.date);

                const response = await fetch(`/api/search?${params}`);
                const data = await response.json();
                if (response.ok) {
                    setFiles(data.files || []);
                    setFolders(data.folders || []);
                    setIsOpen(true);
                }
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounce);
    }, [query, filters]);

    const handleFileClick = (file: FileResult) => {
        // Redirect to files page - the file is in root if no folderId in search data
        window.location.href = `/dashboard/files`;
        setIsOpen(false);
        setQuery("");
    };

    const handleFolderClick = (folder: FolderResult) => {
        if (onFolderClick) {
            onFolderClick(folder.id, folder.name);
        } else {
            window.location.href = `/dashboard/files?folder=${folder.id}`;
        }
        setIsOpen(false);
        setQuery("");
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) {
            return (
                <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }
        if (mimeType.startsWith("video/")) {
            return (
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            );
        }
        if (mimeType.startsWith("audio/")) {
            return (
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
            );
        }
        if (mimeType === "application/pdf") {
            return (
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        }
        return (
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    const hasResults = files.length > 0 || folders.length > 0;

    return (
        <>
            <div className="hidden md:flex items-center gap-2">
                <div ref={containerRef} className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                            const hasFilters = filters.type !== "all" || filters.starred || filters.date !== "all";
                            if ((query.length >= 2 || hasFilters) && (files.length > 0 || folders.length > 0)) {
                                setIsOpen(true);
                            }
                        }}
                        placeholder="Search files..."
                        className="w-64 pl-10 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    />

                    {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Results Dropdown */}
                    {isOpen && (query.length >= 2 || filters.type !== "all" || filters.starred || filters.date !== "all") && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto z-50">
                            {!hasResults && !isLoading && (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No results found for "{query}"
                                </div>
                            )}

                            {folders.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">
                                        Folders
                                    </div>
                                    {folders.map((folder) => (
                                        <button
                                            key={folder.id}
                                            onClick={() => handleFolderClick(folder)}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <svg className="w-5 h-5 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                                            </svg>
                                            <span className="text-sm text-gray-900 truncate">{folder.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {files.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">
                                        Files
                                    </div>
                                    {files.map((file) => (
                                        <button
                                            key={file.id}
                                            onClick={() => handleFileClick(file)}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                                {getFileIcon(file.mimeType)}
                                            </div>
                                            <span className="text-sm text-gray-900 truncate">{file.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Filter Button - Moved Outside */}
                <SearchFilter filters={filters} onChange={setFilters} />
            </div>

            {/* Preview Modal */}
            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile}
            />
        </>
    );
}

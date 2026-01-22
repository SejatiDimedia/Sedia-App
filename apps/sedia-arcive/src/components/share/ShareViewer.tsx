import { useState, useEffect } from "react";

interface SharedFile {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    url: string;
}

interface SharedFolder {
    id: string;
    name: string;
}

interface SharedContent {
    type: "file" | "folder";
    file?: SharedFile;
    folder?: SharedFolder;
    files?: SharedFile[];
    subfolders?: SharedFolder[];
    allowDownload: boolean;
}

interface ShareViewerProps {
    token: string;
}

export default function ShareViewer({ token }: ShareViewerProps) {
    const [content, setContent] = useState<SharedContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const fetchContent = async (pwd?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const url = pwd ? `/api/share/${token}?password=${encodeURIComponent(pwd)}` : `/api/share/${token}`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.status === 401 && data.requiresPassword) {
                setRequiresPassword(true);
                // Check if this was a password attempt that failed
                if (pwd) {
                    setPasswordError("Incorrect password. Please try again.");
                }
                setIsLoading(false);
                return;
            }

            if (!response.ok) {
                setError(data.error || "Failed to load shared content");
                setIsLoading(false);
                return;
            }

            setContent(data);
            setRequiresPassword(false);
        } catch (err) {
            console.error("Failed to fetch shared content:", err);
            setError("Failed to load shared content");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, [token]);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setPasswordError(null);
        await fetchContent(password);
        setIsSubmitting(false);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) {
            return (
                <svg className="w-8 h-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }
        if (mimeType.startsWith("video/")) {
            return (
                <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            );
        }
        if (mimeType === "application/pdf") {
            return (
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        }
        return (
            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500">Loading shared content...</p>
                </div>
            </div>
        );
    }

    if (requiresPassword) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Password Protected</h1>
                        <p className="text-sm text-gray-500 mt-1">This content requires a password to view</p>
                    </div>

                    <form onSubmit={handlePasswordSubmit}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                            placeholder="Enter password"
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2 ${passwordError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                            autoFocus
                        />
                        {passwordError && (
                            <p className="text-sm text-red-500 mb-3 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {passwordError}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting || !password}
                            className="w-full py-3 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? "Verifying..." : "Access Content"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Content Unavailable</h1>
                    <p className="text-sm text-gray-500">{error}</p>
                    <a
                        href="/"
                        className="inline-block mt-6 px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                    >
                        Go to Homepage
                    </a>
                </div>
            </div>
        );
    }

    if (!content) return null;

    // Single file view
    if (content.type === "file" && content.file) {
        const file = content.file;
        const isImage = file.mimeType.startsWith("image/");
        const isVideo = file.mimeType.startsWith("video/");

        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                {getFileIcon(file.mimeType)}
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl font-bold text-gray-900 truncate">{file.name}</h1>
                                    <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                                </div>
                                {content.allowDownload && (
                                    <a
                                        href={file.url}
                                        download={file.name}
                                        className="px-4 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-6 bg-gray-50">
                            {isImage ? (
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                                />
                            ) : isVideo ? (
                                <video
                                    src={file.url}
                                    controls
                                    className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                                />
                            ) : (
                                <div className="text-center py-12">
                                    {getFileIcon(file.mimeType)}
                                    <p className="text-gray-500 mt-4">Preview not available for this file type</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Powered by */}
                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-400">
                            Shared via{" "}
                            <a href="/" className="text-sky-500 hover:underline">
                                SediaArcive
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Folder view
    if (content.type === "folder" && content.folder) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">{content.folder.name}</h1>
                                    <p className="text-sm text-gray-500">
                                        {content.files?.length || 0} files
                                        {content.subfolders && content.subfolders.length > 0 && `, ${content.subfolders.length} folders`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Files */}
                        <div className="p-6">
                            {(!content.files || content.files.length === 0) ? (
                                <p className="text-center text-gray-400 py-8">This folder is empty</p>
                            ) : (
                                <div className="grid gap-3">
                                    {content.files.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                        >
                                            {getFileIcon(file.mimeType)}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                                <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                                            </div>
                                            {content.allowDownload && (
                                                <a
                                                    href={file.url}
                                                    download={file.name}
                                                    className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Powered by */}
                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-400">
                            Shared via{" "}
                            <a href="/" className="text-sky-500 hover:underline">
                                SediaArcive
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

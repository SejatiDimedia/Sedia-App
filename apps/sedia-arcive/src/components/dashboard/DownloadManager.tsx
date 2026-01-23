import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface DownloadItem {
    id: string;
    filename: string;
    progress: number; // 0-100
    status: "pending" | "downloading" | "saving" | "completed" | "error";
    error?: string;
}

interface DownloadContextType {
    downloads: DownloadItem[];
    startDownload: (url: string, filename: string) => void;
    clearCompleted: () => void;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

export function useDownload() {
    const context = useContext(DownloadContext);
    if (!context) {
        throw new Error("useDownload must be used within DownloadProvider");
    }
    return context;
}

export function DownloadProvider({ children }: { children: ReactNode }) {
    const [downloads, setDownloads] = useState<DownloadItem[]>([]);

    const startDownload = useCallback(async (url: string, filename: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Add to queue
        setDownloads(prev => [...prev, {
            id,
            filename,
            progress: 0,
            status: "pending"
        }]);

        try {
            // Start fetching
            setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: "downloading" } : d));

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentLength = response.headers.get("content-length");
            const total = contentLength ? parseInt(contentLength, 10) : 0;

            if (!response.body) {
                throw new Error("ReadableStream not supported");
            }

            const reader = response.body.getReader();
            const chunks: Uint8Array[] = [];
            let receivedLength = 0;

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                chunks.push(value);
                receivedLength += value.length;

                // Update progress
                if (total > 0) {
                    const progress = Math.round((receivedLength / total) * 100);
                    setDownloads(prev => prev.map(d => d.id === id ? { ...d, progress } : d));
                } else {
                    // If no content-length, show indeterminate (pulse between 20-80)
                    setDownloads(prev => prev.map(d => {
                        if (d.id === id) {
                            const newProgress = d.progress >= 80 ? 20 : d.progress + 10;
                            return { ...d, progress: newProgress };
                        }
                        return d;
                    }));
                }
            }

            // Mark as saving (browser will handle save dialog)
            setDownloads(prev => prev.map(d => d.id === id ? { ...d, progress: 100, status: "saving" } : d));

            // Combine chunks into blob
            const blob = new Blob(chunks as BlobPart[]);
            const blobUrl = URL.createObjectURL(blob);

            // Trigger download
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up blob URL after a short delay
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

            // Mark as completed after a brief delay for saving
            setTimeout(() => {
                setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: "completed" } : d));
            }, 1500);

            // Auto-remove after 4 seconds total
            setTimeout(() => {
                setDownloads(prev => prev.filter(d => d.id !== id));
            }, 4500);

        } catch (error) {
            console.error("Download error:", error);
            setDownloads(prev => prev.map(d => d.id === id ? {
                ...d,
                status: "error",
                error: error instanceof Error ? error.message : "Download failed"
            } : d));
        }
    }, []);

    const clearCompleted = useCallback(() => {
        setDownloads(prev => prev.filter(d => d.status !== "completed" && d.status !== "error"));
    }, []);

    return (
        <DownloadContext.Provider value={{ downloads, startDownload, clearCompleted }}>
            {children}
            <DownloadIndicator downloads={downloads} onClearCompleted={clearCompleted} />
        </DownloadContext.Provider>
    );
}

// Floating Download Indicator Component
function DownloadIndicator({
    downloads,
    onClearCompleted
}: {
    downloads: DownloadItem[];
    onClearCompleted: () => void;
}) {
    if (downloads.length === 0) return null;

    const getStatusText = (download: DownloadItem) => {
        switch (download.status) {
            case "pending": return "Waiting...";
            case "downloading": return `Fetching ${download.progress}%`;
            case "saving": return "Saving to disk...";
            case "completed": return "Saved!";
            case "error": return download.error || "Failed";
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">Downloads</span>
                    <span className="text-xs text-gray-500">({downloads.length})</span>
                </div>
                {downloads.some(d => d.status === "completed" || d.status === "error") && (
                    <button
                        onClick={onClearCompleted}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Download Items */}
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                {downloads.map(download => (
                    <div key={download.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={download.filename}>
                                {download.filename}
                            </p>
                            {download.status === "completed" && (
                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {download.status === "error" && (
                                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            {download.status === "saving" && (
                                <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>

                        {/* Progress Bar */}
                        {(download.status === "downloading" || download.status === "pending") && (
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                                <div
                                    className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-300 ease-out rounded-full"
                                    style={{ width: `${download.progress}%` }}
                                />
                            </div>
                        )}

                        {download.status === "saving" && (
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                                <div className="h-full w-full bg-gradient-to-r from-sky-400 via-sky-500 to-sky-400 rounded-full animate-pulse" />
                            </div>
                        )}

                        {/* Status Text */}
                        <p className={`text-xs ${download.status === "completed" ? "text-green-600" :
                                download.status === "error" ? "text-red-600" :
                                    download.status === "saving" ? "text-sky-600" :
                                        "text-gray-500"
                            }`}>
                            {getStatusText(download)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}


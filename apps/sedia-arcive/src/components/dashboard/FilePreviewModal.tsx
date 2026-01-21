import { useState, useEffect } from "react";

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        id: string;
        name: string;
        mimeType: string;
        url: string;
        size: number;
    } | null;
}

export default function FilePreviewModal({ isOpen, onClose, file }: FilePreviewModalProps) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
        }
    }, [isOpen, file]);

    if (!isOpen || !file) return null;

    const isImage = file.mimeType.startsWith("image/");
    const isVideo = file.mimeType.startsWith("video/");
    const isAudio = file.mimeType.startsWith("audio/");
    const isPDF = file.mimeType === "application/pdf";

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = file.url;
        link.download = file.name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-lg font-semibold text-gray-900 truncate">{file.name}</h2>
                        <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Download Button */}
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                        </button>
                        {/* Open in new tab */}
                        <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Open in new tab"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center min-h-[400px]">
                    {isImage && (
                        <>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                    <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            <img
                                src={file.url}
                                alt={file.name}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                onLoad={() => setIsLoading(false)}
                            />
                        </>
                    )}

                    {isVideo && (
                        <video
                            src={file.url}
                            controls
                            className="max-w-full max-h-full rounded-lg shadow-lg"
                            onLoadedData={() => setIsLoading(false)}
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}

                    {isAudio && (
                        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-xl shadow-lg">
                            <svg className="w-16 h-16 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            <audio src={file.url} controls className="w-full max-w-md" />
                        </div>
                    )}

                    {isPDF && (
                        <iframe
                            src={file.url}
                            className="w-full h-full min-h-[500px] rounded-lg"
                            title={file.name}
                        />
                    )}

                    {!isImage && !isVideo && !isAudio && !isPDF && (
                        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-xl shadow-lg">
                            <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-600">Preview not available for this file type</p>
                            <button
                                onClick={handleDownload}
                                className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
                            >
                                Download File
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

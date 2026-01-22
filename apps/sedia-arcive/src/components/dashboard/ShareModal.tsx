import { useState, useEffect } from "react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: "file" | "folder";
    targetId: string;
    targetName: string;
}

interface ShareLink {
    id: string;
    token: string;
    url: string;
    expiresAt: string | null;
    password: string | null;
}

export default function ShareModal({ isOpen, onClose, targetType, targetId, targetName }: ShareModalProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [existingLinks, setExistingLinks] = useState<ShareLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Form state
    const [expiresIn, setExpiresIn] = useState<string>("never");
    const [password, setPassword] = useState("");
    const [allowDownload, setAllowDownload] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchExistingLinks();
        }
    }, [isOpen, targetType, targetId]);

    const fetchExistingLinks = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/share?targetType=${targetType}&targetId=${targetId}`);
            if (response.ok) {
                const data = await response.json();
                setExistingLinks(data.shareLinks || []);
            }
        } catch (err) {
            console.error("Failed to fetch share links:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            const response = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetType,
                    targetId,
                    expiresIn: expiresIn === "never" ? null : expiresIn,
                    password: password || null,
                    allowDownload,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setExistingLinks((prev) => [data.shareLink, ...prev]);
                setPassword("");
                setExpiresIn("never");
            }
        } catch (err) {
            console.error("Failed to create share link:", err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (shareId: string) => {
        try {
            const response = await fetch("/api/share", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shareId }),
            });

            if (response.ok) {
                setExistingLinks((prev) => prev.filter((link) => link.id !== shareId));
            }
        } catch (err) {
            console.error("Failed to delete share link:", err);
        }
    };

    const handleCopy = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const input = document.createElement("input");
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Share {targetType}</h2>
                        <p className="text-sm text-gray-500 truncate max-w-[300px]">{targetName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    {/* Create New Link */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Create Share Link</h3>

                        <div className="space-y-3">
                            {/* Expiration */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Expires In</label>
                                <select
                                    value={expiresIn}
                                    onChange={(e) => setExpiresIn(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                >
                                    <option value="never">Never</option>
                                    <option value="1h">1 Hour</option>
                                    <option value="24h">24 Hours</option>
                                    <option value="7d">7 Days</option>
                                    <option value="30d">30 Days</option>
                                </select>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Password (optional)</label>
                                <input
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Leave empty for no password"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            {/* Allow Download */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="allowDownload"
                                    checked={allowDownload}
                                    onChange={(e) => setAllowDownload(e.target.checked)}
                                    className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500"
                                />
                                <label htmlFor="allowDownload" className="text-sm text-gray-700">Allow download</label>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="w-full py-2 px-4 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCreating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        Create Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Existing Links */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Active Links</h3>

                        {isLoading ? (
                            <div className="text-center py-4">
                                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : existingLinks.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No active share links</p>
                        ) : (
                            <div className="space-y-2">
                                {existingLinks.map((link) => (
                                    <div key={link.id} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {link.password && (
                                                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded">Password</span>
                                                )}
                                                {link.expiresAt && (
                                                    <span className="text-xs text-gray-400">
                                                        Expires {new Date(link.expiresAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(link.url)}
                                            className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                                            title="Copy link"
                                        >
                                            {copied ? (
                                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(link.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete link"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

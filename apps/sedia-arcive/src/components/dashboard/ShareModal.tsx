import { useState, useEffect } from "react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: "file" | "folder";
    targetId?: string; // Single file ID
    targetIds?: string[]; // Bulk file IDs
    targetName: string;
}

interface ShareLink {
    id: string;
    token: string;
    url: string;
    expiresAt: string | null;
    password: string | null;
}

interface AccessUser {
    id: string;
    userId: string;
    name: string;
    email: string;
    image: string | null;
    permission: string;
    sharedAt: string;
}

export default function ShareModal({ isOpen, onClose, targetType, targetId, targetIds, targetName }: ShareModalProps) {
    const isBulk = !!targetIds && targetIds.length > 0;
    const [activeTab, setActiveTab] = useState<"public" | "internal">(isBulk ? "internal" : "public");

    // Public Link State
    const [isCreatingLink, setIsCreatingLink] = useState(false);
    const [existingLinks, setExistingLinks] = useState<ShareLink[]>([]);
    const [isLoadingLinks, setIsLoadingLinks] = useState(true);
    const [copied, setCopied] = useState(false);
    const [expiresIn, setExpiresIn] = useState<string>("never");
    const [password, setPassword] = useState("");
    const [allowDownload, setAllowDownload] = useState(true);

    // Internal Share State
    const [email, setEmail] = useState("");
    const [permission, setPermission] = useState("view");
    const [isSharing, setIsSharing] = useState(false);
    const [collaborators, setCollaborators] = useState<AccessUser[]>([]);
    const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(true);
    const [shareMessage, setShareMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset states
            setActiveTab("public");
            setShareMessage(null);
            setEmail("");

            // Fetch initial data
            fetchExistingLinks();
            if (!isBulk) {
                fetchCollaborators();
            }
        }
    }, [isOpen, targetType, targetId]);

    const fetchExistingLinks = async () => {
        setIsLoadingLinks(true);
        try {
            const response = await fetch(`/api/share?targetType=${targetType}&targetId=${targetId}`);
            if (response.ok) {
                const data = await response.json();
                setExistingLinks(data.shareLinks || []);
            }
        } catch (err) {
            console.error("Failed to fetch share links:", err);
        } finally {
            setIsLoadingLinks(false);
        }
    };

    const fetchCollaborators = async () => {
        setIsLoadingCollaborators(true);
        try {
            const response = await fetch(`/api/share/access?targetId=${targetId}&targetType=${targetType}`);
            if (response.ok) {
                const data = await response.json();
                setCollaborators(data.accessList || []);
            }
        } catch (err) {
            console.error("Failed to fetch collaborators:", err);
        } finally {
            setIsLoadingCollaborators(false);
        }
    };

    const handleCreateLink = async () => {
        setIsCreatingLink(true);
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
            setIsCreatingLink(false);
        }
    };

    const handleDeleteLink = async (shareId: string) => {
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

    const handleShareInternal = async () => {
        if (!email) return;
        setIsSharing(true);
        setShareMessage(null);

        try {
            // Build request body based on share type
            let body: Record<string, unknown> = { email, permission };

            if (isBulk && targetIds) {
                // Bulk file sharing - share multiple files
                body.fileIds = targetIds;
            } else if (targetType === "folder" && targetId) {
                // Folder sharing - API will share all files in folder
                body.folderId = targetId;
            } else if (targetId) {
                // Single file sharing
                body.fileId = targetId;
            }

            const response = await fetch("/api/share/internal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                const successMsg = isBulk
                    ? `Shared ${targetIds?.length} files with ${data.sharedWith}`
                    : targetType === "folder"
                        ? `Shared folder (${data.filesShared} files) with ${data.sharedWith}`
                        : `Shared with ${data.sharedWith}`;
                setShareMessage({ type: "success", text: successMsg });
                setEmail("");
                if (!isBulk && targetType === "file") fetchCollaborators();
            } else {
                setShareMessage({ type: "error", text: data.error || "Failed to share" });
            }
        } catch (err) {
            setShareMessage({ type: "error", text: "Network error occurred" });
        } finally {
            setIsSharing(false);
        }
    };

    const handleRemoveAccess = async (userId: string) => {
        try {
            const response = await fetch("/api/share/internal", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileId: targetType === "file" ? targetId : undefined,
                    folderId: targetType === "folder" ? targetId : undefined,
                    userId
                }),
            });

            if (response.ok) {
                setCollaborators(prev => prev.filter(c => c.userId !== userId));
            }
        } catch (err) {
            console.error("Failed to remove access:", err);
        }
    };

    const handleCopy = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback not implemented for brevity
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Share {targetType === "file" ? "File" : "Folder"}</h2>
                        <p className="text-sm text-gray-500 truncate max-w-[300px]">{targetName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs - Show for both files and folders */}
                {!isBulk && (
                    <div className="flex border-b border-gray-100 flex-shrink-0">
                        <button
                            onClick={() => setActiveTab("public")}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "public" ? "border-sky-500 text-sky-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            Public Link
                        </button>
                        <button
                            onClick={() => setActiveTab("internal")}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "internal" ? "border-sky-500 text-sky-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            Collaborate
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1">
                    {/* PUBLIC LINK TAB */}
                    {activeTab === "public" && (
                        <div className="space-y-6">
                            {/* Create Link Form */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Create Public Link</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
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
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Password (Opt)</label>
                                            <input
                                                type="text"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Safe123"
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
                                    </div>

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
                                        onClick={handleCreateLink}
                                        disabled={isCreatingLink}
                                        className="w-full py-2 px-4 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isCreatingLink ? "Creating..." : "Create Link"}
                                    </button>
                                </div>
                            </div>

                            {/* Active Links List */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Active Links</h3>
                                {isLoadingLinks ? (
                                    <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
                                ) : existingLinks.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-2">No public links yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {existingLinks.map((link) => (
                                            <div key={link.id} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {link.password && <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded">Password</span>}
                                                        {link.expiresAt && <span className="text-xs text-gray-400">Exp: {new Date(link.expiresAt).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                                <button onClick={() => handleCopy(link.url)} className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg">
                                                    {copied ? <span className="text-green-500 font-bold">✓</span> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                                                </button>
                                                <button onClick={() => handleDeleteLink(link.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* INTERNAL SHARE TAB */}
                    {activeTab === "internal" && (
                        <div className="space-y-6">
                            {/* Share Form */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Add Collaborator</h3>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter email address"
                                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                        <select
                                            value={permission}
                                            onChange={(e) => setPermission(e.target.value)}
                                            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        >
                                            <option value="view">Can view</option>
                                            <option value="edit">Can edit</option>
                                        </select>
                                    </div>

                                    {shareMessage && (
                                        <div className={`text-xs px-3 py-2 rounded-lg ${shareMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {shareMessage.text}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleShareInternal}
                                        disabled={isSharing || !email}
                                        className="w-full py-2 px-4 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSharing ? "Sharing..." : "Share"}
                                    </button>
                                </div>
                            </div>

                            {/* Collaborators List */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Who has access</h3>
                                {isLoadingCollaborators ? (
                                    <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
                                ) : collaborators.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-2">No collaborators added yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {collaborators.map((user) => (
                                            <div key={user.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-xs">
                                                    {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{user.name || user.email}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 capitalize">{user.permission}</span>
                                                    <button
                                                        onClick={() => handleRemoveAccess(user.userId)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                        title="Remove access"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

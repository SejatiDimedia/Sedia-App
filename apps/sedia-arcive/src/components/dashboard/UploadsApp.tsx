import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import FileUploader from "./FileUploader";

interface Activity {
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    targetName: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

interface PermissionData {
    uploadEnabled: boolean;
    role: string;
}

export default function UploadsApp() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Permission State
    const [permission, setPermission] = useState<PermissionData | null>(null);
    const [isLoadingPermission, setIsLoadingPermission] = useState(true);
    const [isRequesting, setIsRequesting] = useState(false);
    const [requestStatus, setRequestStatus] = useState<"idle" | "success" | "error">("idle");

    const fetchActivities = async () => {
        try {
            const response = await fetch("/api/activity?limit=50");
            if (response.ok) {
                const data = await response.json();
                // Filter only upload activities
                const uploads = (data.activities || []).filter(
                    (a: Activity) => a.action === "upload"
                );
                setActivities(uploads);
            }
        } catch (err) {
            console.error("Failed to fetch activities:", err);
        } finally {
            setIsLoading(false);
        }
    };

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

    useEffect(() => {
        fetchActivities();
        fetchPermission();
    }, []);

    const handleUploadComplete = () => {
        fetchActivities();
    };

    const handleRequestAccess = async () => {
        setIsRequesting(true);
        setRequestStatus("idle");
        try {
            const res = await fetch("/api/request-access", { method: "POST" });
            if (res.ok) {
                setRequestStatus("success");
            } else {
                setRequestStatus("error");
            }
        } catch {
            setRequestStatus("error");
        } finally {
            setIsRequesting(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType?.startsWith("image/")) {
            return (
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            );
        }
        if (mimeType?.startsWith("video/")) {
            return (
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
            );
        }
        if (mimeType === "application/pdf") {
            return (
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
            );
        }
        return (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
        );
    };

    const canUpload = permission?.uploadEnabled ?? false;
    const totalUploads = activities.length;
    const todayUploads = activities.filter(a => {
        const d = new Date(a.createdAt);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    }).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                activePage="uploads"
                onCollapsedChange={setSidebarCollapsed}
                mobileMenuOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
                <Header
                    title="Uploads"
                    onMobileMenuOpen={() => setMobileMenuOpen(true)}
                />
                <main className="p-6 space-y-6">

                    {/* Stats Cards */}
                    {!isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-sky-100 rounded-xl">
                                    <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total Uploads</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{totalUploads}</h3>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 rounded-xl">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Uploaded Today</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{todayUploads}</h3>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Upload Status</p>
                                    <h3 className="text-sm font-bold text-gray-900 mt-1">
                                        {canUpload ? <span className="text-green-600">Active</span> : <span className="text-amber-600">Restricted</span>}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content (Upload + History) */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Upload Area */}
                            {isLoadingPermission ? (
                                <div className="space-y-4">
                                    <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-48 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 animate-pulse" />
                                </div>
                            ) : canUpload ? (
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Upload</h2>
                                    <FileUploader onUploadComplete={handleUploadComplete} />
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                    <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-800">Upload Restricted</p>
                                        <p className="text-sm text-amber-600 mt-0.5">
                                            You need upload permissions to add files.
                                        </p>
                                        <div className="mt-3">
                                            {requestStatus === "success" ? (
                                                <span className="text-sm font-medium text-green-600 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    Request sent!
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={handleRequestAccess}
                                                    disabled={isRequesting}
                                                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {isRequesting ? "Sending..." : "Request Access"}
                                                </button>
                                            )}
                                            {requestStatus === "error" && (
                                                <p className="text-xs text-red-500 mt-1">Failed to send request.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* History List */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Recent Uploads</h2>
                                        <p className="text-sm text-gray-500 mt-1">History of your file uploads.</p>
                                    </div>
                                    <button
                                        onClick={fetchActivities}
                                        className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                        title="Refresh"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                </div>

                                {isLoading ? (
                                    <div className="p-8 text-center">
                                        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                        <p className="text-gray-500 mt-3">Loading uploads...</p>
                                    </div>
                                ) : activities.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads found</h3>
                                        <p className="text-gray-500">Your upload history will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {activities.map((activity) => (
                                            <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                                                {getFileIcon(activity.metadata?.mimeType as string)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{activity.targetName}</p>
                                                        <a href={`/dashboard/files?folderId=${(activity.metadata as any)?.folderId || ''}`} target="_blank" className="text-xs text-sky-500 hover:underline">View</a>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {activity.metadata?.size ? formatSize(activity.metadata.size as number) : ""} • {formatTime(activity.createdAt)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full font-medium">Completed</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

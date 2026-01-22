import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface Activity {
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    targetName: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

export default function UploadsApp() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
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
        fetchActivities();
    }, []);

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

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar activePage="uploads" onCollapsedChange={setSidebarCollapsed} />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
                <Header title="Upload History" />
                <main className="p-6">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Uploads</h2>
                            <p className="text-sm text-gray-500 mt-1">View all your uploaded files.</p>
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
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
                                <p className="text-gray-500">Upload your first file to see it here.</p>
                                <a href="/dashboard/files" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Upload Files
                                </a>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                                        {getFileIcon(activity.metadata?.mimeType as string)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{activity.targetName}</p>
                                            <p className="text-xs text-gray-500">
                                                {activity.metadata?.size ? formatSize(activity.metadata.size as number) : ""} • {formatTime(activity.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">Uploaded</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

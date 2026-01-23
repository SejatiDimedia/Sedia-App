import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface ActivityRecord {
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    targetName: string;
    metadata: string | null;
    createdAt: string;
}

const actionLabels: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    upload: {
        label: "Uploaded",
        color: "text-green-600 bg-green-50",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
        ),
    },
    delete: {
        label: "Moved to trash",
        color: "text-amber-600 bg-amber-50",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },
    restore: {
        label: "Restored",
        color: "text-sky-600 bg-sky-50",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
    },
    permanent_delete: {
        label: "Permanently deleted",
        color: "text-red-600 bg-red-50",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
    },
    share: {
        label: "Shared",
        color: "text-purple-600 bg-purple-50",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
        ),
    },
    create_folder: {
        label: "Created folder",
        color: "text-blue-600 bg-blue-50",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    move: {
        label: "Moved",
        color: "text-indigo-600 bg-indigo-50",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
    },
};

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export default function ActivityApp() {
    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const fetchActivities = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/activity");
            if (!response.ok) throw new Error("Failed to fetch activities");
            const data = await response.json();
            setActivities(data.activities || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load activities");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                activePage="activity"
                onCollapsedChange={setSidebarCollapsed}
                mobileMenuOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
                <Header
                    title="Activity Log"
                    onMobileMenuOpen={() => setMobileMenuOpen(true)}
                />
                <main className="p-6">
                    {/* Loading */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-sky-600 rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && activities.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No activity yet</h3>
                            <p className="text-sm text-gray-500">Your file activities will appear here</p>
                        </div>
                    )}

                    {/* Timeline */}
                    {!isLoading && !error && activities.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h2 className="text-sm font-medium text-gray-900">Recent Activity</h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {activities.map((activity) => {
                                    const actionInfo = actionLabels[activity.action] || {
                                        label: activity.action,
                                        color: "text-gray-600 bg-gray-50",
                                        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="2" /></svg>,
                                    };
                                    return (
                                        <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${actionInfo.color}`}>
                                                {actionInfo.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900">
                                                    <span className="font-medium">{actionInfo.label}</span>
                                                    {" "}
                                                    <span className="text-gray-600">{activity.targetName}</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {formatRelativeTime(activity.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${activity.targetType === "file" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {activity.targetType}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

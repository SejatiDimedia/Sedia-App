import { useState, useEffect } from "react";

interface Activity {
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    targetName: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

interface ActivityLogProps {
    refreshTrigger?: number;
}

export default function ActivityLog({ refreshTrigger = 0 }: ActivityLogProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await fetch("/api/activity?limit=10");
                if (response.ok) {
                    const data = await response.json();
                    setActivities(data.activities?.slice(0, 10) || []);
                }
            } catch (err) {
                console.error("Failed to fetch activities:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchActivities();
    }, [refreshTrigger]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case "upload":
                return (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </div>
                );
            case "delete":
                return (
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                );
            case "create_folder":
                return (
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                );
            case "delete_folder":
                return (
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    const getActionText = (action: string, targetType: string) => {
        switch (action) {
            case "upload":
                return "Uploaded";
            case "delete":
                return "Deleted";
            case "create_folder":
                return "Created folder";
            case "delete_folder":
                return "Deleted folder";
            case "move":
                return `Moved ${targetType}`;
            default:
                return action;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 bg-gray-200 rounded w-3/4" />
                                <div className="h-2 bg-gray-200 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h3>
                <p className="text-xs text-gray-400 text-center py-4">No activity yet</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h3>
            <div className="space-y-3">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            {getActionIcon(activity.action)}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-xs text-gray-600 break-words">
                                <span className="font-medium text-gray-900">
                                    {getActionText(activity.action, activity.targetType)}
                                </span>{" "}
                                <span className="break-all">{activity.targetName}</span>
                            </p>
                            <p className="text-xs text-gray-400">{formatTime(activity.createdAt)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

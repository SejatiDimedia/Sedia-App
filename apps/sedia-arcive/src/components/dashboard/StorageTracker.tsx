import { useState, useEffect } from "react";

interface StorageData {
    storageUsed: number;
    storageLimit: number;
    uploadEnabled: boolean;
}

interface StorageTrackerProps {
    refreshTrigger?: number;
}

export default function StorageTracker({ refreshTrigger = 0 }: StorageTrackerProps) {
    const [data, setData] = useState<StorageData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("/api/stats");
                if (response.ok) {
                    const stats = await response.json();
                    setData({
                        storageUsed: stats.totalSize || 0, // Use totalSize (real-time sum) instead of permission.storageUsed
                        storageLimit: stats.storageLimit || 524288000,
                        uploadEnabled: stats.uploadEnabled ?? false,
                    });
                }
            } catch (err) {
                console.error("Failed to fetch storage stats:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [refreshTrigger]);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (isLoading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-2 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
        );
    }

    if (!data) return null;

    const usagePercent = Math.min(100, (data.storageUsed / data.storageLimit) * 100);
    const isNearLimit = usagePercent >= 80;
    const isOverLimit = usagePercent >= 95;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Storage</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isOverLimit
                    ? "bg-red-100 text-red-600"
                    : isNearLimit
                        ? "bg-amber-100 text-amber-600"
                        : "bg-sky-100 text-sky-600"
                    }`}>
                    {usagePercent.toFixed(0)}%
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full transition-all duration-500 ${isOverLimit
                        ? "bg-red-500"
                        : isNearLimit
                            ? "bg-amber-500"
                            : "bg-sky-500"
                        }`}
                    style={{ width: `${usagePercent}%` }}
                />
            </div>

            {/* Usage Text */}
            <p className="text-xs text-gray-500">
                {formatSize(data.storageUsed)} / {formatSize(data.storageLimit)}
            </p>

            {/* Upload Note - Removed as redundant */}
        </div>
    );
}

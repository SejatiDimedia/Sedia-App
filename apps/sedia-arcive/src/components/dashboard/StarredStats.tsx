import { useState, useEffect } from "react";

interface StarredCounts {
    files: number;
    folders: number;
    images: number;
    videos: number;
    documents: number;
    others: number;
}

interface StarredStatsProps {
    refreshTrigger: number;
}

export default function StarredStats({ refreshTrigger }: StarredStatsProps) {
    const [counts, setCounts] = useState<StarredCounts>({
        files: 0,
        folders: 0,
        images: 0,
        videos: 0,
        documents: 0,
        others: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch all starred items to count them locally or via special endpoint
                // Since we don't have a specific stats endpoint for starred, we'll fetch list
                // This is fine for reasonable amounts of data.
                const response = await fetch("/api/files?starred=true");
                const data = await response.json();

                // Also fetch folders if possible, or just focus on files
                // Assuming /api/files returns files

                if (response.ok) {
                    const files: any[] = data.files || [];

                    const newCounts = {
                        files: files.length,
                        folders: 0, // Need separate fetch if we really want folder count in stats
                        images: files.filter(f => f.mimeType.startsWith('image/')).length,
                        videos: files.filter(f => f.mimeType.startsWith('video/')).length,
                        documents: files.filter(f => f.mimeType === 'application/pdf').length,
                        others: 0
                    };
                    newCounts.others = newCounts.files - (newCounts.images + newCounts.videos + newCounts.documents);

                    setCounts(prev => ({ ...prev, ...newCounts }));
                }
            } catch (err) {
                console.error("Failed to fetch starred stats", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [refreshTrigger]);

    if (isLoading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="space-y-3">
                    <div className="h-2 bg-gray-200 rounded w-full" />
                    <div className="h-2 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-200 rounded w-5/6" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Starred Breakdown</h3>

            <div className="space-y-3">
                {/* Images */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-pink-500" />
                        <span className="text-xs text-gray-600">Images</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">{counts.images}</span>
                </div>

                {/* Videos */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-xs text-gray-600">Videos</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">{counts.videos}</span>
                </div>

                {/* Documents */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs text-gray-600">Documents</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">{counts.documents}</span>
                </div>

                {/* Others */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-xs text-gray-600">Others</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">{counts.others}</span>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-1">
                    <span className="text-xs font-medium text-gray-500">Total Items</span>
                    <span className="text-xs font-bold text-gray-900">{counts.files}</span>
                </div>
            </div>
        </div>
    );
}

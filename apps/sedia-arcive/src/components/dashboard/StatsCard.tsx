interface StatsCardProps {
    title: string;
    value: string;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: React.ReactNode;
}

export default function StatsCard({ title, value, change, changeType = "neutral", icon }: StatsCardProps) {
    const changeColors = {
        positive: "text-green-600 bg-green-50",
        negative: "text-red-600 bg-red-50",
        neutral: "text-zinc-600 bg-zinc-100",
    };

    return (
        <div className="bg-white rounded-xl border border-zinc-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-zinc-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-zinc-900">{value}</p>
                    {change && (
                        <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${changeColors[changeType]}`}>
                            {changeType === "positive" && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                            {changeType === "negative" && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                            {change}
                        </div>
                    )}
                </div>
                <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
                    {icon}
                </div>
            </div>
        </div>
    );
}

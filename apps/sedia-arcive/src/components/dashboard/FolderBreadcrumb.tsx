interface BreadcrumbItem {
    id: string | null;
    name: string;
}

interface FolderBreadcrumbProps {
    path: BreadcrumbItem[];
    onNavigate: (folderId: string | null) => void;
}

export default function FolderBreadcrumb({ path, onNavigate }: FolderBreadcrumbProps) {
    if (path.length <= 1) {
        // Only "Files" root, no need to show breadcrumb
        return null;
    }

    return (
        <nav className="flex items-center gap-2 text-sm mb-4">
            {path.map((item, index) => (
                <span key={item.id || "root"} className="flex items-center gap-2">
                    {index > 0 && (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                    )}
                    {index < path.length - 1 ? (
                        <button
                            onClick={() => onNavigate(item.id)}
                            className="text-gray-500 hover:text-sky-600 transition-colors"
                        >
                            {item.name}
                        </button>
                    ) : (
                        <span className="text-gray-900 font-medium">{item.name}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}

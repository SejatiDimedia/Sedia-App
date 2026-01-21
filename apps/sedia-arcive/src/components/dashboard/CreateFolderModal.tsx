import { useState } from "react";

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    parentId: string | null;
}

export default function CreateFolderModal({ isOpen, onClose, onCreated, parentId }: CreateFolderModalProps) {
    const [name, setName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsCreating(true);
        setError(null);

        try {
            const response = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), parentId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create folder");
            }

            setName("");
            onCreated();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create folder");
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Folder</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Folder name"
                        autoFocus
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    />

                    {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating || !name.trim()}
                            className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isCreating && (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

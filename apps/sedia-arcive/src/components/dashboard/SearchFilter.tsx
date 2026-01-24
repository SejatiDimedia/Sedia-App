import { useState, useRef, useEffect } from "react";

interface FilterState {
    type: string;
    starred: boolean;
    date: string;
}

interface SearchFilterProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
}

export default function SearchFilter({ filters, onChange }: SearchFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (key: keyof FilterState, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    const activeFilterCount = (filters.type !== 'all' ? 1 : 0) + (filters.starred ? 1 : 0) + (filters.date !== 'all' ? 1 : 0);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-lg transition-colors border ${isOpen || activeFilterCount > 0
                    ? "bg-sky-50 border-sky-200 text-sky-600"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                title="Search Filters"
            >
                <div className="relative">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-500 rounded-full border-2 border-white" />
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Filters</h3>

                    {/* File Type */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">File Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => handleChange("type", e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="all">All Items</option>
                            <option value="folder">Folders</option>
                            <option value="image">Images</option>
                            <option value="video">Videos</option>
                            <option value="audio">Audio</option>
                            <option value="document">Documents</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Date Modified</label>
                        <select
                            value={filters.date}
                            onChange={(e) => handleChange("date", e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="all">Any time</option>
                            <option value="today">Today</option>
                            <option value="week">Past Week</option>
                            <option value="month">Past Month</option>
                            <option value="year">Past Year</option>
                        </select>
                    </div>

                    {/* Starred Toggle */}
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm text-gray-700">Starred Only</label>
                        <button
                            onClick={() => handleChange("starred", !filters.starred)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${filters.starred ? "bg-sky-500" : "bg-gray-200"}`}
                        >
                            <span className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${filters.starred ? "translate-x-5" : ""}`} />
                        </button>
                    </div>

                    {/* Reset */}
                    <button
                        onClick={() => onChange({ type: "all", starred: false, date: "all" })}
                        className="w-full text-xs text-center text-gray-500 hover:text-gray-900 py-1"
                    >
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
    );
}

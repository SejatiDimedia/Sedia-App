import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export default function SearchDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Toggle on Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search Logic (Debounced)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
            <div className="w-full max-w-2xl bg-white border-4 border-black neo-shadow-lg p-0 flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>

                <div className="p-4 border-b-2 border-black flex items-center gap-4">
                    <Search className="text-zinc-400" size={24} />
                    <input
                        ref={inputRef}
                        className="flex-1 text-xl font-bold font-mono focus:outline-none placeholder:text-zinc-400 uppercase"
                        placeholder="Search articles or topics..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button onClick={() => setIsOpen(false)} className="px-2 font-bold hover:bg-red-100">ESC</button>
                </div>

                {/* Results */}
                <div className="overflow-y-auto p-2 bg-zinc-50 flex-1">
                    {loading && <div className="p-4 text-center opacity-50 font-mono">Searching...</div>}

                    {!loading && results.length === 0 && query.length >= 2 && (
                        <div className="p-4 text-center opacity-50 font-mono">No results found.</div>
                    )}

                    {!loading && results.map((item) => (
                        <a
                            key={`${item.type}-${item.id}`}
                            href={item.url}
                            className="block p-4 border-2 border-transparent hover:border-black hover:bg-white hover:neo-shadow mb-2 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg leading-none group-hover:text-blue-600 font-sans">{item.title}</h4>
                                    <p className="text-xs font-mono opacity-50 mt-1 uppercase">{item.subtitle}</p>
                                </div>
                                <span className="text-[10px] bg-black text-white px-2 py-1 uppercase">{item.type}</span>
                            </div>
                        </a>
                    ))}
                </div>

                <div className="p-2 border-t-2 border-black bg-yellow-300 text-xs font-bold font-mono text-center">
                    PRESS ENTER TO SELECT • ESC TO CLOSE
                </div>
            </div>
        </div>
    );
}

// Global Trigger Button Component
export function SearchTrigger() {
    return (
        <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex items-center gap-2 border-2 border-black bg-white px-4 py-2 hover:bg-yellow-200 transition-all neo-shadow active:translate-y-1 active:shadow-none w-full"
        >
            <Search size={18} />
            <span className="font-bold text-sm">Search</span>
            <kbd className="hidden md:inline-block text-[10px] font-mono bg-black text-white px-1 ml-auto">⌘K</kbd>
        </button>
    );
}

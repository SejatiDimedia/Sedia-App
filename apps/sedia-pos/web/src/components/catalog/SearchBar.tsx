"use client";

import { Search, X } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Suspense, useState } from "react";

function SearchBarContent({ placeholder }: { placeholder: string }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [value, setValue] = useState(searchParams?.get("q") || "");

    const handleSearch = useDebouncedCallback((term) => {
        const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);

    const handleClear = () => {
        setValue("");
        handleSearch("");
    };

    return (
        <div className="relative w-full group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors">
                <Search className="w-5 h-5" />
            </div>
            <input
                className="w-full rounded-2xl border-2 border-zinc-100 bg-zinc-50 py-3.5 pl-12 pr-12 text-base font-medium outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:shadow-lg transition-all duration-300"
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    handleSearch(e.target.value);
                }}
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-500 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

export function SearchBar(props: { placeholder: string }) {
    return (
        <Suspense fallback={<div className="h-14 w-full animate-pulse bg-zinc-100 rounded-2xl" />}>
            <SearchBarContent {...props} />
        </Suspense>
    );
}

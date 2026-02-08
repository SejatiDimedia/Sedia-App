"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Outlet {
    id: string;
    name: string;
}

export function DashboardFilter({ outlets }: { outlets: Outlet[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedOutletId = searchParams.get("outletId") || "";

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set("outletId", value);
        } else {
            params.delete("outletId");
        }
        router.push(`/dashboard?${params.toString()}`);
    };

    return (
        <select
            value={selectedOutletId}
            onChange={handleChange}
            className="w-full sm:w-auto rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
            <option value="">Semua Outlet</option>
            {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                </option>
            ))}
        </select>
    );
}

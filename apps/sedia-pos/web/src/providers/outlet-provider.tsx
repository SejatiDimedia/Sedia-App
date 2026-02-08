"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { setActiveOutletCookie } from "@/actions/outlets";

interface Outlet {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    ownerId?: string | null;
    [key: string]: any;
}

interface OutletContextType {
    outlets: Outlet[];
    activeOutlet: Outlet | null;
    activeOutletId: string;
    switchOutlet: (outletId: string) => Promise<void>;
    updateOutlet: (id: string, data: Partial<Outlet>) => void;
    isLoading: boolean;
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

export function OutletProvider({
    children,
    initialOutlets = [],
    initialActiveId,
}: {
    children: React.ReactNode;
    initialOutlets: Outlet[];
    initialActiveId?: string;
}) {
    const router = useRouter();
    const [outlets, setOutlets] = useState<Outlet[]>(initialOutlets);
    const [activeOutletId, setActiveOutletId] = useState<string>(
        initialActiveId || (initialOutlets.length > 0 ? initialOutlets[0].id : "")
    );
    const [isLoading, setIsLoading] = useState(false);

    // Sync state with server-side prop updates (e.g. after revalidatePath)
    useEffect(() => {
        setOutlets(initialOutlets);
    }, [initialOutlets]);

    // Derived active outlet object
    const activeOutlet = outlets.find((o) => o.id === activeOutletId) || null;

    // Client-side auto-select active or fallback if invalid/missing
    useEffect(() => {
        const isValid = outlets.some(o => o.id === activeOutletId);

        // If no ID or ID is invalid (stale cookie from other account), switch to first available
        if ((!activeOutletId || !isValid) && outlets.length > 0) {
            const firstId = outlets[0].id;
            setActiveOutletId(firstId);
            setActiveOutletCookie(firstId);
        }
    }, [activeOutletId, outlets]);

    const switchOutlet = async (outletId: string) => {
        if (outletId === activeOutletId) return;

        setIsLoading(true);
        try {
            // 1. Update server-side cookie
            await setActiveOutletCookie(outletId);

            // 2. Update local state
            setActiveOutletId(outletId);

            // 3. Refresh router to re-fetch server components if needed
            router.refresh();

            toast.success("Outlet berhasil diganti");
        } catch (error) {
            console.error("Failed to switch outlet:", error);
            toast.error("Gagal mengganti outlet");
        } finally {
            setIsLoading(false);
        }
    };

    const updateOutlet = (id: string, data: Partial<Outlet>) => {
        setOutlets(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
    };

    return (
        <OutletContext.Provider
            value={{
                outlets,
                activeOutlet,
                activeOutletId,
                switchOutlet,
                updateOutlet,
                isLoading,
            }}
        >
            {children}
        </OutletContext.Provider>
    );
}

export function useOutlet() {
    const context = useContext(OutletContext);
    if (context === undefined) {
        throw new Error("useOutlet must be used within an OutletProvider");
    }
    return context;
}

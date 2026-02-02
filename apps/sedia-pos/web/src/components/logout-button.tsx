"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
    className?: string;
    children?: React.ReactNode;
}

export default function LogoutButton({ className, children }: LogoutButtonProps) {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    };

    return (
        <button onClick={handleLogout} className={className}>
            {children || "Keluar"}
        </button>
    );
}

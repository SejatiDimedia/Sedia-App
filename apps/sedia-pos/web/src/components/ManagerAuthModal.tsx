"use client";

import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

interface ManagerAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    outletId: string;
    actionDescription: string;
}

export default function ManagerAuthModal({
    isOpen,
    onClose,
    onSuccess,
    outletId,
    actionDescription,
}: ManagerAuthModalProps) {
    const [pin, setPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (pin.length !== 6) {
            setError("PIN harus 6 digit");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/employees/verify-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ outletId, pinCode: pin }),
            });

            if (!res.ok) {
                setError("PIN Salah.");
                setIsLoading(false);
                return;
            }

            const { employee } = await res.json();
            const role = employee?.role?.toLowerCase() || "";

            if (role === "manager" || role === "owner" || role === "admin") {
                setPin("");
                onSuccess();
            } else if (employee) {
                setError("Hanya Manager/Owner yang diizinkan.");
            } else {
                setError("PIN tidak valid.");
            }
        } catch (err) {
            setError("Gagal memverifikasi PIN.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-6 flex flex-col items-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <ShieldAlert className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Otorisasi Manager</h3>
                    <p className="mt-2 text-center text-sm text-gray-500">{actionDescription}</p>
                </div>

                <div className="mb-6">
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => {
                            setError(null);
                            setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
                        }}
                        placeholder="Masukkan PIN 6 Digit"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-2xl font-bold tracking-[8px] text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        autoFocus
                    />
                    {error && (
                        <p className="mt-2 text-center text-sm font-medium text-red-600">{error}</p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setPin("");
                            setError(null);
                            onClose();
                        }}
                        className="flex-1 rounded-xl bg-gray-100 py-3 font-semibold text-gray-700 hover:bg-gray-200"
                        disabled={isLoading}
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        disabled={isLoading || pin.length !== 6}
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Approve"}
                    </button>
                </div>
            </div>
        </div>
    );
}

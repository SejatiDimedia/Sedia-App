"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
    variant?: "primary" | "danger" | "warning";
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isLoading = false,
    confirmText = "Konfirmasi",
    cancelText = "Batal",
    variant = "primary"
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const getVariantClasses = () => {
        switch (variant) {
            case "danger":
                return "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500";
            case "warning":
                return "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500";
            case "primary":
            default:
                return "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                    <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
                    <button
                        onClick={onCancel}
                        className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex gap-4">
                        <div className={`mt-0.5 flex-none rounded-full p-2 ${variant === 'danger' ? 'bg-red-100 text-red-600' :
                                variant === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-primary-100 text-primary-600'
                            }`}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-600 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 bg-zinc-50 px-6 py-4">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 disabled:opacity-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 transition-colors shadow-sm ${getVariantClasses()}`}
                    >
                        {isLoading ? "Memproses..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

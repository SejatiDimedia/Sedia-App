"use client";

import { AlertTriangle, X, Info, Trash2, AlertCircle } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
    variant?: "primary" | "danger" | "warning" | "info";
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

    const getVariantConfig = () => {
        switch (variant) {
            case "danger":
                return {
                    icon: Trash2,
                    iconBg: "bg-red-50",
                    iconColor: "text-red-500",
                    buttonBg: "bg-red-500 hover:bg-red-600 focus:ring-red-500/20 text-white",
                    ringColor: "ring-red-500/10"
                };
            case "warning":
                return {
                    icon: AlertTriangle,
                    iconBg: "bg-amber-50",
                    iconColor: "text-amber-500",
                    buttonBg: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/20 text-white",
                    ringColor: "ring-amber-500/10"
                };
            case "info":
                return {
                    icon: Info,
                    iconBg: "bg-blue-50",
                    iconColor: "text-blue-500",
                    buttonBg: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/20 text-white",
                    ringColor: "ring-blue-500/10"
                };
            case "primary":
            default:
                return {
                    icon: AlertCircle,
                    iconBg: "bg-secondary-50",
                    iconColor: "text-secondary-500",
                    buttonBg: "bg-secondary-500 hover:bg-secondary-600 focus:ring-secondary-500/20 text-zinc-900",
                    ringColor: "ring-secondary-500/10"
                };
        }
    };

    const config = getVariantConfig();
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => !isLoading && onCancel()}
            />

            <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ring-8 ${config.ringColor} ${config.iconBg}`}>
                        <Icon className={`h-7 w-7 ${config.iconColor}`} />
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-zinc-900">
                        {title}
                    </h3>
                    <p className="mb-8 text-sm leading-relaxed text-zinc-500">
                        {message}
                    </p>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-[1.5] flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-[0.98] focus:outline-none focus:ring-4 disabled:opacity-50 ${config.buttonBg}`}
                    >
                        {isLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : null}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

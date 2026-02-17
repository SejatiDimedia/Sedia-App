import React, { useState, useEffect, createContext, useContext } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 4000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Listen for custom events from vanilla JS
    useEffect(() => {
        const handler = (e: any) => {
            const { msg, type } = e.detail;
            showToast(msg, type);
        };
        window.addEventListener("neo-toast", handler);
        return () => window.removeEventListener("neo-toast", handler);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <NeoToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Fallback for non-React context environments if needed
        return {
            showToast: (msg: string, type: ToastType) => {
                console.warn("useToast must be used within a ToastProvider");
                // We could dispatch a custom event here for Astro pages
                window.dispatchEvent(new CustomEvent("neo-toast", { detail: { msg, type } }));
            }
        };
    }
    return context;
}

function NeoToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const icons = {
        success: <CheckCircle2 size={20} className="text-green-600" />,
        error: <AlertCircle size={20} className="text-red-600" />,
        info: <Info size={20} className="text-blue-600" />,
    };

    const colors = {
        success: "border-green-600 shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]",
        error: "border-red-600 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]",
        info: "border-blue-600 shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]",
    };

    return (
        <div
            className={`pointer-events-auto flex items-center gap-3 p-4 bg-white border-2 border-black ${colors[toast.type]} neo-shadow-sm min-w-[300px] max-w-md animate-in slide-in-from-right-full duration-300 transition-all`}
        >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 font-bold text-sm uppercase tracking-tight">{toast.message}</div>
            <button
                onClick={() => onRemove(toast.id)}
                className="p-1 hover:bg-zinc-100 rounded transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
}

// Global helper to trigger toast from anywhere (including Astro scripts)
export const toast = {
    success: (msg: string) => window.dispatchEvent(new CustomEvent("neo-toast", { detail: { msg, type: "success" } })),
    error: (msg: string) => window.dispatchEvent(new CustomEvent("neo-toast", { detail: { msg, type: "error" } })),
    info: (msg: string) => window.dispatchEvent(new CustomEvent("neo-toast", { detail: { msg, type: "info" } })),
};

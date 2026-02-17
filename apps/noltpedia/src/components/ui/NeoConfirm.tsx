import React, { useState, createContext, useContext, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

    const confirm = (opts: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setOptions(opts);
            setResolveCallback(() => resolve);
        });
    };

    const handleConfirm = () => {
        if (options?.onConfirm) options.onConfirm();
        if (resolveCallback) resolveCallback(true);
        setOptions(null);
        setResolveCallback(null);
    };

    const handleCancel = () => {
        if (options?.onCancel) options.onCancel();
        if (resolveCallback) resolveCallback(false);
        setOptions(null);
        setResolveCallback(null);
    };

    // Listen for custom events from vanilla JS
    useEffect(() => {
        const handler = async (e: any) => {
            const { title, message, variant, confirmText, cancelText, id } = e.detail;
            const result = await confirm({
                title,
                message,
                variant,
                confirmText,
                cancelText,
            });
            window.dispatchEvent(new CustomEvent(`neo-confirm-result-${id}`, { detail: { confirmed: result } }));
        };
        window.addEventListener("neo-confirm", handler);
        return () => window.removeEventListener("neo-confirm", handler);
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <NeoConfirmModal
                isOpen={!!options}
                {...(options || { title: "", message: "" })}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        // Fallback for Astro components that might not be wrapped
        return {
            confirm: neoConfirm
        };
    }
    return context;
}

// Global helper for Astro scripts
export const neoConfirm = (opts: ConfirmOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    window.dispatchEvent(new CustomEvent("neo-confirm", { detail: { ...opts, id } }));
    return new Promise<boolean>((resolve) => {
        const handler = (e: any) => {
            window.removeEventListener(`neo-confirm-result-${id}`, handler);
            resolve(e.detail.confirmed);
        };
        window.addEventListener(`neo-confirm-result-${id}`, handler);
    });
};

function NeoConfirmModal({
    isOpen,
    title,
    message,
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    onConfirm,
    onCancel,
    variant = "danger",
}: any) {
    if (!isOpen) return null;

    const variantClasses: Record<string, string> = {
        danger: "bg-red-500 text-white",
        warning: "bg-yellow-400 text-black",
        info: "bg-blue-500 text-white",
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform transition-all animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`p-4 border-b-4 border-black flex items-center justify-between ${variantClasses[variant] || variantClasses.danger}`}>
                    <div className="flex items-center gap-2">
                        <AlertCircle size={20} className="stroke-[3px]" />
                        <h3 className="font-black uppercase tracking-tight">{title}</h3>
                    </div>
                    <button onClick={onCancel} className="p-1 hover:bg-black/10 rounded-full"><X size={20} className="stroke-[3px]" /></button>
                </div>
                <div className="p-6">
                    <p className="font-bold text-zinc-900 leading-relaxed">{message}</p>
                </div>
                <div className="p-4 bg-zinc-50 border-t-4 border-black flex flex-col md:flex-row gap-3">
                    <button onClick={onConfirm} className={`neo-btn flex-1 py-3 font-black uppercase text-sm ${variant === 'danger' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-yellow-400 text-black hover:bg-yellow-500'}`}>
                        {confirmText}
                    </button>
                    <button onClick={onCancel} className="neo-btn flex-1 py-3 bg-white text-black font-black uppercase text-sm hover:bg-zinc-100">
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}

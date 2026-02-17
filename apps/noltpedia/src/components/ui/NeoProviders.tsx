import React from "react";
import { ToastProvider } from "./NeoToast";
import { ConfirmProvider } from "./NeoConfirm";

export default function NeoProviders({ children }: { children: React.ReactNode }) {
    return (
        <ConfirmProvider>
            <ToastProvider>
                {children}
            </ToastProvider>
        </ConfirmProvider>
    );
}

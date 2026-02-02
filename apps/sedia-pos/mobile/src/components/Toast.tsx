import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
    id: string;
    title: string;
    message?: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (title: string, message?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = (title: string, message?: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, title, message, type }]);

        // Auto dismiss after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'close-circle';
            case 'warning': return 'alert-circle';
            case 'info': return 'information';
        }
    };

    const getColor = (type: ToastType) => {
        switch (type) {
            case 'success': return '#22c55e';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'info': return '#3b82f6';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <View
                style={{
                    position: 'absolute',
                    top: 60,
                    left: 16,
                    right: 16,
                    zIndex: 9999,
                    pointerEvents: 'box-none'
                }}
            >
                {toasts.map((toast) => (
                    <TouchableOpacity
                        key={toast.id}
                        onPress={() => removeToast(toast.id)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'white',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 12,
                            elevation: 8,
                            borderLeftWidth: 4,
                            borderLeftColor: getColor(toast.type),
                        }}
                    >
                        <MaterialCommunityIcons
                            name={getIcon(toast.type) as any}
                            size={24}
                            color={getColor(toast.type)}
                        />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ fontWeight: '600', color: '#18181b', fontSize: 14 }}>
                                {toast.title}
                            </Text>
                            {toast.message && (
                                <Text style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>
                                    {toast.message}
                                </Text>
                            )}
                        </View>
                        <MaterialCommunityIcons name="close" size={18} color="#a1a1aa" />
                    </TouchableOpacity>
                ))}
            </View>
        </ToastContext.Provider>
    );
}

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Pressable, Dimensions, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEmployeeStore } from '../store/employeeStore';
import { useAuthStore } from '../store/authStore';
import { useOutletStore } from '../store/outletStore';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.8, 300);

import { API_URL } from '../config/api';

console.log('[Drawer] Initialized with API_URL:', API_URL);

interface DrawerProps {
    visible: boolean;
    onClose: () => void;
    currentScreen: string;
    onNavigate: (screen: any) => void;
    onLogout: () => void;
}

export default function Drawer({ visible, onClose, currentScreen, onNavigate, onLogout }: DrawerProps) {
    const { currentEmployee } = useEmployeeStore();
    const { user } = useAuthStore();
    const { currentOutlet, outlets, switchOutlet } = useOutletStore();
    const [outletsVisible, setOutletsVisible] = React.useState(false);

    const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    const [shouldRender, setShouldRender] = React.useState(visible);

    const pendingRouteRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        console.log('[Drawer] Visible prop:', visible, 'shouldRender:', shouldRender);
        if (visible) {
            setShouldRender(true);
            // Reset animations to start position before starting opening animation
            slideAnim.setValue(-DRAWER_WIDTH);
            fadeAnim.setValue(0);

            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setShouldRender(false);
                setOutletsVisible(false);

                // Execute pending navigation after animation finishes
                if (pendingRouteRef.current) {
                    onNavigate(pendingRouteRef.current);
                    pendingRouteRef.current = null;
                }
            });
        }
    }, [visible]);

    // Only bail if we are truly not supposed to render and not visible
    if (!shouldRender && !visible) return null;

    // Role and Permission logic (Parity with Web Dashboard)
    // 1. Get role from current employee (PIN login) or user session (Global login)
    const rawRole = (currentEmployee?.role || user?.role || '').toLowerCase().trim();
    const roleName = rawRole || 'user';
    const roleId = currentEmployee?.roleId || user?.roleId;
    const permissions = currentEmployee?.permissions || user?.permissions || [];

    // 2. Admin/Owner Bypass
    // Foolproof owner check: direct match with outlet ownerId
    const isOwner = user?.id === currentOutlet?.ownerId;
    const isOwnerOrAdmin = isOwner || roleName === 'owner' || roleName === 'admin';

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'view-dashboard', permission: 'any' },
        { id: 'pos', label: 'Kasir (POS)', icon: 'calculator-variant', permission: 'access_pos' },
        { id: 'outlets', label: 'Outlet', icon: 'store-settings', permission: 'manage_outlets' },
        { id: 'employees', label: 'Karyawan', icon: 'account-tie', permission: 'manage_employees' },
        { id: 'products', label: 'Produk', icon: 'package-variant', permission: 'manage_products' },
        { id: 'categories', label: 'Kategori', icon: 'shape-outline', permission: 'manage_products' },
        { id: 'inventory', label: 'Inventaris', icon: 'warehouse', permission: 'manage_inventory' },
        { id: 'suppliers', label: 'Supplier', icon: 'truck-delivery', permission: 'manage_suppliers' },
        { id: 'purchase_orders', label: 'Purchase Orders', icon: 'file-document-edit', permission: 'manage_purchase_orders' },
        { id: 'stock_opname', label: 'Stock Opname', icon: 'clipboard-list', permission: 'manage_stock_opname' },
        { id: 'transactions', label: 'Transaksi', icon: 'history', permission: 'access_pos' },
        { id: 'activity', label: 'Log Aktivitas', icon: 'history', permission: 'view_reports' },
        { id: 'customers', label: 'Pelanggan', icon: 'account-group', permission: 'manage_customers' },
        { id: 'shifts', label: 'Laporan Shift', icon: 'clock-outline', permission: 'view_reports' },
        { id: 'reports', label: 'Laporan', icon: 'chart-bar', permission: 'view_reports' },
        { id: 'tax', label: 'Pajak & Biaya', icon: 'percent', permission: 'manage_tax' },
        { id: 'settings', label: 'Pengaturan', icon: 'cog-outline', permission: 'any' },
    ];

    const hasPermission = (item: any) => {
        if (item.id === 'dashboard') return true;

        // 1. Owner/Admin Bypass
        if (isOwnerOrAdmin) return true;

        // Special restriction for Activity Log (Admin/Owner only, just like Web)
        if (item.id === 'activity' && roleName !== 'admin' && roleName !== 'owner') {
            return false;
        }

        // 2. Dynamic Permission Check (Highest priority for custom roles)
        // Check if we have a roleId OR existing permissions
        if (roleId || permissions.length > 0) {
            if (item.permission === 'any') return true;
            return permissions.includes(item.permission);
        }

        // 3. Fallback to Legacy Roles (only if no dynamic permissions or not using dynamic roleId)

        if (roleName === 'cashier' || roleName === 'kasir') {
            const allowedForCashier = ['pos', 'transactions'];
            return allowedForCashier.includes(item.id);
        }

        // Catch-all: If at an outlet, allow basic POS and Transactions
        if (currentOutlet && (item.id === 'pos' || item.id === 'transactions')) return true;

        return false;
    };

    const filteredItems = menuItems.filter(hasPermission);



    return (
        <Modal
            visible={shouldRender || visible} // Use direct visible prop for Modal, but keep internal shouldRender/animations if needed, or simplify?
            // Actually, with Modal, we can rely on it being on top.
            // But we need to handle enter/exit animations nicely.
            transparent={true}
            animationType="none" // We manage animation ourselves
            onRequestClose={onClose}
            statusBarTranslucent={true} // Allow drawing over status bar
        >
            <View className="flex-1 flex-row">
                {/* Backdrop */}
                <Animated.View
                    style={{ opacity: fadeAnim }}
                    className="absolute inset-0 bg-black/40"
                >
                    <Pressable className="flex-1" onPress={onClose} />
                </Animated.View>

                {/* Content */}
                <Animated.View
                    style={{
                        transform: [{ translateX: slideAnim }],
                        width: DRAWER_WIDTH,
                        backgroundColor: '#ffffff', // Solid white for drawer background
                        zIndex: 100,
                        elevation: 10
                    }}
                    className="h-full"
                >
                    <View className="flex-1 pt-12">
                        {/* User Profile Header */}
                        <View className="px-6 pb-6 border-b border-secondary-100/50">
                            <View className="flex-row items-center justify-between mb-4">
                                <View
                                    className="h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
                                    style={{
                                        backgroundColor: currentOutlet?.secondaryColor || '#f5c23c',
                                        shadowColor: currentOutlet?.secondaryColor || '#f5c23c'
                                    }}
                                >
                                    <Text
                                        className="text-xl font-bold"
                                        style={{ color: '#18181b' }}
                                    >
                                        {currentEmployee?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'S'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="h-10 w-10 items-center justify-center rounded-full bg-secondary-100/50"
                                >
                                    <MaterialCommunityIcons name="chevron-left" size={24} color="#614704" />
                                </TouchableOpacity>
                            </View>

                            <Text className="text-lg font-black text-secondary-900 tracking-tight" numberOfLines={1}>
                                {currentEmployee?.name || user?.name || 'User'}
                            </Text>
                            <Text className="text-[11px] text-secondary-600/70 font-bold uppercase tracking-widest mt-0.5">
                                {user?.email}
                            </Text>

                            {/* Outlet Selector */}
                            <TouchableOpacity
                                onPress={() => outlets.length > 1 && setOutletsVisible(!outletsVisible)}
                                activeOpacity={outlets.length > 1 ? 0.7 : 1}
                                className={`mt-4 flex-row items-center p-3 rounded-xl border ${!outletsVisible ? 'bg-white/50' : 'bg-white'}`}
                                style={{
                                    borderColor: outletsVisible ? (currentOutlet?.secondaryColor || '#f5c23c') : '#e4e4e7'
                                }}
                            >
                                <View
                                    className="h-8 w-8 items-center justify-center rounded-lg mr-3"
                                    style={{ backgroundColor: (currentOutlet?.secondaryColor || '#f5c23c') + '20' }}
                                >
                                    <MaterialCommunityIcons name="store" size={18} color={currentOutlet?.secondaryColor || "#c28f09"} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Outlet Aktif</Text>
                                    <Text className="text-sm font-bold text-zinc-900 leading-tight" numberOfLines={1}>
                                        {currentOutlet?.name || 'Pilih Outlet'}
                                    </Text>
                                </View>
                                {outlets.length > 1 && (
                                    <MaterialCommunityIcons
                                        name={outletsVisible ? "chevron-up" : "chevron-down"}
                                        size={18}
                                        color={currentOutlet?.secondaryColor || "#916b07"}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Outlet List Dropdown (Conditional) */}
                        {outletsVisible && (
                            <View className="bg-white border-b border-zinc-100 max-h-48">
                                <ScrollView>
                                    {(outlets || []).map((outlet) => (
                                        <TouchableOpacity
                                            key={outlet.id}
                                            onPress={() => {
                                                switchOutlet(outlet.id);
                                                setOutletsVisible(false);
                                            }}
                                            className={`px-6 py-3 flex-row items-center border-b border-zinc-50 last:border-0`}
                                            style={{ backgroundColor: currentOutlet?.id === outlet.id ? (currentOutlet?.secondaryColor || '#f5c23c') + '15' : 'transparent' }}
                                        >
                                            <View
                                                className={`h-2 w-2 rounded-full mr-3`}
                                                style={{ backgroundColor: currentOutlet?.id === outlet.id ? (currentOutlet?.secondaryColor || '#f5c23c') : '#e4e4e7' }}
                                            />
                                            <Text className={`text-sm font-bold ${currentOutlet?.id === outlet.id ? 'text-zinc-900' : 'text-zinc-500'}`}>
                                                {outlet.name}
                                            </Text>
                                            {currentOutlet?.id === outlet.id && (
                                                <MaterialCommunityIcons name="check" size={16} color={currentOutlet?.secondaryColor || "#c28f09"} className="ml-auto" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Navigation Menu */}
                        <ScrollView className="flex-1 px-4 py-6">
                            {filteredItems.map((item) => {
                                const isActive = currentScreen === item.id;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => {
                                            pendingRouteRef.current = item.id;
                                            onClose();
                                        }}
                                        className={`mb-2 flex-row items-center gap-4 rounded-2xl px-4 py-4 ${isActive ? 'bg-white shadow-sm' : 'active:bg-zinc-100/50'}`}
                                    >
                                        <View
                                            className={`h-10 w-10 items-center justify-center rounded-xl`}
                                            style={{ backgroundColor: isActive ? (currentOutlet?.secondaryColor || '#f5c23c') : (currentOutlet?.secondaryColor || '#f5c23c') + '15' }}
                                        >
                                            <MaterialCommunityIcons
                                                name={item.icon as any}
                                                size={20}
                                                color={isActive ? '#18181b' : (currentOutlet?.secondaryColor || '#916b07')}
                                            />
                                        </View>
                                        <Text className={`text-base font-bold ${isActive ? 'text-zinc-900' : 'text-zinc-600'}`}>
                                            {item.label}
                                        </Text>
                                        {isActive && (
                                            <View className="ml-auto">
                                                <MaterialCommunityIcons name="chevron-right" size={20} color={currentOutlet?.secondaryColor || "#c28f09"} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Footer / Logout */}
                        <View className="p-6 border-t border-secondary-100/50">
                            <TouchableOpacity
                                onPress={() => {
                                    onClose();
                                    onLogout();
                                }}
                                className="flex-row items-center gap-4 rounded-2xl px-4 py-4 bg-red-50 active:bg-red-100"
                            >
                                <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                                    <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
                                </View>
                                <Text className="text-base font-bold text-red-600">
                                    Logout
                                </Text>
                            </TouchableOpacity>

                            <Text className="mt-4 text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                                Sedia POS • v1.0.0
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

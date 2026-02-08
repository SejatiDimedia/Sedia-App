import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

const { width } = Dimensions.get('window');

interface DashboardScreenProps {
    onNavigate: (screen: any) => void;
    onOpenDrawer: () => void;
}

interface DashboardStats {
    totalSales: number;
    transactionCount: number;
    totalProducts: number;
    totalCustomers: number;
    topProducts: { name: string; quantity: number; revenue: number }[];
    recentTransactions: any[];
}

export default function DashboardScreen({ onNavigate, onOpenDrawer }: DashboardScreenProps) {
    const { currentOutlet } = useOutletStore();
    const { token } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        if (!currentOutlet || !token) return;

        try {
            // 1. Fetch Summary Stats (No date filters to get All-Time)
            const summaryRes = await fetch(
                `${API_URL}/reports/summary?outletId=${currentOutlet.id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // 2. Fetch Top Products (Today)
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const topProductsRes = await fetch(
                `${API_URL}/reports/top-products?outletId=${currentOutlet.id}&startDate=${dateStr}&endDate=${dateStr}&limit=3`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // 3. Fetch Recent Transactions
            const recentTransactionsRes = await fetch(
                `${API_URL}/transactions?outletId=${currentOutlet.id}&limit=5`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (summaryRes.ok && topProductsRes.ok && recentTransactionsRes.ok) {
                const summaryData = await summaryRes.json();
                const topProductsData = await topProductsRes.json();
                const recentTransactionsData = await recentTransactionsRes.json();

                setStats({
                    totalSales: summaryData.totalRevenue || 0,
                    transactionCount: summaryData.transactionCount || 0,
                    totalProducts: summaryData.totalProducts || 0,
                    totalCustomers: summaryData.totalCustomers || 0,
                    topProducts: topProductsData || [],
                    recentTransactions: recentTransactionsData || []
                });
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [currentOutlet]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const StatCard = ({ icon, label, value, color, isLoading, isCurrency }: { icon: any, label: string, value: any, color: string, isLoading: boolean, isCurrency?: boolean }) => {
        const isHex = color.startsWith('#');
        // If color is hex, use it for icon color. If it's 'primary', use dynamic primary.
        const iconColor = isHex ? color : (color === 'primary' ? (currentOutlet?.primaryColor || '#377f7e') : color);
        // Background color logic: if hex, apply opacity. If class, rely on string replacement or new logic.

        return (
            <View className="bg-white rounded-3xl p-5 w-[48%] mb-4 border border-zinc-100 shadow-sm">
                <View className="flex-row justify-between items-start mb-4">
                    <View
                        className={`${!isHex ? color.replace('text-', 'bg-').replace('600', '50') : 'rounded-xl'} p-2`}
                        style={isHex ? { backgroundColor: color + '10' } : {}}
                    >
                        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
                    </View>
                    {isLoading && <ActivityIndicator size="small" color={currentOutlet?.primaryColor || '#377f7e'} />}
                </View>
                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</Text>
                <Text className="text-zinc-900 text-lg font-black" numberOfLines={1}>
                    {isCurrency ? `Rp ${value.toLocaleString('id-ID')}` : value.toLocaleString('id-ID')}
                </Text>
            </View>
        )
    };

    const QuickAction = ({ icon, label, route, color }: { icon: any, label: string, route: string, color: string }) => {
        const isHex = color.startsWith('#');
        return (
            <TouchableOpacity
                onPress={() => onNavigate(route)}
                className="items-center justify-center bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 w-[46%] mb-4"
            >
                <View
                    className={`h-12 w-12 rounded-full items-center justify-center mb-2 ${!isHex ? color : ''}`}
                    style={isHex ? { backgroundColor: color } : {}}
                >
                    <MaterialCommunityIcons name={icon} size={24} color="white" />
                </View>
                <Text className="font-bold text-zinc-800 text-center">{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-zinc-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-14 pb-4 bg-white border-b border-zinc-100">
                <View>
                    <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Lokasi</Text>
                    <View className="flex-row items-center gap-1">
                        <MaterialCommunityIcons name="store-marker" size={16} color={currentOutlet?.primaryColor || "#377f7e"} />
                        <Text className="text-lg font-black text-zinc-900">{currentOutlet?.name || 'Pilih Outlet'}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={onOpenDrawer}
                    className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50"
                >
                    <MaterialCommunityIcons name="menu" size={24} color={currentOutlet?.primaryColor || "#18181b"} />
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Main Stats Grid */}
                <Text className="text-lg font-bold text-zinc-900 mb-4">Statistik Toko</Text>
                <View className="flex-row flex-wrap justify-between">
                    <StatCard
                        icon="cash-multiple"
                        label="Total Penjualan"
                        value={stats?.totalSales || 0}
                        color={currentOutlet?.primaryColor || "#377f7e"}
                        isLoading={isLoading}
                        isCurrency
                    />
                    <StatCard
                        icon="receipt"
                        label="Total Transaksi"
                        value={stats?.transactionCount || 0}
                        color="#3b82f6"
                        isLoading={isLoading}
                    />
                    <StatCard
                        icon="package-variant-closed"
                        label="Total Produk"
                        value={stats?.totalProducts || 0}
                        color="#f59e0b"
                        isLoading={isLoading}
                    />
                    <StatCard
                        icon="account-group"
                        label="Total Pelanggan"
                        value={stats?.totalCustomers || 0}
                        color="#8b5cf6"
                        isLoading={isLoading}
                    />
                </View>

                {/* Top Products Section */}
                {stats && stats.topProducts.length > 0 && (
                    <View className="mb-6 mt-2">
                        <Text className="text-lg font-bold text-zinc-900 mb-4">Produk Terlaris (Hari Ini)</Text>
                        <View className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm">
                            {stats.topProducts.map((product, index) => (
                                <View
                                    key={index}
                                    className={`flex-row items-center justify-between py-3 ${index !== stats.topProducts.length - 1 ? 'border-b border-zinc-50' : ''}`}
                                >
                                    <View className="flex-row items-center flex-1">
                                        <View className="h-8 w-8 rounded-full bg-orange-100 items-center justify-center mr-3">
                                            <Text className="text-orange-700 font-bold text-xs">{index + 1}</Text>
                                        </View>
                                        <Text className="text-zinc-800 font-bold flex-1" numberOfLines={1}>{product.name}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-zinc-900 font-black">{product.quantity}x</Text>
                                        <Text className="text-zinc-400 text-[10px]">Rp {product.revenue.toLocaleString('id-ID')}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Quick Actions */}
                <Text className="text-lg font-bold text-zinc-900 mb-4 mt-2">Aksi Cepat</Text>

                <View className="flex-row flex-wrap justify-between">
                    <QuickAction
                        icon="calculator-variant"
                        label="Kasir (POS)"
                        route="pos"
                        color={currentOutlet?.primaryColor || "#377f7e"}
                    />
                    <QuickAction
                        icon="package-variant-closed"
                        label="Produk"
                        route="products"
                        color={currentOutlet?.secondaryColor || "#f59e0b"}
                    />
                    <QuickAction
                        icon="history"
                        label="Riwayat"
                        route="transactions"
                        color="#3b82f6"
                    />
                    <QuickAction
                        icon="account-group"
                        label="Pelanggan"
                        route="customers"
                        color="#8b5cf6"
                    />
                </View>

                {/* Recent Activity */}
                <View className="mt-2 mb-10">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-zinc-900">Aktivitas Terkini</Text>
                        <TouchableOpacity onPress={() => onNavigate('transactions')}>
                            <Text className="font-bold text-sm" style={{ color: currentOutlet?.primaryColor || '#377f7e' }}>Lihat Semua</Text>
                        </TouchableOpacity>
                    </View>

                    {stats && stats.recentTransactions.length > 0 ? (
                        <View className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm">
                            {stats.recentTransactions.map((tx, index) => (
                                <View
                                    key={tx.id}
                                    className={`flex-row items-center justify-between p-4 ${index !== stats.recentTransactions.length - 1 ? 'border-b border-zinc-50' : ''}`}
                                >
                                    <View className="flex-row items-center">
                                        <View className="h-10 w-10 rounded-2xl bg-zinc-50 items-center justify-center mr-3">
                                            <MaterialCommunityIcons name="receipt-outline" size={20} color="#71717a" />
                                        </View>
                                        <View>
                                            <Text className="text-zinc-900 font-bold">{tx.invoiceNumber}</Text>
                                            <Text className="text-zinc-400 text-xs">
                                                {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {tx.paymentMethod}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-zinc-900 font-black">
                                        Rp {parseFloat(tx.totalAmount).toLocaleString('id-ID')}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="bg-white rounded-3xl p-8 border border-zinc-100 items-center justify-center shadow-sm">
                            <MaterialCommunityIcons name="clock-outline" size={48} color="#d4d4d8" />
                            <Text className="text-zinc-400 font-bold mt-3">Belum ada aktivitas baru</Text>
                            <Text className="text-zinc-400 text-xs text-center mt-1">Transaksi Anda akan muncul di sini</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

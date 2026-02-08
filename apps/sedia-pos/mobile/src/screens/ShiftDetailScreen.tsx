import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { API_URL } from '../config/api';
import { useAuthStore } from '../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatCurrency = (amount: number | null | undefined): string => {
    const value = Number(amount);
    if (isNaN(value)) return 'Rp 0';
    return `Rp ${value.toLocaleString('id-ID')}`;
};

const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ${formatTime(dateStr)}`;
};

/* --- Types --- */
interface Transaction {
    id: string;
    createdAt: string;
    totalAmount: string;
    paymentMethod: string;
    invoiceNumber: string | null;
}

interface ProductSale {
    productName: string;
    variantName: string | null;
    totalQuantity: number;
    unitPrice: number;
    totalRevenue: number;
}

interface ShiftDetail {
    id: string;
    startTime: string;
    endTime: string | null;
    status: 'open' | 'closed';
    startingCash: string;
    endingCash: string | null;
    difference: string | null;
    employeeName: string | null;
    summary: {
        cashSales: number;
        nonCashSales: number;
        totalSales: number;
        transactionCount: number;
        expectedCash: number;
    };
    transactions: Transaction[];
    productSales: ProductSale[];
}

interface ShiftDetailScreenProps {
    shiftId: string;
    onBack: () => void;
}

type TabType = 'summary' | 'transactions' | 'stock';

export default function ShiftDetailScreen({ shiftId, onBack }: ShiftDetailScreenProps) {
    const { currentOutlet } = useOutletStore();
    const token = useAuthStore((state) => state.token);

    const [shiftDetail, setShiftDetail] = useState<ShiftDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('summary');

    const primaryColor = currentOutlet?.primaryColor || '#3b82f6';

    const fetchShiftDetail = async () => {
        if (!shiftId) return;

        try {
            const res = await fetch(`${API_URL}/shifts/${shiftId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                setShiftDetail(data);
            }
        } catch (error) {
            console.error('Failed to fetch shift detail:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchShiftDetail();
    }, [shiftId]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchShiftDetail();
    }, [shiftId]);

    const renderSummaryTab = () => {
        if (!shiftDetail) return null;
        const s = shiftDetail.summary;
        const difference = parseFloat(shiftDetail.difference || '0');

        return (
            <ScrollView className="p-4">
                <View className="bg-white p-5 rounded-2xl border border-zinc-100 mb-4">
                    <Text className="text-xs font-bold text-zinc-400 uppercase mb-3">Informasi Shift</Text>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-zinc-500">Kasir</Text>
                        <Text className="font-bold text-zinc-900">{shiftDetail.employeeName || 'Unknown'}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-zinc-500">Mulai</Text>
                        <Text className="font-bold text-zinc-900">{formatDate(shiftDetail.startTime)}</Text>
                    </View>
                    {shiftDetail.endTime && (
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-zinc-500">Selesai</Text>
                            <Text className="font-bold text-zinc-900">{formatDate(shiftDetail.endTime)}</Text>
                        </View>
                    )}
                    <View className="flex-row justify-between">
                        <Text className="text-zinc-500">Status</Text>
                        <View className={`px-2 py-1 rounded-lg ${shiftDetail.status === 'open' ? 'bg-green-100' : 'bg-zinc-100'}`}>
                            <Text className={`text-[10px] font-bold ${shiftDetail.status === 'open' ? 'text-green-700' : 'text-zinc-500'} uppercase`}>
                                {shiftDetail.status === 'open' ? 'Aktif' : 'Selesai'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="bg-white p-5 rounded-2xl border border-zinc-100 mb-4">
                    <Text className="text-xs font-bold text-zinc-400 uppercase mb-3">Ringkasan Penjualan</Text>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-zinc-500">Total Transaksi</Text>
                        <Text className="font-bold text-zinc-900">{s.transactionCount} transaksi</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-zinc-500">Penjualan Cash</Text>
                        <Text className="font-bold text-zinc-900">{formatCurrency(s.cashSales)}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-zinc-500">Penjualan Non-Cash</Text>
                        <Text className="font-bold text-zinc-900">{formatCurrency(s.nonCashSales)}</Text>
                    </View>
                    <View className="flex-row justify-between border-t border-zinc-100 pt-2 mt-2">
                        <Text className="text-zinc-900 font-bold">Total Penjualan</Text>
                        <Text className="font-bold text-lg" style={{ color: primaryColor }}>{formatCurrency(s.totalSales)}</Text>
                    </View>
                </View>

                <View className="bg-white p-5 rounded-2xl border border-zinc-100">
                    <Text className="text-xs font-bold text-zinc-400 uppercase mb-3">Rekonsiliasi Kas</Text>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-zinc-500">Modal Awal</Text>
                        <Text className="font-bold text-zinc-900">{formatCurrency(parseFloat(shiftDetail.startingCash))}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-zinc-500">+ Penjualan Cash</Text>
                        <Text className="font-bold text-green-600">+{formatCurrency(s.cashSales)}</Text>
                    </View>
                    <View className="flex-row justify-between border-t border-zinc-100 pt-2 mt-2 mb-2">
                        <Text className="text-zinc-900 font-bold">Kas Diharapkan</Text>
                        <Text className="font-bold text-zinc-900">{formatCurrency(s.expectedCash)}</Text>
                    </View>
                    {shiftDetail.endingCash && (
                        <>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-zinc-500">Kas Aktual</Text>
                                <Text className="font-bold text-zinc-900">{formatCurrency(parseFloat(shiftDetail.endingCash))}</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-zinc-500">Selisih</Text>
                                <Text className={`font-bold ${difference < 0 ? 'text-red-500' : difference > 0 ? 'text-green-500' : 'text-zinc-700'}`}>
                                    {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderTransactionsTab = () => {
        if (!shiftDetail) return null;
        const transactions = shiftDetail.transactions || [];

        if (transactions.length === 0) {
            return (
                <View className="flex-1 items-center justify-center py-20">
                    <MaterialCommunityIcons name="receipt" size={48} color="#d4d4d8" />
                    <Text className="text-zinc-400 mt-2 font-medium">Tidak ada transaksi</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <View className="bg-white p-4 rounded-xl border border-zinc-100 mb-3">
                        <View className="flex-row justify-between items-start mb-2">
                            <View>
                                <Text className="text-xs text-zinc-400 font-mono">{item.invoiceNumber || item.id.slice(0, 8)}</Text>
                                <Text className="text-sm font-bold text-zinc-900">{formatTime(item.createdAt)}</Text>
                            </View>
                            <View className={`px-2 py-1 rounded-lg ${item.paymentMethod?.toLowerCase() === 'cash' ? 'bg-green-100' : 'bg-blue-100'}`}>
                                <Text className={`text-[10px] font-bold uppercase ${item.paymentMethod?.toLowerCase() === 'cash' ? 'text-green-700' : 'text-blue-700'}`}>
                                    {item.paymentMethod || 'Cash'}
                                </Text>
                            </View>
                        </View>
                        <Text className="font-bold text-lg" style={{ color: primaryColor }}>{formatCurrency(parseFloat(item.totalAmount))}</Text>
                    </View>
                )}
            />
        );
    };

    const renderStockTab = () => {
        if (!shiftDetail) return null;
        const sales = shiftDetail.productSales || [];

        if (sales.length === 0) {
            return (
                <View className="flex-1 items-center justify-center py-20">
                    <MaterialCommunityIcons name="package-variant" size={48} color="#d4d4d8" />
                    <Text className="text-zinc-400 mt-2 font-medium">Tidak ada penjualan produk</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={sales}
                keyExtractor={(item, idx) => `${item.productName}-${item.variantName || ''}-${idx}`}
                contentContainerStyle={{ padding: 16 }}
                ListHeaderComponent={
                    <Text className="text-xs text-zinc-500 mb-3">Ringkasan produk terjual selama shift ini:</Text>
                }
                renderItem={({ item }) => (
                    <View className="bg-white p-4 rounded-xl border border-zinc-100 mb-3">
                        <View className="flex-row justify-between items-start">
                            <View className="flex-1 mr-3">
                                <Text className="text-sm font-bold text-zinc-900">
                                    {item.productName}
                                    {item.variantName && (
                                        <Text className="font-normal text-xs text-zinc-500"> ({item.variantName})</Text>
                                    )}
                                </Text>
                                <Text className="text-xs text-zinc-500 mt-1">
                                    @ {formatCurrency(item.unitPrice)} × {item.totalQuantity}
                                </Text>
                            </View>
                            <View className="items-end">
                                <View className="px-2 py-1 rounded-lg bg-red-100 mb-1">
                                    <Text className="text-[10px] font-bold text-red-600 uppercase">
                                        -{item.totalQuantity} terjual
                                    </Text>
                                </View>
                                <Text className="font-bold text-sm" style={{ color: primaryColor }}>
                                    {formatCurrency(item.totalRevenue)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            />
        );
    };

    const tabs: { key: TabType; label: string; icon: any }[] = [
        { key: 'summary', label: 'Ringkasan', icon: 'chart-box-outline' },
        { key: 'transactions', label: 'Transaksi', icon: 'receipt' },
        { key: 'stock', label: 'Penjualan', icon: 'package-variant' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-zinc-50" edges={['top']}>
            <View className="bg-white border-b border-zinc-100 px-5 py-4 flex-row items-center">
                <TouchableOpacity onPress={onBack} className="w-10 h-10 items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 mr-3">
                    <MaterialCommunityIcons name="arrow-left" size={24} color={primaryColor} />
                </TouchableOpacity>
                <Text className="text-lg font-black text-zinc-800 flex-1">Detail Shift</Text>
            </View>

            {/* Tabs */}
            <View className="flex-row bg-white border-b border-zinc-100 px-4">
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key)}
                        className={`flex-1 py-3 items-center border-b-2 ${activeTab === tab.key ? '' : 'border-transparent'}`}
                        style={{ borderBottomColor: activeTab === tab.key ? primaryColor : 'transparent' }}
                    >
                        <MaterialCommunityIcons
                            name={tab.icon}
                            size={20}
                            color={activeTab === tab.key ? primaryColor : '#a1a1aa'}
                        />
                        <Text className={`text-xs font-medium mt-1 ${activeTab === tab.key ? '' : 'text-zinc-400'}`} style={{ color: activeTab === tab.key ? primaryColor : undefined }}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading && !refreshing ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={primaryColor} />
                </View>
            ) : (
                <View className="flex-1">
                    {activeTab === 'summary' && renderSummaryTab()}
                    {activeTab === 'transactions' && renderTransactionsTab()}
                    {activeTab === 'stock' && renderStockTab()}
                </View>
            )}
        </SafeAreaView>
    );
}

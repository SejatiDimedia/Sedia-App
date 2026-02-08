
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, FlatList, Modal, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useOutletStore } from '../store/outletStore';
import { API_URL } from '../config/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateReceiptHtml } from '../utils/receiptGenerator';

interface TransactionHistoryScreenProps {
    onBack: () => void;
    onOpenDrawer: () => void;
}

interface Transaction {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
    customerName?: string;
}

function formatCurrency(amount: number): string {
    return `Rp ${new Intl.NumberFormat('id-ID').format(amount)} `;
}

type DateFilterType = 'hari-ini' | '7-hari' | '30-hari' | 'semua';

export default function TransactionHistoryScreen({ onBack, onOpenDrawer }: TransactionHistoryScreenProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<DateFilterType>('semua');

    const { token } = useAuthStore();
    const { currentOutlet, outlets, paymentMethods: storePaymentMethods, fetchPaymentMethods } = useOutletStore();
    const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);

    const primaryColor = currentOutlet?.primaryColor || '#0f766e';
    const secondaryColor = currentOutlet?.secondaryColor || '#f5c23c';

    // Helper to resolve payment method name
    const getPaymentMethodName = (id: string) => {
        if (!id) return '-';
        const found = storePaymentMethods.find((p: any) => p.id === id || p.key === id);
        if (found) return found.name || found.label;

        // Fallback for hardcoded types
        if (id === 'cash') return 'Tunai';
        if (id === 'qris' || id === 'midtrans_qris') return 'QRIS';
        if (id.startsWith('midtrans_va_')) return `Transfer ${id.replace('midtrans_va_', '').toUpperCase()}`;
        if (id === 'transfer') return 'Transfer';

        return id;
    };

    // Initialize selected outlet
    useEffect(() => {
        if (currentOutlet?.id && !selectedOutletId) {
            setSelectedOutletId(currentOutlet.id);
        }
    }, [currentOutlet]);

    const fetchTransactions = async () => {
        const outletIdToFetch = selectedOutletId || currentOutlet?.id;

        if (!outletIdToFetch) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/transactions?outletId=${outletIdToFetch}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                    'Referer': API_URL.replace('/api', ''),
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (selectedOutletId) {
            fetchTransactions();
            // Also ensure we have payment methods for this outlet
            fetchPaymentMethods(selectedOutletId);
        }
    }, [selectedOutletId]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchTransactions();
    }, [selectedOutletId]);

    // Enhanced Filtering Logic
    const filteredTransactions = useMemo(() => {
        let filtered = [...transactions];

        // 1. Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.invoiceNumber.toLowerCase().includes(query) ||
                (t.customerName && t.customerName.toLowerCase().includes(query))
            );
        }

        // 2. Date Filter
        if (dateFilter !== 'semua') {
            const now = new Date();
            let limit = new Date();

            if (dateFilter === 'hari-ini') {
                limit.setHours(0, 0, 0, 0);
            } else if (dateFilter === '7-hari') {
                limit.setDate(now.getDate() - 7);
            } else if (dateFilter === '30-hari') {
                limit.setDate(now.getDate() - 30);
            }

            filtered = filtered.filter(t => new Date(t.createdAt) >= limit);
        }

        return filtered;
    }, [transactions, searchQuery, dateFilter]);

    // Calculate Summary Stats based on unfiltered transactions for consistency
    const safeAmount = (amt: any) => {
        const parsed = parseFloat(amt);
        return isNaN(parsed) ? 0 : parsed;
    };

    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => t.createdAt && t.createdAt.startsWith(today));
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.status === 'completed' ? safeAmount(t.totalAmount) : 0), 0);
    const totalTransactions = filteredTransactions.length;
    const filteredRevenue = filteredTransactions.reduce((sum, t) => sum + (t.status === 'completed' ? safeAmount(t.totalAmount) : 0), 0);

    // Receipt State
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
    const [isReceiptLoading, setIsReceiptLoading] = useState(false);

    const handleViewReceipt = async (transactionId: string) => {
        setIsReceiptLoading(true);
        try {
            const response = await fetch(`${API_URL}/transactions/${transactionId}/receipt`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                }
            });

            if (response.ok) {
                const data = await response.json();
                const receiptData = {
                    transaction: {
                        ...data.transaction,
                        items: data.items.map((item: any) => ({
                            ...item,
                            price: parseFloat(item.price),
                            quantity: parseFloat(item.quantity)
                        })),
                        subtotal: parseFloat(data.transaction.subtotal),
                        tax: parseFloat(data.transaction.tax),
                        totalAmount: parseFloat(data.transaction.totalAmount),
                        // Backend already returns taxDetails as object if available
                        taxDetails: data.transaction.taxDetails || null,
                        // Format Payment Method for Display
                        paymentMethod: getPaymentMethodName(data.transaction.paymentMethod),
                        // Ensure payments array also has formatted names
                        payments: data.transaction.payments?.map((p: any) => ({
                            ...p,
                            paymentMethod: getPaymentMethodName(p.paymentMethod)
                        }))
                    },
                    // Ensure Outlet Name exists for Header
                    outlet: data.outlet || { name: currentOutlet?.name || 'Sedia POS', address: currentOutlet?.address, phone: currentOutlet?.phone },
                    customer: data.customer,
                    cashier: data.cashier
                };
                setSelectedReceipt(receiptData);
                setShowReceiptModal(true);
            } else {
                Alert.alert('Gagal', 'Gagal memuat detail struk');
            }
        } catch (error) {
            console.error('Fetch receipt error:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat memuat struk');
        } finally {
            setIsReceiptLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Transaction }) => (
        <TouchableOpacity
            onPress={() => handleViewReceipt(item.id)}
            className="mb-3 rounded-2xl bg-white p-4 border border-zinc-100 shadow-sm active:bg-zinc-50"
        >
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                    <View
                        className="h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: primaryColor + '15' }}
                    >
                        <MaterialCommunityIcons name="receipt" size={16} color={primaryColor} />
                    </View>
                    <View>
                        <Text className="text-sm font-bold text-zinc-900">{item.invoiceNumber}</Text>
                        <Text className="text-xs text-zinc-500">
                            {new Date(item.createdAt).toLocaleString('id-ID', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                        </Text>
                    </View>
                </View>
                <View className={`px-2 py-1 rounded-lg ${item.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${item.status === 'completed' ? 'text-green-700' : 'text-amber-700'}`}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center justify-between border-t border-zinc-50 pt-3 mt-1">
                <View>
                    <Text className="text-xs text-zinc-400">Total Pembayaran</Text>
                    <Text className="text-base font-black text-zinc-900">{formatCurrency(safeAmount(item.totalAmount))}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-xs text-zinc-400">Metode</Text>
                    <Text className="text-sm font-bold text-zinc-700 capitalize">{getPaymentMethodName(item.paymentMethod)}</Text>
                </View>
            </View>

            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-dashed border-zinc-200">
                <View className="flex-row items-center gap-1">
                    <MaterialCommunityIcons name="account-outline" size={14} color="#94a3b8" />
                    <Text className="text-[10px] text-slate-500 font-medium">{item.customerName || 'Pelanggan Umum'}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                    <Text className="text-xs font-bold" style={{ color: primaryColor }}>Lihat Struk</Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={primaryColor} />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-zinc-50">
            {/* Receipt Modal */}
            <ReceiptModal
                visible={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                data={selectedReceipt}
                primaryColor={primaryColor}
            />
            {/* Loading Overlay */}
            {isReceiptLoading && (
                <View className="absolute inset-0 z-50 items-center justify-center bg-black/20">
                    <ActivityIndicator size="large" color={primaryColor} />
                </View>
            )}

            <View className="bg-white border-b border-zinc-100 pt-14 pb-4">
                <View className="px-6 flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity
                            onPress={onBack}
                            className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100"
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#18181b" />
                        </TouchableOpacity>
                        <Text className="text-xl font-black text-zinc-900 tracking-tight">Riwayat Transaksi</Text>
                    </View>
                    <TouchableOpacity
                        onPress={onOpenDrawer}
                        className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100"
                    >
                        <MaterialCommunityIcons name="menu" size={24} color={primaryColor} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="px-6 mb-4">
                    <View className="flex-row items-center bg-zinc-100 rounded-2xl px-4 py-2 border border-zinc-200">
                        <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Cari invoice atau pelanggan..."
                            className="flex-1 ml-2 text-sm font-medium text-zinc-800"
                            placeholderTextColor="#94a3b8"
                        />
                        {searchQuery !== '' && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <MaterialCommunityIcons name="close-circle" size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Outlet & Date Filters combined in a scroll list */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
                    className="mb-1"
                >
                    {/* Date Filters First */}
                    {[
                        { id: 'semua', label: 'Semua Waktu' },
                        { id: 'hari-ini', label: 'Hari Ini' },
                        { id: '7-hari', label: '7 Hari Terakhir' },
                        { id: '30-hari', label: '30 Hari Terakhir' }
                    ].map(f => (
                        <TouchableOpacity
                            key={f.id}
                            onPress={() => setDateFilter(f.id as any)}
                            className={`px-4 py-2 rounded-xl border ${dateFilter === f.id ? 'border-transparent' : 'bg-white border-zinc-200'}`}
                            style={dateFilter === f.id ? { backgroundColor: primaryColor + '15' } : {}}
                        >
                            <Text className={`font-bold text-xs ${dateFilter === f.id ? 'text-zinc-900' : 'text-zinc-500'}`} style={dateFilter === f.id ? { color: primaryColor } : {}}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <View className="w-[1px] h-6 bg-zinc-200 mx-1 self-center" />

                    {/* Outlet Tabs */}
                    {outlets.map(outlet => (
                        <TouchableOpacity
                            key={outlet.id}
                            onPress={() => setSelectedOutletId(outlet.id)}
                            className={`px-4 py-2 rounded-xl border ${selectedOutletId === outlet.id ? 'border-transparent' : 'bg-white border-zinc-200'}`}
                            style={selectedOutletId === outlet.id ? { backgroundColor: primaryColor } : {}}
                        >
                            <Text className={`font-bold text-xs ${selectedOutletId === outlet.id ? 'text-white' : 'text-zinc-500'}`}>
                                {outlet.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Summary Cards */}
            <View className="px-6 py-4">
                <View className="flex-row gap-4">
                    <View className="flex-1 rounded-3xl bg-white p-4 shadow-sm border border-zinc-100">
                        <View className="flex-row items-center gap-2 mb-2">
                            <View className="h-8 w-8 rounded-xl bg-indigo-50 items-center justify-center">
                                <MaterialCommunityIcons name="finance" size={16} color="#4f46e5" />
                            </View>
                            <Text className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Filter</Text>
                        </View>
                        <Text className="text-lg font-black text-zinc-900" numberOfLines={1} adjustsFontSizeToFit>
                            {formatCurrency(filteredRevenue)}
                        </Text>
                        <Text className="text-[10px] text-zinc-400 font-bold mt-1">{totalTransactions} Transaksi</Text>
                    </View>

                    <View className="flex-1 rounded-3xl bg-white p-4 shadow-sm border border-zinc-100">
                        <View className="flex-row items-center gap-2 mb-2">
                            <View className="h-8 w-8 rounded-xl bg-amber-50 items-center justify-center">
                                <MaterialCommunityIcons name="calendar-today" size={16} color="#d97706" />
                            </View>
                            <Text className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Hari Ini</Text>
                        </View>
                        <Text className="text-lg font-black text-zinc-900" numberOfLines={1} adjustsFontSizeToFit>
                            {formatCurrency(todayRevenue)}
                        </Text>
                        <Text className="text-[10px] text-zinc-400 font-bold mt-1">{todayTransactions.length} Transaksi</Text>
                    </View>
                </View>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={primaryColor} />
                </View>
            ) : (
                <FlatList
                    data={filteredTransactions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <View className="h-20 w-20 items-center justify-center rounded-full bg-zinc-100 mb-4">
                                <MaterialCommunityIcons name="file-document-outline" size={40} color="#a1a1aa" />
                            </View>
                            <Text className="text-xl font-bold text-zinc-900">Tidak Ada Transaksi</Text>
                            <Text className="text-zinc-500 text-center mt-2 px-10">
                                {searchQuery || dateFilter !== 'semua'
                                    ? 'Coba ganti filter atau kata kunci pencarian Anda.'
                                    : 'Transaksi yang sudah selesai akan muncul di sini.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

// Enhanced Receipt Modal Component
function ReceiptModal({ visible, onClose, data, primaryColor }: { visible: boolean; onClose: () => void; data: any; primaryColor: string }) {
    if (!data) return null;

    const handlePrint = async () => {
        try {
            const html = generateReceiptHtml(data.transaction, data.outlet);
            await Print.printAsync({ html });
        } catch (error) {
            console.error('Print error:', error);
            Alert.alert('Error', 'Gagal mencetak struk');
        }
    };

    const handleShare = async () => {
        try {
            const html = generateReceiptHtml(data.transaction, data.outlet);
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: `Struk - ${data.transaction.invoiceNumber}`
            });
        } catch (error) {
            console.error('Share error:', error);
            Alert.alert('Error', 'Gagal membagikan struk');
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-end bg-black/60">
                <View className="w-full bg-white rounded-t-[40px] p-8 shadow-2xl">
                    {/* Handle */}
                    <View className="w-12 h-1.5 bg-zinc-200 rounded-full mb-6 self-center" />

                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center gap-3">
                            <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: primaryColor }}>
                                <MaterialCommunityIcons name="receipt-text" size={24} color="white" />
                            </View>
                            <View>
                                <Text className="text-lg font-black text-zinc-900">Detail Struk</Text>
                                <Text className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">{data.transaction.invoiceNumber}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-50 rounded-full">
                            <MaterialCommunityIcons name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Order Summary Scrollable Area */}
                    <View className="max-h-[300px] mb-6">
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {data.transaction.items.map((item: any, idx: number) => (
                                <View key={idx} className="flex-row justify-between mb-3">
                                    <View className="flex-1">
                                        <Text className="text-sm font-bold text-zinc-800">{item.productName}</Text>
                                        <Text className="text-xs text-zinc-400">{item.quantity} x {formatCurrency(item.price)}</Text>
                                    </View>
                                    <Text className="text-sm font-black text-zinc-900">{formatCurrency(item.price * item.quantity)}</Text>
                                </View>
                            ))}

                            <View className="border-t border-zinc-100 my-4 pt-4">
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-sm font-medium text-zinc-500">Subtotal</Text>
                                    <Text className="text-sm font-bold text-zinc-800">{formatCurrency(data.transaction.subtotal)}</Text>
                                </View>
                                {data.transaction.tax > 0 && (
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-sm font-medium text-zinc-500">Pajak</Text>
                                        <Text className="text-sm font-bold text-zinc-800">{formatCurrency(data.transaction.tax)}</Text>
                                    </View>
                                )}
                                <View className="flex-row justify-between mt-2 pt-2 border-t border-zinc-50">
                                    <Text className="text-base font-black text-zinc-900">Total Akhir</Text>
                                    <Text className="text-base font-black" style={{ color: primaryColor }}>{formatCurrency(data.transaction.totalAmount)}</Text>
                                </View>
                            </View>
                        </ScrollView>
                    </View>

                    <View className="flex-row gap-3 mb-4">
                        <TouchableOpacity
                            onPress={handlePrint}
                            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4 shadow-lg"
                            style={{
                                backgroundColor: primaryColor,
                                shadowColor: primaryColor,
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 5
                            }}
                        >
                            <MaterialCommunityIcons name="printer" size={20} color="white" />
                            <Text className="font-black text-white text-base">Cetak Struk</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleShare}
                            className="w-16 items-center justify-center rounded-2xl bg-zinc-100"
                        >
                            <MaterialCommunityIcons name="share-variant" size={24} color="#18181b" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                        Kasir: {data.cashier?.name || 'Sedia POS'}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

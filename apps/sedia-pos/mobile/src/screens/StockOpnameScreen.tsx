import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

interface StockOpnameScreenProps {
    onBack: () => void;
    onOpenDrawer: () => void;
}

interface Product {
    id: string;
    name: string;
    sku: string | null;
    stock: number;
    price: string;
}

export default function StockOpnameScreen({ onBack, onOpenDrawer }: StockOpnameScreenProps) {
    const { currentOutlet } = useOutletStore();
    const { token } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Changes: Map of productId -> new actual stock
    const [adjustments, setAdjustments] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        if (!currentOutlet || !token) return;

        try {
            const invParams = new URLSearchParams({ outletId: currentOutlet.id });
            const invRes = await fetch(`${API_URL}/inventory?${invParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                },
                credentials: 'include'
            });
            const invData = await invRes.json();

            if (invRes.ok) {
                setProducts(invData);
            }
        } catch (error) {
            console.error('Failed to fetch inventory data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentOutlet]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleConfirmAdjustment = async (item: Product) => {
        const actualStockStr = adjustments[item.id];
        if (actualStockStr === undefined || actualStockStr === '') return;

        const actualStock = parseInt(actualStockStr);
        if (isNaN(actualStock)) return;

        const difference = actualStock - item.stock;

        if (difference === 0) {
            Alert.alert("Info", "Stok fisik sama dengan sistem. Tidak ada perubahan.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/inventory`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                },
                credentials: 'include',
                body: JSON.stringify({
                    productId: item.id,
                    adjustment: difference,
                    type: 'opname', // opname specific type if backend supports, or just adjustment
                    notes: `Stock Opname: System ${item.stock} -> Actual ${actualStock}`
                })
            });

            if (response.ok) {
                // Remove from adjustments map
                const newAdjustments = { ...adjustments };
                delete newAdjustments[item.id];
                setAdjustments(newAdjustments);

                // Optimistic update
                setProducts(prev => prev.map(p =>
                    p.id === item.id ? { ...p, stock: actualStock } : p
                ));

                Alert.alert("Sukses", "Stok berhasil diperbarui.");
            } else {
                Alert.alert("Gagal", "Gagal menyimpan stock opname.");
            }
        } catch (error) {
            Alert.alert("Error", "Gagal koneksi server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderItem = ({ item }: { item: Product }) => {
        const actualStockStr = adjustments[item.id] !== undefined ? adjustments[item.id] : '';
        const hasChange = actualStockStr !== '';

        return (
            <View className="bg-white p-4 mb-3 rounded-xl border border-zinc-100 shadow-sm">
                <View className="flex-row justify-between mb-2">
                    <View className="flex-1 mr-4">
                        <Text className="text-zinc-900 font-bold text-base">{item.name}</Text>
                        <Text className="text-zinc-500 text-xs font-mono">{item.sku || 'No SKU'}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-zinc-400 text-xs">Sistem</Text>
                        <Text className="text-zinc-900 font-bold text-lg">{item.stock}</Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-3 mt-2">
                    <View className="flex-1">
                        <Text className="text-xs text-secondary-700 font-bold mb-1 uppercase tracking-wider">Stok Fisik (Aktual)</Text>
                        <TextInput
                            value={actualStockStr}
                            onChangeText={(text) => {
                                setAdjustments(prev => ({ ...prev, [item.id]: text.replace(/[^0-9]/g, '') }));
                            }}
                            placeholder={item.stock.toString()}
                            keyboardType="number-pad"
                            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-lg font-bold text-zinc-900"
                        />
                    </View>

                    {hasChange && (
                        <TouchableOpacity
                            onPress={() => handleConfirmAdjustment(item)}
                            disabled={isSubmitting}
                            className="bg-primary-600 h-11 w-11 mt-5 rounded-lg items-center justify-center shadow-sm active:bg-primary-700"
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <MaterialCommunityIcons name="check" size={24} color="white" />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-zinc-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-14 pb-4 bg-white border-b border-zinc-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#18181b" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-xl font-black text-zinc-900">Stock Opname</Text>
                        <Text className="text-xs text-zinc-500">Sesuaikan stok fisik</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={onOpenDrawer} className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
                    <MaterialCommunityIcons name="menu" size={24} color="#18181b" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <FlatList
                data={filteredProducts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={
                    <View className="mb-4">
                        <View className="flex-row items-center bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-sm">
                            <MaterialCommunityIcons name="magnify" size={20} color="#a1a1aa" />
                            <TextInput
                                placeholder="Cari barang untuk stock opname..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                className="flex-1 ml-2 text-base text-zinc-900"
                                placeholderTextColor="#a1a1aa"
                            />
                        </View>
                        <View className="flex-row gap-2 mt-4 flex-wrap">
                            <View className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                                <Text className="text-blue-700 text-xs font-medium">1. Hitung fisik barang</Text>
                            </View>
                            <View className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                                <Text className="text-blue-700 text-xs font-medium">2. Input jumlah asli</Text>
                            </View>
                            <View className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                                <Text className="text-blue-700 text-xs font-medium">3. Tekan checkmark</Text>
                            </View>
                        </View>
                    </View>
                }
            />
        </View>
    );
}

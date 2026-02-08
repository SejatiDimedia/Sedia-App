import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';
import StockAdjustmentModal from '../components/StockAdjustmentModal';

interface InventoryScreenProps {
    onBack: () => void;
    onOpenDrawer: () => void;
}

interface Variant {
    id: string;
    name: string;
    stock: number;
    priceAdjustment: string;
    sku?: string | null;
}

interface Product {
    id: string;
    name: string;
    sku: string | null;
    stock: number;
    price: string;
    variants?: Variant[];
}

interface StockAlert {
    total: number;
    critical: number;
    warning: number;
}

export default function InventoryScreen({ onBack, onOpenDrawer }: InventoryScreenProps) {
    const { currentOutlet } = useOutletStore();
    const { token } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [alerts, setAlerts] = useState<StockAlert | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [adjustingId, setAdjustingId] = useState<string | null>(null);

    // Stock modal state
    const [stockModalVisible, setStockModalVisible] = useState(false);
    const [selectedStockItem, setSelectedStockItem] = useState<{
        productId: string;
        variantId?: string;
        name: string;
        currentStock: number;
    } | null>(null);

    const fetchData = async () => {
        if (!currentOutlet || !token) return;

        try {
            // Fetch Inventory
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

            // Fetch Alerts
            const alertsRes = await fetch(`${API_URL}/inventory/alerts?outletId=${currentOutlet.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                },
                credentials: 'include'
            });
            const alertsData = await alertsRes.json();

            if (alertsRes.ok) {
                setAlerts(alertsData);
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

    const adjustStock = async (productId: string, adjustment: number, variantId?: string) => {
        const idToTrack = variantId || productId;
        setAdjustingId(idToTrack);
        try {
            const body: any = {
                productId,
                adjustment: adjustment,
                type: adjustment > 0 ? 'in' : 'out',
            };
            if (variantId) body.variantId = variantId;

            const response = await fetch(`${API_URL}/inventory`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (response.ok) {
                // Optimistic update
                setProducts(prev => prev.map(p => {
                    if (p.id === productId) {
                        if (variantId && p.variants) {
                            return {
                                ...p,
                                variants: p.variants.map(v =>
                                    v.id === variantId ? { ...v, stock: v.stock + adjustment } : v
                                ),
                                // Optionally update total stock if needed, usually calculated
                            };
                        } else {
                            return { ...p, stock: p.stock + adjustment };
                        }
                    }
                    return p;
                }));
                // Refresh alerts silently
                const alertsRes = await fetch(`${API_URL}/inventory/alerts?outletId=${currentOutlet?.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Origin': API_URL.replace('/api', ''),
                    },
                    credentials: 'include'
                });
                if (alertsRes.ok) {
                    setAlerts(await alertsRes.json());
                }
            } else {
                Alert.alert("Gagal", "Gagal mengubah stok");
            }
        } catch (error) {
            Alert.alert("Error", "Terjadi kesalahan koneksi");
        } finally {
            setAdjustingId(null);
        }
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0) return { label: "Habis", color: "text-red-600", bg: "bg-red-100" };
        if (stock < 5) return { label: "Rendah", color: "text-yellow-700", bg: "bg-yellow-100" };
        return { label: "Aman", color: "text-green-700", bg: "bg-green-100" };
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderItem = ({ item }: { item: Product }) => {
        const hasVariants = item.variants && item.variants.length > 0;
        const status = getStockStatus(item.stock);
        const isAdjusting = adjustingId === item.id;

        // Colors from theme
        const primaryColor = currentOutlet?.primaryColor || '#3b82f6';

        return (
            <View className="bg-white p-4 mb-3 rounded-xl border border-zinc-100 shadow-sm">
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 mr-4">
                        <Text className="text-zinc-900 font-bold text-base mb-1">{item.name}</Text>
                        <Text className="text-zinc-500 text-xs font-mono">{item.sku || 'No SKU'}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${status.bg}`}>
                        <Text className={`text-[10px] font-bold ${status.color} uppercase`}>
                            {hasVariants ? `${item.variants?.length} Varian` : status.label}
                        </Text>
                    </View>
                </View>

                {hasVariants ? (
                    // Variant List
                    <View className="border-t border-zinc-50 pt-2">
                        {item.variants?.map((variant) => {
                            const vStatus = getStockStatus(variant.stock);
                            const isVAdjusting = adjustingId === variant.id;

                            return (
                                <View key={variant.id} className="flex-row items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-zinc-700 font-medium text-sm">{variant.name}</Text>
                                        <Text className={`text-[10px] ${vStatus.color}`}>{vStatus.label}</Text>
                                    </View>

                                    <View className="flex-row items-center gap-2">
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedStockItem({
                                                    productId: item.id,
                                                    variantId: variant.id,
                                                    name: `${item.name} - ${variant.name}`,
                                                    currentStock: variant.stock,
                                                });
                                                setStockModalVisible(true);
                                            }}
                                            className="px-3 py-1 bg-zinc-100 rounded-lg mr-1"
                                        >
                                            <Text className="text-zinc-900 font-bold text-base">{variant.stock}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => adjustStock(item.id, -1, variant.id)}
                                            disabled={isVAdjusting || variant.stock <= 0}
                                            className={`h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 ${(isVAdjusting || variant.stock <= 0) ? 'opacity-50' : ''}`}
                                        >
                                            <MaterialCommunityIcons name="minus" size={16} color="#ef4444" />
                                        </TouchableOpacity>

                                        {isVAdjusting ? (
                                            <ActivityIndicator size="small" color={primaryColor} />
                                        ) : null}

                                        <TouchableOpacity
                                            onPress={() => adjustStock(item.id, 1, variant.id)}
                                            disabled={isVAdjusting}
                                            className={`h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 ${isVAdjusting ? 'opacity-50' : ''}`}
                                        >
                                            <MaterialCommunityIcons name="plus" size={16} color="#22c55e" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    // Regular Product Stock
                    <View className="flex-row items-center justify-between border-t border-zinc-50 pt-3">
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedStockItem({
                                    productId: item.id,
                                    name: item.name,
                                    currentStock: item.stock,
                                });
                                setStockModalVisible(true);
                            }}
                        >
                            <Text className="text-zinc-400 text-xs mb-1">Stok Saat Ini</Text>
                            <Text className="text-zinc-900 font-black text-xl">{item.stock}</Text>
                        </TouchableOpacity>

                        <View className="flex-row items-center gap-3 bg-zinc-50 rounded-lg p-1">
                            <TouchableOpacity
                                onPress={() => adjustStock(item.id, -1)}
                                disabled={isAdjusting || item.stock <= 0}
                                className={`h-10 w-10 items-center justify-center rounded-lg bg-white border border-zinc-200 shadow-sm ${(isAdjusting || item.stock <= 0) ? 'opacity-50' : ''
                                    }`}
                            >
                                <MaterialCommunityIcons name="minus" size={20} color="#ef4444" />
                            </TouchableOpacity>

                            {isAdjusting ? (
                                <ActivityIndicator size="small" color={primaryColor} />
                            ) : (
                                <View className="h-10 w-12 items-center justify-center">
                                    <Text className="font-bold text-zinc-900">1</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                onPress={() => adjustStock(item.id, 1)}
                                disabled={isAdjusting}
                                className={`h-10 w-10 items-center justify-center rounded-lg bg-white border border-zinc-200 shadow-sm ${isAdjusting ? 'opacity-50' : ''
                                    }`}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="#22c55e" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )
                }
            </View >
        );
    };

    return (
        <View className="flex-1 bg-zinc-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-14 pb-4 bg-white border-b border-zinc-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
                        <MaterialCommunityIcons name="arrow-left" size={24} color={currentOutlet?.primaryColor || "#18181b"} />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-xl font-black" style={{ color: currentOutlet?.primaryColor || '#18181b' }}>Inventaris</Text>
                        <Text className="text-xs text-zinc-500">Kelola & Stock Opname</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={onOpenDrawer} className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
                    <MaterialCommunityIcons name="menu" size={24} color={currentOutlet?.primaryColor || "#18181b"} />
                </TouchableOpacity>
            </View>

            {/* Alerts Summary */}
            {alerts && alerts.total > 0 && (
                <View className="m-4 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex-row items-start gap-3">
                    <MaterialCommunityIcons name="alert" size={24} color="#ca8a04" />
                    <View className="flex-1">
                        <Text className="font-bold text-yellow-900 text-sm mb-1">Peringatan Stok Low</Text>
                        <Text className="text-yellow-800 text-xs leading-5">
                            <Text className="font-bold">{alerts.critical}</Text> produk habis dan{' '}
                            <Text className="font-bold">{alerts.warning}</Text> produk stok menipis.
                        </Text>
                    </View>
                </View>
            )}

            {/* Search Bar */}
            <View className={`px-4 pb-4 ${alerts && alerts.total > 0 ? '' : 'pt-4'}`}>
                <View className="flex-row items-center bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-sm">
                    <MaterialCommunityIcons name="magnify" size={20} color="#a1a1aa" />
                    <TextInput
                        placeholder="Cari nama produk atau SKU..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 ml-2 text-base text-zinc-900"
                        placeholderTextColor="#a1a1aa"
                    />
                </View>
            </View>

            {/* Product List */}
            <FlatList
                data={filteredProducts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !isLoading ? (
                        <View className="items-center justify-center py-20">
                            <MaterialCommunityIcons name="package-variant" size={48} color="#d4d4d8" />
                            <Text className="text-zinc-400 mt-2 font-medium">Belum ada data inventaris</Text>
                        </View>
                    ) : null
                }
            />

            <StockAdjustmentModal
                visible={stockModalVisible}
                onClose={() => {
                    setStockModalVisible(false);
                    setSelectedStockItem(null);
                }}
                onSave={async (adjustment, notes) => {
                    if (!selectedStockItem) return;
                    await adjustStock(
                        selectedStockItem.productId,
                        adjustment,
                        selectedStockItem.variantId
                    );
                }}
                currentItem={selectedStockItem}
            />
        </View>
    );
}

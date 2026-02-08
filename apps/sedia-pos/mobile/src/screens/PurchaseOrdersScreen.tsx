import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Search, Filter, Calendar } from "lucide-react-native";
import { theme } from "../config/theme";
import { useOutletStore } from "../store/outletStore";
import { useAuth } from "../hooks/useAuth";
import { API_URL } from "../config/api";

// Interface
interface PurchaseOrder {
    id: string;
    invoiceNumber: string;
    supplier: { name: string };
    status: string;
    totalAmount: string;
    createdAt: string;
    orderDate: string;
}

interface PurchaseOrdersScreenProps {
    onNavigate: (screen: string, params?: any) => void;
    onBack: () => void;
}

export default function PurchaseOrdersScreen({ onNavigate, onBack }: PurchaseOrdersScreenProps) {
    const { currentOutlet } = useOutletStore();
    const { token } = useAuth() as any;
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Dynamic theme colors from outlet
    const primaryColor = currentOutlet?.primaryColor || theme.colors.primary[600];
    const secondaryColor = currentOutlet?.secondaryColor || theme.colors.secondary[500];

    useEffect(() => {
        if (currentOutlet) {
            loadOrders();
        }
    }, [currentOutlet]);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            if (!currentOutlet) {
                Alert.alert("Error", "No active outlet selected.");
                setIsLoading(false);
                return;
            }

            const outletId = currentOutlet.id;

            const response = await fetch(`${API_URL}/purchase-orders?outletId=${outletId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Failed to fetch POs');
            }

            const data = await response.json();
            setOrders(data);
        } catch (error: any) {
            console.error("Fetch error:", error);
            Alert.alert("Error", "Failed to fetch POs: " + (error.response?.data?.error || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'nav_draft': return 'bg-zinc-200 text-zinc-700'; // Mobile styling usually needs different approach
            case 'ordered': return '#f59e0b'; // Amber
            case 'received': return '#10b981'; // Emerald
            case 'cancelled': return '#ef4444'; // Red
            default: return '#71717a'; // Zinc
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return 'Draft';
            case 'ordered': return 'Dipesan';
            case 'received': return 'Diterima';
            case 'cancelled': return 'Dibatalkan';
            default: return status;
        }
    };

    const filteredOrders = orders.filter(o =>
        o.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: PurchaseOrder }) => {
        const statusColor = getStatusColor(item.status);

        return (
            <TouchableOpacity
                className="bg-white p-4 rounded-xl border border-zinc-100 mb-3 shadow-sm"
                onPress={() => onNavigate("purchase_order_detail", { poId: item.id })}
            >
                <View className="flex-row justify-between items-start mb-2">
                    <View>
                        <Text className="font-bold text-lg text-zinc-900">{item.invoiceNumber}</Text>
                        <Text className="text-zinc-500 text-sm mt-0.5">{item.supplier.name}</Text>
                    </View>
                    <View
                        className="px-2 py-1 rounded-md"
                        style={{ backgroundColor: statusColor + '20' }} // 20% opacity background
                    >
                        <Text className="text-xs font-bold capitalize" style={{ color: statusColor }}>
                            {getStatusLabel(item.status)}
                        </Text>
                    </View>
                </View>

                <View className="flex-row justify-between items-end mt-2">
                    <View className="space-y-1">
                        <View className="flex-row items-center gap-2">
                            <Calendar size={14} className="text-zinc-400" color={theme.colors.zinc[400]} />
                            <Text className="text-zinc-500 text-xs">
                                {new Date(item.orderDate || item.createdAt).toLocaleDateString("id-ID")}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-zinc-900 font-bold text-base">
                        Rp {parseFloat(item.totalAmount).toLocaleString("id-ID")}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-zinc-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-zinc-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-zinc-50">
                        <ArrowLeft size={20} color={theme.colors.zinc[900]} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-zinc-900">Purchase Orders</Text>
                </View>
                <TouchableOpacity
                    onPress={() => onNavigate("purchase_order_form")}
                    className="px-3 py-2 rounded-lg flex-row items-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                >
                    <Plus size={16} color="white" />
                    <Text className="text-white font-medium text-sm">Buat PO</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="p-4 flex-1">
                {/* Search */}
                <View className="flex-row items-center bg-white border border-zinc-200 rounded-xl px-3 py-2.5 mb-4">
                    <Search size={18} color={theme.colors.zinc[400]} />
                    <TextInput
                        className="flex-1 ml-2 text-zinc-900 text-base"
                        placeholder="Cari No. PO atau Supplier..."
                        placeholderTextColor={theme.colors.zinc[400]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color={primaryColor} />
                    </View>
                ) : filteredOrders.length === 0 ? (
                    <View className="flex-1 justify-center items-center opacity-50">
                        <Text className="text-zinc-500 font-medium mt-4">Belum ada Purchase Order</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredOrders}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 80 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

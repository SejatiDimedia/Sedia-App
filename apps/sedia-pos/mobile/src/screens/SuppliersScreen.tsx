import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Search, MapPin, Phone, Mail, MoreVertical, Trash2, Edit2 } from "lucide-react-native";
import { theme } from "../config/theme";
import { useOutletStore } from "../store/outletStore";
import { useAuth } from "../hooks/useAuth";
import { API_URL } from "../config/api";

// Interface for Supplier
interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}

interface SuppliersScreenProps {
    onNavigate: (screen: string, params?: any) => void;
    onBack: () => void;
}

export default function SuppliersScreen({ onNavigate, onBack }: SuppliersScreenProps) {
    const { currentOutlet } = useOutletStore();
    const { token } = useAuth() as any;
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Dynamic theme colors from outlet
    const primaryColor = currentOutlet?.primaryColor || theme.colors.primary[600];
    const secondaryColor = currentOutlet?.secondaryColor || theme.colors.secondary[500];

    useEffect(() => {
        console.log("[SuppliersScreen] Effect triggered. CurrentOutlet:", currentOutlet ? currentOutlet.id : "null");
        if (currentOutlet) {
            fetchSuppliers(currentOutlet.id);
        } else {
            console.log("[SuppliersScreen] No current outlet, skipping fetch.");
            setIsLoading(false);
        }
    }, [currentOutlet]);

    const fetchSuppliers = async (outletId: string) => {
        console.log(`[SuppliersScreen] Fetching suppliers for outlet: ${outletId}`);
        console.log(`[SuppliersScreen] Token present: ${!!token}`);
        setIsLoading(true);
        try {
            const url = `${API_URL}/suppliers?outletId=${outletId}`;
            console.log(`[SuppliersScreen] Request URL: ${url}`);

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log(`[SuppliersScreen] Response status: ${response.status}`);

            if (!response.ok) {
                const text = await response.text();
                console.error(`[SuppliersScreen] Error response: ${text}`);
                throw new Error(`Failed to fetch: ${response.status} ${text}`);
            }

            const data = await response.json();
            console.log(`[SuppliersScreen] Data received: ${data.length} items`);
            setSuppliers(data);
        } catch (error: any) {
            console.error("[SuppliersScreen] Fetch error:", error);
            Alert.alert("Error", "Failed to fetch suppliers: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderItem = ({ item }: { item: Supplier }) => (
        <TouchableOpacity
            className="bg-white p-4 rounded-xl border border-zinc-100 mb-3 shadow-sm"
            onPress={() => onNavigate("supplier_form", { supplier: item })}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="font-bold text-lg text-zinc-900">{item.name}</Text>
                    {item.contactPerson && (
                        <Text className="text-zinc-500 text-sm mt-0.5">{item.contactPerson}</Text>
                    )}
                </View>
            </View>

            <View className="space-y-1 mt-2">
                {item.phone && (
                    <View className="flex-row items-center gap-2">
                        <Phone size={14} className="text-zinc-400" color={theme.colors.zinc[400]} />
                        <Text className="text-zinc-600 text-sm">{item.phone}</Text>
                    </View>
                )}
                {item.address && (
                    <View className="flex-row items-center gap-2">
                        <MapPin size={14} className="text-zinc-400" color={theme.colors.zinc[400]} />
                        <Text className="text-zinc-600 text-sm" numberOfLines={1}>{item.address}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-zinc-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-zinc-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-zinc-50">
                        <ArrowLeft size={20} color={theme.colors.zinc[900]} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-zinc-900">Supplier</Text>
                </View>
                <TouchableOpacity
                    onPress={() => onNavigate("supplier_form")}
                    className="px-3 py-2 rounded-lg flex-row items-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                >
                    <Plus size={16} color="white" />
                    <Text className="text-white font-medium text-sm">Tambah</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="p-4 flex-1">
                {/* Search */}
                <View className="flex-row items-center bg-white border border-zinc-200 rounded-xl px-3 py-2.5 mb-4">
                    <Search size={18} color={theme.colors.zinc[400]} />
                    <TextInput
                        className="flex-1 ml-2 text-zinc-900 text-base"
                        placeholder="Cari nama atau kontak..."
                        placeholderTextColor={theme.colors.zinc[400]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color={primaryColor} />
                    </View>
                ) : filteredSuppliers.length === 0 ? (
                    <View className="flex-1 justify-center items-center opacity-50">
                        <Text className="text-zinc-500 font-medium mt-4">Belum ada supplier</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredSuppliers}
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

import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, Search } from "lucide-react-native";
import { theme } from "../config/theme";
import { useOutletStore } from "../store/outletStore";
import { useAuth } from "../hooks/useAuth";
import { API_URL } from "../config/api";

// Props
interface PurchaseOrderFormScreenProps {
    onBack: () => void;
}

// Supplier Selector Modal Component
const SupplierSelector = ({ onSelect, onClose, token, outletId }: any) => {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await fetch(`${API_URL}/suppliers?outletId=${outletId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSuppliers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <View className="flex-1 bg-white pt-10">
            <View className="px-4 py-2 border-b border-zinc-100 flex-row items-center gap-2">
                <TouchableOpacity onPress={onClose}><ArrowLeft size={20} color="black" /></TouchableOpacity>
                <TextInput
                    className="flex-1 bg-zinc-50 p-2 rounded-lg"
                    placeholder="Cari Supplier..."
                    value={search} onChangeText={setSearch}
                    autoFocus
                />
            </View>
            {loading ? <ActivityIndicator size="large" className="mt-10" /> : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => onSelect(item)} className="p-4 border-b border-zinc-50">
                            <Text className="font-bold text-lg">{item.name}</Text>
                            <Text className="text-zinc-500">{item.contactPerson}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

// Product Selector Modal (Simplified)
const ProductSelector = ({ onSelect, onClose, token, API_URL, outletId }: any) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            console.log(`[ProductSelector] Fetching products from: ${API_URL}/products?outletId=${outletId}`);
            const res = await fetch(`${API_URL}/products?outletId=${outletId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`[ProductSelector] Status: ${res.status}`);

            if (!res.ok) {
                const text = await res.text();
                console.error(`[ProductSelector] Error response: ${text}`);
                Alert.alert("Error", `Gagal memuat produk: ${res.status}`);
                return;
            }

            const data = await res.json();
            console.log(`[ProductSelector] Loaded ${data.length} products`);
            setProducts(data);
        } catch (e: any) {
            console.error("[ProductSelector] Network Error:", e);
            Alert.alert("Error", "Gagal memuat produk: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    // Flatten logic for variants? Or just select product and then variant?
    // For simplicity, let's just list products. If they have variants, list variants.
    // In this MVP, flat list of searchable items.

    const flatItems: any[] = [];
    products.forEach(p => {
        if (p.variants && p.variants.length > 0) {
            p.variants.forEach((v: any) => {
                flatItems.push({
                    id: p.id,
                    variantId: v.id,
                    name: `${p.name} - ${v.name}`,
                    sku: v.sku || p.sku,
                    costPrice: v.costPrice || p.costPrice || 0
                });
            });
        } else {
            flatItems.push({
                id: p.id,
                variantId: null,
                name: p.name,
                sku: p.sku,
                costPrice: p.costPrice || 0
            });
        }
    });

    const filtered = flatItems.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <View className="flex-1 bg-white pt-10">
            <View className="px-4 py-2 border-b border-zinc-100 flex-row items-center gap-2">
                <TouchableOpacity onPress={onClose}><ArrowLeft size={20} color="black" /></TouchableOpacity>
                <TextInput
                    className="flex-1 bg-zinc-50 p-2 rounded-lg"
                    placeholder="Cari Produk..."
                    value={search} onChangeText={setSearch}
                    autoFocus
                />
            </View>
            {loading ? <ActivityIndicator size="large" className="mt-10" /> : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => onSelect(item)} className="p-4 border-b border-zinc-50">
                            <Text className="font-bold text-lg">{item.name}</Text>
                            <Text className="text-zinc-500">{item.sku}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}


export default function PurchaseOrderFormScreen({ onBack }: PurchaseOrderFormScreenProps) {
    const { token } = useAuth() as any;
    const { currentOutlet } = useOutletStore();
    const outletId = currentOutlet?.id; // Derived from store

    // Dynamic theme colors from outlet
    const primaryColor = currentOutlet?.primaryColor || theme.colors.primary[600];

    const [supplier, setSupplier] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);

    // Removed useEffect for SecureStore

    const handleAddItem = (item: any) => {
        // Check if exists
        const exists = items.find(i => i.productId === item.id && i.variantId === item.variantId);
        if (exists) {
            Alert.alert("Item sudah ada", "Silahkan ubah jumlahnya di daftar.");
        } else {
            setItems([...items, {
                productId: item.id,
                variantId: item.variantId,
                name: item.name,
                quantity: 1,
                costPrice: item.costPrice || 0
            }]);
        }
        setShowProductModal(false);
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...items];
        if (field === 'quantity') newItems[index].quantity = parseInt(value) || 0;
        if (field === 'costPrice') newItems[index].costPrice = parseInt(value) || 0;
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSave = async () => {
        if (!supplier) {
            Alert.alert("Error", "Pilih Supplier");
            return;
        }
        if (items.length === 0) {
            Alert.alert("Error", "Pilih minimal 1 produk");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/purchase-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    outletId,
                    supplierId: supplier.id,
                    items,
                    notes,
                    expectedDate: null // For now
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Gagal menyimpan PO');
            }
            onBack();
        } catch (error: any) {
            Alert.alert("Error", "Gagal menyimpan PO: " + (error.response?.data?.error || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-zinc-50">
                        <ArrowLeft size={20} color={theme.colors.zinc[900]} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-zinc-900">Buat PO Baru</Text>
                </View>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg flex-row items-center gap-2"
                    style={{ backgroundColor: primaryColor, opacity: isSaving ? 0.5 : 1 }}
                >
                    {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Simpan</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Supplier Section */}
                <Text className="font-bold text-zinc-700 mb-2">Supplier</Text>
                <TouchableOpacity
                    onPress={() => setShowSupplierModal(true)}
                    className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex-row justify-between items-center mb-6"
                >
                    <Text className={supplier ? "text-zinc-900 font-bold" : "text-zinc-400"}>
                        {supplier ? supplier.name : "Pilih Supplier"}
                    </Text>
                    <ChevronDown size={20} color="#a1a1aa" />
                </TouchableOpacity>

                {/* Items Section */}
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-zinc-700">Daftar Barang</Text>
                    <TouchableOpacity onPress={() => setShowProductModal(true)}>
                        <Text className="text-primary-600 font-bold" style={{ color: theme.colors.primary[600] }}>+ Tambah Barang</Text>
                    </TouchableOpacity>
                </View>

                {items.map((item, index) => (
                    <View key={index} className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 mb-3">
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="font-bold text-zinc-900 w-[80%]">{item.name}</Text>
                            <TouchableOpacity onPress={() => removeItem(index)}>
                                <Trash2 size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Text className="text-xs text-zinc-500 mb-1">Qty</Text>
                                <TextInput
                                    className="bg-white border border-zinc-200 rounded-lg p-2 text-center font-bold"
                                    keyboardType="numeric"
                                    value={item.quantity.toString()}
                                    onChangeText={(v) => updateItem(index, 'quantity', v)}
                                />
                            </View>
                            <View className="flex-[2]">
                                <Text className="text-xs text-zinc-500 mb-1">Harga Beli (@)</Text>
                                <TextInput
                                    className="bg-white border border-zinc-200 rounded-lg p-2 font-bold"
                                    keyboardType="numeric"
                                    value={item.costPrice.toString()}
                                    onChangeText={(v) => updateItem(index, 'costPrice', v)}
                                />
                            </View>
                            <View className="flex-[2] justify-end pb-2 items-end">
                                <Text className="font-bold text-zinc-900">
                                    Total: Rp {(item.quantity * item.costPrice).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}

                <View className="mb-10">
                    <Text className="font-bold text-zinc-700 mb-2">Catatan</Text>
                    <TextInput
                        className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 h-24"
                        multiline
                        textAlignVertical="top"
                        placeholder="Catatan tambahan..."
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>

            </ScrollView>

            <Modal visible={showSupplierModal} animationType="slide">
                <SupplierSelector
                    onSelect={(s: any) => { setSupplier(s); setShowSupplierModal(false); }}
                    onClose={() => setShowSupplierModal(false)}
                    token={token} API_URL={API_URL} outletId={outletId}
                />
            </Modal>

            <Modal visible={showProductModal} animationType="slide">
                <ProductSelector
                    onSelect={handleAddItem}
                    onClose={() => setShowProductModal(false)}
                    token={token} API_URL={API_URL} outletId={outletId}
                />
            </Modal>
        </SafeAreaView>
    );
}

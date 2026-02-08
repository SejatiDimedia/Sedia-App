import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';
import VariantManagementModal from '../components/VariantManagementModal';

interface ProductManagementScreenProps {
    onBack: () => void;
    onOpenDrawer: () => void;
}

interface Product {
    id: string;
    name: string;
    description?: string;
    price: string;
    category?: { id: string; name: string };
    sku?: string;
    variants?: any[];
}

export default function ProductManagementScreen({ onBack, onOpenDrawer }: ProductManagementScreenProps) {
    const { currentOutlet } = useOutletStore();
    const { token } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [variantModalVisible, setVariantModalVisible] = useState(false); // Valid state
    const [formName, setFormName] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [formSku, setFormSku] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchProducts = async () => {
        if (!currentOutlet || !token) return;

        try {
            const queryParams = new URLSearchParams({
                outletId: currentOutlet.id
            });

            const response = await fetch(`${API_URL}/products?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [currentOutlet]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormName(product.name);
            setFormPrice(product.price.toString());
            setFormSku(product.sku || "");
        } else {
            setEditingProduct(null);
            setFormName("");
            setFormPrice("");
            setFormSku("");
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formName.trim() || !formPrice.trim()) {
            Alert.alert("Error", "Nama produk dan harga harus diisi");
            return;
        }

        setIsSaving(true);
        try {
            const url = editingProduct
                ? `${API_URL}/products/${editingProduct.id}`
                : `${API_URL}/products`;

            const method = editingProduct ? 'PUT' : 'POST';

            // Note: Simplistic body for now, assumes backend handles it.
            // Check actual API requirement. Usually needs outletId for create.
            const body = {
                outletId: currentOutlet?.id,
                name: formName,
                price: parseFloat(formPrice),
                sku: formSku || undefined,
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Gagal menyimpan data");
            }

            setModalVisible(false);
            fetchProducts();
            Alert.alert("Sukses", editingProduct ? "Produk diperbarui" : "Produk ditambahkan");
        } catch (error: any) {
            Alert.alert("Gagal", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            onPress={() => handleOpenModal(item)}
            className="flex-row items-center bg-white p-4 mb-2 rounded-xl border border-zinc-100"
        >
            <View className="h-12 w-12 rounded-lg bg-zinc-100 items-center justify-center mr-3">
                <MaterialCommunityIcons name="package-variant-closed" size={24} color="#a1a1aa" />
            </View>
            <View className="flex-1">
                <Text className="text-zinc-900 font-bold text-base">{item.name}</Text>
                <View className="flex-row items-center gap-2">
                    <Text className="text-zinc-500 text-sm">Rp {parseFloat(item.price).toLocaleString('id-ID')}</Text>
                    {item.variants && item.variants.length > 0 && (
                        <View className="bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                            <Text className="text-[10px] text-primary-700 font-medium">
                                {item.variants.length} Varian
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#d4d4d8" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-zinc-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-14 pb-4 bg-white border-b border-zinc-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#18181b" />
                    </TouchableOpacity>
                    <Text className="text-xl font-black text-zinc-900">Produk</Text>
                </View>
                <TouchableOpacity onPress={onOpenDrawer} className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
                    <MaterialCommunityIcons name="menu" size={24} color="#18181b" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="p-4 bg-white border-b border-zinc-100">
                <View className="flex-row items-center bg-zinc-100 rounded-xl px-4 py-2">
                    <MaterialCommunityIcons name="magnify" size={20} color="#a1a1aa" />
                    <TextInput
                        placeholder="Cari produk..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 ml-2 text-base text-zinc-900"
                        placeholderTextColor="#a1a1aa"
                    />
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredProducts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !isLoading ? (
                        <View className="items-center justify-center py-20">
                            <MaterialCommunityIcons name="package-variant" size={48} color="#d4d4d8" />
                            <Text className="text-zinc-400 mt-2 font-medium">Belum ada produk</Text>
                        </View>
                    ) : null
                }
            />

            {/* FAB */}
            <TouchableOpacity
                onPress={() => handleOpenModal()}
                className="absolute bottom-6 right-6 h-14 w-14 rounded-full items-center justify-center shadow-lg"
                style={{
                    backgroundColor: currentOutlet?.secondaryColor || '#f59e0b',
                    shadowColor: currentOutlet?.secondaryColor || '#f59e0b',
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 4
                }}
            >
                <MaterialCommunityIcons name="plus" size={28} color="#18181b" />
            </TouchableOpacity>

            {/* Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 h-[70%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-zinc-900">
                                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#71717a" />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text className="text-sm font-medium text-zinc-700 mb-1.5">Nama Produk *</Text>
                                <TextInput
                                    value={formName}
                                    onChangeText={setFormName}
                                    placeholder="Contoh: Kopi Susu"
                                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-zinc-700 mb-1.5">Harga (Rp) *</Text>
                                <TextInput
                                    value={formPrice}
                                    onChangeText={(text) => setFormPrice(text.replace(/[^0-9]/g, ''))}
                                    placeholder="Contoh: 15000"
                                    keyboardType="number-pad"
                                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-zinc-700 mb-1.5">SKU (Opsional)</Text>
                                <TextInput
                                    value={formSku}
                                    onChangeText={setFormSku}
                                    placeholder="Contoh: KPS-001"
                                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isSaving}
                                className="mt-4 rounded-xl py-4 items-center justify-center"
                                style={{
                                    backgroundColor: isSaving
                                        ? '#d4d4d8'
                                        : (currentOutlet?.secondaryColor || '#f59e0b')
                                }}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#18181b" />
                                ) : (
                                    <Text className="text-base font-bold text-zinc-900">Simpan</Text>
                                )}
                            </TouchableOpacity>

                            {editingProduct && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setModalVisible(false);
                                        setVariantModalVisible(true);
                                    }}
                                    className="mt-2 bg-white border border-zinc-200 rounded-xl py-4 items-center justify-center"
                                >
                                    <Text className="text-base font-bold text-zinc-700">Kelola Varian</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            <VariantManagementModal
                visible={variantModalVisible}
                onClose={() => {
                    setVariantModalVisible(false);
                    fetchProducts(); // Refresh parent list to update variant count
                }}
                product={editingProduct}
                token={token}
            />
        </View>
    );
}

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../config/api';
import { useOutletStore } from '../store/outletStore';

interface Variant {
    id: string;
    name: string;
    type: string;
    priceAdjustment: string;
    stock: number;
    isActive: boolean;
}

interface Product {
    id: string;
    name: string;
}

interface VariantManagementModalProps {
    visible: boolean;
    onClose: () => void;
    product: Product | null;
    token: string | null;
}

export default function VariantManagementModal({ visible, onClose, product, token }: VariantManagementModalProps) {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
    const [formName, setFormName] = useState("");
    const [formPriceAdj, setFormPriceAdj] = useState("");
    const [formStock, setFormStock] = useState("");

    const { currentOutlet } = useOutletStore();

    // Icon helper
    const primaryColor = currentOutlet?.primaryColor || '#3b82f6';
    const secondaryColor = currentOutlet?.secondaryColor || '#f59e0b';
    const primaryLightCurrent = (currentOutlet?.primaryColor || '#3b82f6') + '20'; // ~10-20% opacity
    const secondaryLightCurrent = (currentOutlet?.secondaryColor || '#f59e0b') + '20';

    const fetchVariants = async () => {
        if (!product || !token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/products/${product.id}/variants`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (response.ok) {
                const data = await response.json();
                setVariants(data);
            }
        } catch (error) {
            console.error("Failed to fetch variants:", error);
            Alert.alert("Error", "Gagal memuat varian");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (visible && product) {
            fetchVariants();
            setShowForm(false);
        }
    }, [visible, product]);

    const handleSave = async () => {
        if (!formName.trim()) {
            Alert.alert("Error", "Nama varian harus diisi");
            return;
        }

        setIsSaving(true);
        try {
            const url = editingVariant
                ? `${API_URL}/products/${product?.id}/variants/${editingVariant.id}`
                : `${API_URL}/products/${product?.id}/variants`;

            const method = editingVariant ? 'PUT' : 'POST';
            const body = {
                name: formName,
                priceAdjustment: parseFloat(formPriceAdj) || 0,
                stock: parseInt(formStock) || 0,
                type: 'size', // Default for now
                isActive: true
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Gagal menyimpan varian");
            }

            setShowForm(false);
            fetchVariants();
            Alert.alert("Sukses", editingVariant ? "Varian diperbarui" : "Varian ditambahkan");
        } catch (error: any) {
            Alert.alert("Gagal", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (variant: Variant) => {
        Alert.alert(
            "Hapus Varian",
            `Yakin ingin menghapus varian "${variant.name}"?`,
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_URL}/products/${product?.id}/variants/${variant.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                }
                            });
                            if (response.ok) {
                                fetchVariants();
                                Alert.alert("Sukses", "Varian dihapus");
                            } else {
                                const err = await response.json();
                                Alert.alert("Error", err.error || "Gagal hapus varian");
                            }
                        } catch (e) {
                            Alert.alert("Error", "Gagal menghubungi server");
                        }
                    }
                }
            ]
        );
    };

    const openForm = (variant?: Variant) => {
        if (variant) {
            setEditingVariant(variant);
            setFormName(variant.name);
            setFormPriceAdj(variant.priceAdjustment.toString());
            setFormStock(variant.stock.toString());
        } else {
            setEditingVariant(null);
            setFormName("");
            setFormPriceAdj("");
            setFormStock("");
        }
        setShowForm(true);
    };

    const renderItem = ({ item }: { item: Variant }) => (
        <View className="flex-row items-center justify-between bg-zinc-50 p-4 mb-2 rounded-xl border border-zinc-200">
            <View className="flex-1">
                <Text className="text-zinc-900 font-bold text-base">{item.name}</Text>
                <Text className="text-zinc-500 text-sm">
                    Stock: {item.stock} | +Rp {parseFloat(item.priceAdjustment).toLocaleString('id-ID')}
                </Text>
            </View>
            <View className="flex-row gap-2">
                <TouchableOpacity
                    onPress={() => openForm(item)}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: primaryLightCurrent }}
                >
                    <MaterialCommunityIcons name="pencil" size={20} color={primaryColor} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    className="p-2 bg-red-50 rounded-lg border border-red-100"
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-3xl h-[85%] flex-col">
                    {/* Header */}
                    <View className="flex-row justify-between items-center p-6 border-b border-zinc-100">
                        <View>
                            <Text className="text-xl font-bold text-zinc-900">Kelola Varian</Text>
                            <Text className="text-zinc-500 text-sm">{product?.name}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-100 rounded-full">
                            <MaterialCommunityIcons name="close" size={24} color="#71717a" />
                        </TouchableOpacity>
                    </View>

                    {showForm ? (
                        <View className="p-6 flex-1">
                            <Text className="text-lg font-bold mb-4 text-zinc-900">
                                {editingVariant ? 'Edit Varian' : 'Tambah Varian Baru'}
                            </Text>

                            <View className="gap-4">
                                <View>
                                    <Text className="text-sm font-medium text-zinc-700 mb-1.5">Nama Varian *</Text>
                                    <TextInput
                                        value={formName}
                                        onChangeText={setFormName}
                                        placeholder="Contoh: Large, Extra Shot, dll"
                                        className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                                    />
                                </View>

                                <View>
                                    <Text className="text-sm font-medium text-zinc-700 mb-1.5">Penyesuaian Harga (+Rp)</Text>
                                    <TextInput
                                        value={formPriceAdj}
                                        onChangeText={(text) => setFormPriceAdj(text.replace(/[^0-9]/g, ''))}
                                        placeholder="0"
                                        keyboardType="number-pad"
                                        className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                                    />
                                </View>

                                <View>
                                    <Text className="text-sm font-medium text-zinc-700 mb-1.5">Stok Awal</Text>
                                    <TextInput
                                        value={formStock}
                                        onChangeText={(text) => setFormStock(text.replace(/[^0-9]/g, ''))}
                                        placeholder="0"
                                        keyboardType="number-pad"
                                        className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                                    />
                                </View>

                                <View className="flex-row gap-3 mt-4">
                                    <TouchableOpacity
                                        onPress={() => setShowForm(false)}
                                        className="flex-1 bg-zinc-100 py-4 rounded-xl items-center"
                                    >
                                        <Text className="text-zinc-700 font-bold">Batal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSave}
                                        disabled={isSaving}
                                        className="flex-1 py-4 rounded-xl items-center"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className="text-white font-bold">Simpan</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <>
                            <FlatList
                                data={variants}
                                renderItem={renderItem}
                                keyExtractor={item => item.id}
                                contentContainerStyle={{ padding: 24 }}
                                refreshControl={
                                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVariants(); }} />
                                }
                                ListEmptyComponent={
                                    !isLoading ? (
                                        <View className="items-center justify-center py-10">
                                            <MaterialCommunityIcons name="tag-outline" size={48} color="#d4d4d8" />
                                            <Text className="text-zinc-400 mt-2">Belum ada varian</Text>
                                        </View>
                                    ) : (
                                        <ActivityIndicator size="large" color={primaryColor} className="mt-10" />
                                    )
                                }
                            />

                            <View className="p-6 border-t border-zinc-100 bg-white pb-10">
                                <TouchableOpacity
                                    onPress={() => openForm()}
                                    className="py-4 rounded-xl flex-row items-center justify-center gap-2"
                                    style={{ backgroundColor: secondaryColor }}
                                >
                                    <MaterialCommunityIcons name="plus" size={24} color="#18181b" />
                                    <Text className="text-zinc-900 font-bold text-base">Tambah Varian</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

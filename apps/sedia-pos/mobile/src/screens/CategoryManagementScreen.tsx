import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

interface CategoryManagementScreenProps {
    onBack: () => void;
    onOpenDrawer: () => void;
}

interface Category {
    id: string;
    name: string;
    description?: string;
    _count?: {
        products: number;
    };
}

export default function CategoryManagementScreen({ onBack, onOpenDrawer }: CategoryManagementScreenProps) {
    const { currentOutlet } = useOutletStore();
    const { token } = useAuthStore();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formName, setFormName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchCategories = async () => {
        if (!currentOutlet || !token) return;

        try {
            const queryParams = new URLSearchParams({
                outletId: currentOutlet.id
            });

            const response = await fetch(`${API_URL}/categories?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setCategories(data.data || data); // Handle potentially different response structure
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [currentOutlet]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCategories();
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormName(category.name);
        } else {
            setEditingCategory(null);
            setFormName("");
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            Alert.alert("Error", "Nama kategori harus diisi");
            return;
        }

        setIsSaving(true);
        try {
            const url = editingCategory
                ? `${API_URL}/categories/${editingCategory.id}`
                : `${API_URL}/categories`;

            const method = editingCategory ? 'PATCH' : 'POST';

            const body = {
                outletId: currentOutlet?.id,
                name: formName,
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
            fetchCategories();
            Alert.alert("Sukses", editingCategory ? "Kategori diperbarui" : "Kategori ditambahkan");
        } catch (error: any) {
            Alert.alert("Gagal", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (category: Category) => {
        Alert.alert(
            "Hapus Kategori",
            `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`,
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_URL}/categories/${category.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Origin': API_URL.replace('/api', ''),
                                },
                            });

                            if (response.ok) {
                                fetchCategories();
                                Alert.alert("Sukses", "Kategori dihapus");
                            } else {
                                const errData = await response.json();
                                Alert.alert("Gagal", errData.error || "Gagal menghapus kategori");
                            }
                        } catch (error: any) {
                            Alert.alert("Gagal", error.message);
                        }
                    }
                }
            ]
        );
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: Category }) => (
        <TouchableOpacity
            onPress={() => handleOpenModal(item)}
            className="flex-row items-center bg-white p-4 mb-2 rounded-xl border border-zinc-100"
        >
            <View className="h-10 w-10 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: (currentOutlet?.primaryColor || '#6366f1') + '15' }}>
                <MaterialCommunityIcons name="shape" size={20} color={currentOutlet?.primaryColor || "#6366f1"} />
            </View>
            <View className="flex-1">
                <Text className="text-zinc-900 font-bold text-base">{item.name}</Text>
                {item._count?.products !== undefined && (
                    <Text className="text-zinc-500 text-xs">{item._count.products} Produk</Text>
                )}
            </View>
            <TouchableOpacity
                onPress={() => handleDelete(item)}
                className="h-8 w-8 items-center justify-center rounded-lg bg-red-50 mr-2"
            >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#d4d4d8" />
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
                    <Text className="text-xl font-black" style={{ color: currentOutlet?.primaryColor || '#18181b' }}>Kategori</Text>
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
                        placeholder="Cari kategori..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 ml-2 text-base text-zinc-900"
                        placeholderTextColor="#a1a1aa"
                    />
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredCategories}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !isLoading ? (
                        <View className="items-center justify-center py-20">
                            <MaterialCommunityIcons name="shape-outline" size={48} color="#d4d4d8" />
                            <Text className="text-zinc-400 mt-2 font-medium">Belum ada kategori</Text>
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
                    <View className="bg-white rounded-t-3xl p-6 h-[50%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-zinc-900">
                                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#71717a" />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text className="text-sm font-medium text-zinc-700 mb-1.5">Nama Kategori *</Text>
                                <TextInput
                                    value={formName}
                                    onChangeText={setFormName}
                                    placeholder="Contoh: Minuman"
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
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

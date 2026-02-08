import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { useNavigation, useRoute } from '@react-navigation/native';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

interface Category {
    id: string;
    name: string;
}

interface StockOpnameCreateScreenProps {
    onBack: () => void;
    onNavigate: (screen: string, params?: any) => void;
}

export default function StockOpnameCreateScreen({ onBack, onNavigate }: StockOpnameCreateScreenProps) {
    // const navigation = useNavigation<any>();
    const { currentOutlet } = useOutletStore();
    const { token } = useAuthStore();

    const [notes, setNotes] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);

    // UI State
    const [isSaving, setIsSaving] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        if (!currentOutlet) return;
        setIsLoadingCategories(true);
        try {
            const response = await fetch(`${API_URL}/categories?outletId=${currentOutlet.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const handleCreate = async () => {
        if (!currentOutlet) return;

        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/inventory/opname`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                },
                body: JSON.stringify({
                    outletId: currentOutlet.id,
                    notes: notes,
                    categoryId: selectedCategory?.id || 'all'
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Navigate to Detail Screen with the new ID
                onNavigate('stock_opname_detail', { opnameId: data.id });
            } else {
                Alert.alert("Gagal", data.error || "Gagal membuat sesi stock opname");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Terjadi kesalahan jaringan");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-zinc-50" edges={['top']}>
            {/* Header */}
            <View className="px-5 py-4 bg-white border-b border-zinc-200 flex-row items-center justify-between">
                <TouchableOpacity onPress={onBack} className="p-2 -ml-2 rounded-full active:bg-zinc-100">
                    <MaterialCommunityIcons name="close" size={24} color="#3f3f46" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-zinc-800">Opname Baru</Text>
                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: isSaving ? '#e4e4e7' : (currentOutlet?.primaryColor || '#0f766e') }}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#71717a" />
                    ) : (
                        <Text className="text-white font-bold text-sm">Mulai</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5">
                <View className="mb-6">
                    <Text className="text-sm font-bold text-zinc-700 mb-2">Catatan (Optional)</Text>
                    <TextInput
                        className="bg-white border border-zinc-200 rounded-xl p-4 text-zinc-800 h-32"
                        placeholder="Contoh: Opname Bulan Februari, Rak Bagian Depan..."
                        multiline
                        textAlignVertical="top"
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>

                <View className="mb-6">
                    <Text className="text-sm font-bold text-zinc-700 mb-2">Filter Kategori (Optional)</Text>
                    <Text className="text-xs text-zinc-500 mb-3">
                        Pilih kategori jika Anda hanya ingin melakukan stock opname pada sebagian produk.
                    </Text>

                    <TouchableOpacity
                        onPress={() => setCategoryModalVisible(true)}
                        className="bg-white border border-zinc-200 rounded-xl p-4 flex-row justify-between items-center active:bg-zinc-50"
                    >
                        <Text className={selectedCategory ? "text-zinc-900 font-medium" : "text-zinc-500"}>
                            {selectedCategory ? selectedCategory.name : "Semua Kategori"}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#71717a" />
                    </TouchableOpacity>
                </View>

                <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex-row gap-3">
                    <MaterialCommunityIcons name="information-outline" size={20} color="#2563eb" />
                    <View className="flex-1">
                        <Text className="text-blue-800 font-bold text-sm mb-1">Informasi</Text>
                        <Text className="text-blue-700 text-xs leading-5">
                            Sistem akan mengambil snapshot stok saat Anda menekan tombol "Mulai". Pastikan tidak ada transaksi yang sedang berlangsung untuk hasil yang akurat.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Category Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={categoryModalVisible}
                onRequestClose={() => setCategoryModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl h-[70%]">
                        <View className="p-5 border-b border-zinc-200 flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-zinc-900">Pilih Kategori</Text>
                            <TouchableOpacity onPress={() => setCategoryModalVisible(false)} className="p-2 bg-zinc-100 rounded-full">
                                <MaterialCommunityIcons name="close" size={20} color="#52525b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedCategory(null);
                                    setCategoryModalVisible(false);
                                }}
                                className="p-4 rounded-xl mb-3 border"
                                style={{
                                    backgroundColor: !selectedCategory ? (currentOutlet?.primaryColor || '#0f766e') + '15' : '#ffffff',
                                    borderColor: !selectedCategory ? (currentOutlet?.primaryColor || '#0f766e') : '#f4f4f5'
                                }}
                            >
                                <View className="flex-row justify-between items-center">
                                    <Text
                                        className="font-bold"
                                        style={{ color: !selectedCategory ? (currentOutlet?.primaryColor || '#0f766e') : '#3f3f46' }}
                                    >
                                        Semua Kategori
                                    </Text>
                                    {!selectedCategory && <MaterialCommunityIcons name="check" size={20} color={currentOutlet?.secondaryColor || "#f59e0b"} />}
                                </View>
                            </TouchableOpacity>

                            {isLoadingCategories ? (
                                <ActivityIndicator size="large" color={currentOutlet?.secondaryColor || "#c28f09"} className="mt-10" />
                            ) : (
                                categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => {
                                            setSelectedCategory(cat);
                                            setCategoryModalVisible(false);
                                        }}
                                        className={`p-4 rounded-xl mb-3 border ${selectedCategory?.id === cat.id ? 'bg-primary-50 border-primary-200' : 'bg-white border-zinc-100'}`}
                                    >
                                        <View className="flex-row justify-between items-center">
                                            <Text className={`font-medium ${selectedCategory?.id === cat.id ? 'text-primary-700' : 'text-zinc-700'}`}>
                                                {cat.name}
                                            </Text>
                                            {selectedCategory?.id === cat.id && <MaterialCommunityIcons name="check" size={20} color="#c28f09" />}
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

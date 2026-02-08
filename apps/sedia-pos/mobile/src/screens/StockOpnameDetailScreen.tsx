import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useOutletStore } from '../store/outletStore';
import { API_URL } from '../config/api';

interface OpnameItem {
    id: string;
    productId: string;
    systemStock: number;
    actualStock: number | null;
    difference: number | null;
    notes: string | null;
    product: {
        name: string;
        sku: string;
    };
    variant?: {
        id: string;
        name: string;
        sku: string | null;
    } | null;
}

interface OpnameDetail {
    id: string;
    date: string;
    status: 'pending' | 'completed';
    notes: string | null;
    items: OpnameItem[];
}

interface StockOpnameDetailScreenProps {
    opnameId: string;
    onBack: () => void;
}

export default function StockOpnameDetailScreen({ opnameId, onBack }: StockOpnameDetailScreenProps) {
    // const navigation = useNavigation<any>();
    // const route = useRoute<any>();
    // const { opnameId } = route.params;
    const { token } = useAuthStore();
    const { currentOutlet } = useOutletStore();

    const [opname, setOpname] = useState<OpnameDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);

    // Edit State
    const [editingItem, setEditingItem] = useState<OpnameItem | null>(null);
    const [editActualStock, setEditActualStock] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (opnameId) {
            fetchOpnameDetail();
        }
    }, [opnameId]);

    const fetchOpnameDetail = async () => {
        try {
            const response = await fetch(`${API_URL}/inventory/opname/${opnameId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setOpname(data);
            } else {
                Alert.alert("Error", "Gagal memuat detail opname");
                onBack();
            }
        } catch (error) {
            console.error("Fetch detail error:", error);
            Alert.alert("Error", "Terjadi kesalahan jaringan");
        } finally {
            setIsLoading(false);
        }
    };

    const openEditModal = (item: OpnameItem) => {
        if (opname?.status === 'completed') return;
        setEditingItem(item);
        setEditActualStock(item.actualStock !== null ? String(item.actualStock) : '');
        setEditNotes(item.notes || '');
        setModalVisible(true);
    };

    const saveItemDraft = async () => {
        if (!editingItem || !opname) return;

        const actual = editActualStock === '' ? null : parseInt(editActualStock);
        if (actual !== null && isNaN(actual)) {
            Alert.alert("Error", "Jumlah stok harus berupa angka");
            return;
        }

        // Optimistic Update
        const updatedItems = opname.items.map(item => {
            if (item.id === editingItem.id) {
                return {
                    ...item,
                    actualStock: actual,
                    difference: actual !== null ? actual - item.systemStock : null,
                    notes: editNotes
                };
            }
            return item;
        });

        setOpname({ ...opname, items: updatedItems });
        setModalVisible(false);

        // Background Save
        try {
            await fetch(`${API_URL}/inventory/opname/${opnameId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: [{
                        id: editingItem.id,
                        actualStock: actual,
                        notes: editNotes
                    }]
                })
            });
        } catch (error) {
            console.error("Background save failed:", error);
            // Optionally revert or show toast
        }
    };

    const handleFinalize = () => {
        Alert.alert(
            "Finalisasi Stock Opname",
            "Stok produk di sistem akan diperbarui sesuai dengan 'Stok Fisik' yang Anda masukkan. Tindakan ini tidak dapat dibatalkan.",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Finalisasi",
                    style: "destructive",
                    onPress: confirmFinalize
                }
            ]
        );
    };

    const confirmFinalize = async () => {
        setIsFinalizing(true);
        try {
            const response = await fetch(`${API_URL}/inventory/opname/${opnameId}/finalize`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Sukses", `Stock opname selesai. ${data.adjustmentsCount} produk disesuaikan.`);
                onBack();
            } else {
                Alert.alert("Gagal", data.error || "Gagal memfinalisasi opname");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsFinalizing(false);
        }
    };

    const renderItem = ({ item }: { item: OpnameItem }) => {
        const isFilled = item.actualStock !== null;

        return (
            <TouchableOpacity
                onPress={() => openEditModal(item)}
                className="bg-white p-4 mb-2 rounded-xl border"
                style={{
                    borderColor: isFilled ? (currentOutlet?.secondaryColor || '#f59e0b') + '30' : '#f4f4f5',
                    backgroundColor: isFilled ? (currentOutlet?.secondaryColor || '#f59e0b') + '10' : '#ffffff'
                }}
            >
                <View className="flex-row justify-between mb-2">
                    <View className="flex-1 mr-2">
                        <Text className="font-bold text-zinc-800 text-base">
                            {item.variant ? `${item.product.name} - ${item.variant.name}` : item.product.name}
                        </Text>
                        {(item.variant?.sku || item.product.sku) && (
                            <Text className="text-xs text-zinc-500 mt-1">
                                SKU: {item.variant?.sku || item.product.sku}
                            </Text>
                        )}
                    </View>
                </View>

                <View className="flex-row items-center justify-between mt-1">
                    <View className="items-center flex-1 border-r border-zinc-100">
                        <Text className="text-[10px] text-zinc-400 uppercase tracking-wider">Sistem</Text>
                        <Text className="text-lg font-medium text-zinc-600">{item.systemStock}</Text>
                    </View>

                    <View className="items-center flex-1 border-r border-zinc-100">
                        <Text className="text-[10px] text-zinc-400 uppercase tracking-wider">Fisik</Text>
                        <Text
                            className="text-lg font-bold"
                            style={{ color: isFilled ? (currentOutlet?.primaryColor || '#0f766e') : '#d4d4d8' }}
                        >
                            {isFilled ? item.actualStock : '-'}
                        </Text>
                    </View>

                    <View className="items-center flex-1">
                        <Text className="text-[10px] text-zinc-400 uppercase tracking-wider">Selisih</Text>
                        <Text className={`text-lg font-bold ${!isFilled
                            ? 'text-zinc-300'
                            : item.difference === 0
                                ? 'text-green-600'
                                : 'text-red-500'
                            }`}>
                            {isFilled ? (item.difference! > 0 ? `+${item.difference}` : item.difference) : '-'}
                        </Text>
                    </View>
                </View>

                {item.notes && (
                    <View className="mt-3 bg-yellow-50 p-2 rounded-lg flex-row gap-2">
                        <MaterialCommunityIcons name="note-text-outline" size={14} color="#a16207" />
                        <Text className="text-xs text-yellow-800 flex-1">{item.notes}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-zinc-50">
                <ActivityIndicator size="large" color={currentOutlet?.secondaryColor || "#c28f09"} />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-zinc-50" edges={['top']}>
            {/* Header */}
            <View className="px-5 py-4 bg-white border-b border-zinc-200 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="p-2 -ml-2 rounded-full active:bg-zinc-100">
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#3f3f46" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-lg font-bold text-zinc-800">Detail Opname</Text>
                        <Text className="text-xs text-zinc-500">
                            {opname?.status === 'completed' ? 'Selesai' : 'Sedang Berjalan'} • {opname?.items.length} Barang
                        </Text>
                    </View>
                </View>

                {opname?.status === 'pending' && (
                    <TouchableOpacity
                        onPress={handleFinalize}
                        disabled={isFinalizing}
                        className="px-3 py-2 rounded-lg flex-row items-center gap-1 shadow-sm"
                        style={{ backgroundColor: isFinalizing ? '#e4e4e7' : '#16a34a' }}
                    >
                        {isFinalizing ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="check-all" size={16} color="white" />
                                <Text className="text-white text-xs font-bold">Selesai</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            <FlatList
                data={opname?.items || []}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
            />

            {/* Input Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 bg-black/50 justify-center items-center p-6"
                >
                    <View className="bg-white w-full rounded-2xl p-6 shadow-xl">
                        <View className="flex-row justify-between items-start mb-4">
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-zinc-800">
                                    {editingItem?.variant ? `${editingItem.product.name} - ${editingItem.variant.name}` : editingItem?.product.name}
                                </Text>
                                <Text className="text-sm text-zinc-500">
                                    Stok Sistem: {editingItem?.systemStock}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-zinc-100 p-2 rounded-full">
                                <MaterialCommunityIcons name="close" size={20} color="#52525b" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-xs font-bold text-zinc-500 uppercase mb-2">Stok Fisik (Actual)</Text>
                        <TextInput
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xl font-bold text-zinc-900 mb-4"
                            keyboardType="number-pad"
                            placeholder="0"
                            autoFocus
                            value={editActualStock}
                            onChangeText={setEditActualStock}
                        />

                        <Text className="text-xs font-bold text-zinc-500 uppercase mb-2">Catatan (Optional)</Text>
                        <TextInput
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 mb-6 h-20"
                            placeholder="Ada kerusakan, barang hilang, dll..."
                            multiline
                            textAlignVertical="top"
                            value={editNotes}
                            onChangeText={setEditNotes}
                        />

                        <TouchableOpacity
                            onPress={saveItemDraft}
                            className="w-full py-4 rounded-xl items-center shadow-lg"
                            style={{
                                backgroundColor: currentOutlet?.primaryColor || '#0f766e',
                                shadowColor: currentOutlet?.primaryColor || '#0f766e',
                                shadowOpacity: 0.3,
                                shadowRadius: 5
                            }}
                        >
                            <Text className="text-white font-bold text-base">Simpan</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

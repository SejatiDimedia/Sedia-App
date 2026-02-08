import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';

interface StockAdjustmentModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (adjustment: number, notes?: string) => Promise<void>;
    currentItem: { name: string; currentStock: number } | null;
}

export default function StockAdjustmentModal({ visible, onClose, onSave, currentItem }: StockAdjustmentModalProps) {
    const { currentOutlet } = useOutletStore();
    const [newStock, setNewStock] = useState("");
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Colors
    const primaryColor = currentOutlet?.primaryColor || '#3b82f6';
    const secondaryColor = currentOutlet?.secondaryColor || '#f59e0b';

    useEffect(() => {
        if (visible && currentItem) {
            setNewStock(currentItem.currentStock.toString());
            setNotes("");
        }
    }, [visible, currentItem]);

    const handleSave = async () => {
        if (!currentItem) return;

        const stockValue = parseInt(newStock);
        if (isNaN(stockValue)) {
            Alert.alert("Error", "Masukkan jumlah stok yang valid");
            return;
        }

        const adjustment = stockValue - currentItem.currentStock;

        if (adjustment === 0) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            await onSave(adjustment, notes);
            onClose();
        } catch (error) {
            // Error handling should be done in parent
        } finally {
            setIsSaving(false);
        }
    };

    const adjustment = parseInt(newStock) - (currentItem?.currentStock || 0);
    const adjustmentText = !isNaN(adjustment) && adjustment !== 0
        ? `(${adjustment > 0 ? '+' : ''}${adjustment})`
        : '';
    const adjustmentColor = adjustment > 0 ? 'text-green-600' : (adjustment < 0 ? 'text-red-600' : 'text-zinc-400');

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl h-[60%] flex-col">
                        <View className="flex-row justify-between items-center p-6 border-b border-zinc-100">
                            <View>
                                <Text className="text-xl font-bold text-zinc-900">Ubah Stok</Text>
                                <Text className="text-zinc-500 text-sm" numberOfLines={1}>
                                    {currentItem?.name}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-100 rounded-full">
                                <MaterialCommunityIcons name="close" size={24} color="#71717a" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-6">
                            <View className="flex-row gap-4 mb-6">
                                <View className="flex-1 p-4 bg-zinc-50 rounded-xl border border-zinc-100 items-center">
                                    <Text className="text-zinc-500 text-xs mb-1 uppercase tracking-wider font-medium">Stok Saat Ini</Text>
                                    <Text className="text-2xl font-bold text-zinc-900">{currentItem?.currentStock}</Text>
                                </View>
                                <View className="items-center justify-center">
                                    <MaterialCommunityIcons name="arrow-right" size={24} color="#d4d4d8" />
                                </View>
                                <View className="flex-1 p-4 bg-blue-50 rounded-xl border border-blue-100 items-center">
                                    <Text className="text-blue-600 text-xs mb-1 uppercase tracking-wider font-medium">Stok Baru</Text>
                                    <Text className={`text-2xl font-bold ${adjustmentColor}`}>
                                        {newStock || "0"} {adjustmentText}
                                    </Text>
                                </View>
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm font-medium text-zinc-700 mb-1.5">Masukkan Jumlah Stok Baru</Text>
                                <TextInput
                                    value={newStock}
                                    onChangeText={(text) => setNewStock(text.replace(/[^0-9-]/g, ''))}
                                    placeholder="0"
                                    keyboardType="number-pad"
                                    autoFocus={true}
                                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-4 text-xl text-center font-bold text-zinc-900"
                                />
                            </View>

                            <View className="mb-6">
                                <Text className="text-sm font-medium text-zinc-700 mb-1.5">Catatan (Opsional)</Text>
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="Contoh: Barang rusak, stock opname, dll"
                                    multiline
                                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900 h-24 text-top"
                                    textAlignVertical="top"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isSaving}
                                className="py-4 rounded-xl items-center shadow-sm mb-8"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-base">Simpan Perubahan</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

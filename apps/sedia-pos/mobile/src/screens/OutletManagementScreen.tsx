import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Modal, Alert, RefreshControl, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore, Outlet } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';

interface OutletManagementScreenProps {
    onBack: () => void;
}

export default function OutletManagementScreen({ onBack }: OutletManagementScreenProps) {
    const { outlets, fetchOutlets, createOutlet, updateOutlet, deleteOutlet, isLoading: isStoreLoading, currentOutlet } = useOutletStore();
    const { token } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
    const [formName, setFormName] = useState("");
    const [formAddress, setFormAddress] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (token) {
            fetchOutlets(token);
        }
    }, [token]);

    const onRefresh = async () => {
        setRefreshing(true);
        if (token) {
            await fetchOutlets(token);
        }
        setRefreshing(false);
    };

    const handleOpenModal = (outlet?: Outlet) => {
        if (outlet) {
            setEditingOutlet(outlet);
            setFormName(outlet.name);
            setFormAddress(outlet.address || "");
            setFormPhone(outlet.phone || "");
        } else {
            setEditingOutlet(null);
            setFormName("");
            setFormAddress("");
            setFormPhone("");
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            Alert.alert("Error", "Nama outlet harus diisi");
            return;
        }

        setIsSaving(true);
        try {
            const data = {
                name: formName,
                address: formAddress || undefined,
                phone: formPhone || undefined,
            };

            if (editingOutlet) {
                await updateOutlet(editingOutlet.id, data);
                Alert.alert("Sukses", "Outlet berhasil diperbarui");
            } else {
                await createOutlet(data);
                Alert.alert("Sukses", "Outlet berhasil ditambahkan");
            }
            setModalVisible(false);
        } catch (error: any) {
            Alert.alert("Gagal", error.message || "Gagal menyimpan data");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        if (id === currentOutlet?.id) {
            Alert.alert("Peringatan", "Anda tidak dapat menghapus outlet yang sedang aktif digunakan.");
            return;
        }

        Alert.alert(
            "Hapus Outlet",
            "Apakah Anda yakin ingin menghapus outlet ini? Tindakan ini tidak dapat dibatalkan.",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteOutlet(id);
                            Alert.alert("Sukses", "Outlet berhasil dihapus");
                        } catch (error: any) {
                            Alert.alert("Gagal", error.message || "Gagal menghapus outlet");
                        }
                    }
                }
            ]
        );
    };

    const filteredOutlets = outlets.filter(outlet =>
        outlet.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).filter(o => o.id !== 'default-outlet');

    const renderItem = ({ item }: { item: Outlet }) => (
        <TouchableOpacity
            onPress={() => handleOpenModal(item)}
            className="flex-row items-center bg-white p-4 mb-3 rounded-2xl border border-zinc-100 shadow-sm"
        >
            <View className="h-12 w-12 rounded-xl bg-primary-50 items-center justify-center mr-4">
                <MaterialCommunityIcons name="storefront" size={24} color="#377f7e" />
            </View>
            <View className="flex-1">
                <View className="flex-row items-center">
                    <Text className="text-zinc-900 font-bold text-base mr-2">{item.name}</Text>
                    {item.id === currentOutlet?.id && (
                        <View className="bg-primary-100 px-2 py-0.5 rounded-full">
                            <Text className="text-primary-700 text-[10px] font-bold">AKTIF</Text>
                        </View>
                    )}
                </View>
                {item.address && (
                    <Text className="text-zinc-500 text-sm mt-0.5" numberOfLines={1}>
                        {item.address}
                    </Text>
                )}
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2">
                <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-zinc-50">
            {/* Header */}
            <View className="bg-white px-4 pt-12 pb-4 border-b border-zinc-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={onBack} className="mr-3">
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#18181b" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-xl font-bold text-zinc-900 leading-tight">Manajemen Outlet</Text>
                            <Text className="text-zinc-500 text-sm">Kelola cabang usaha Anda</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleOpenModal()}
                        className="bg-primary-600 px-4 py-2 rounded-xl flex-row items-center shadow-lg shadow-primary-500/20"
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white" />
                        <Text className="text-white font-bold ml-1">Tambah</Text>
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View className="flex-row items-center bg-zinc-100 px-3 py-2.5 rounded-xl border border-zinc-200">
                    <MaterialCommunityIcons name="magnify" size={20} color="#71717a" />
                    <TextInput
                        className="flex-1 ml-2 text-zinc-900 text-sm h-6"
                        placeholder="Cari nama outlet..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#a1a1aa"
                    />
                </View>
            </View>

            <FlatList
                data={filteredOutlets}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        {isStoreLoading ? (
                            <ActivityIndicator size="large" color="#377f7e" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="store-off-outline" size={64} color="#d4d4d8" />
                                <Text className="text-zinc-400 mt-4 text-center">
                                    {searchQuery ? "Outlet tidak ditemukan" : "Belum ada outlet terdaftar"}
                                </Text>
                            </>
                        )}
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />

            {/* Outlet Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-end bg-black/40"
                >
                    <View className="bg-white rounded-t-[32px] max-h-[85%] border-t border-zinc-100 shadow-2xl">
                        <View className="p-6 border-b border-zinc-100 flex-row items-center justify-between">
                            <Text className="text-xl font-bold text-zinc-900">
                                {editingOutlet ? 'Edit Outlet' : 'Tambah Outlet Baru'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-zinc-100 p-2 rounded-full">
                                <MaterialCommunityIcons name="close" size={20} color="#18181b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-6">
                            <View className="space-y-6 mb-10">
                                <View>
                                    <Text className="text-sm font-medium text-zinc-700 mb-1.5">Nama Outlet *</Text>
                                    <View className="flex-row items-center bg-zinc-50 border border-zinc-200 rounded-2xl px-4 h-14">
                                        <MaterialCommunityIcons name="store-outline" size={20} color="#a1a1aa" />
                                        <TextInput
                                            className="flex-1 ml-3 text-zinc-900 font-medium"
                                            value={formName}
                                            onChangeText={setFormName}
                                            placeholder="Contoh: Sedia Coffee - Jakarta"
                                            placeholderTextColor="#a1a1aa"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-sm font-medium text-zinc-700 mb-1.5">Alamat Lengkap</Text>
                                    <View className="flex-row bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 min-h-[100]">
                                        <MaterialCommunityIcons name="map-marker-outline" size={20} color="#a1a1aa" style={{ marginTop: 2 }} />
                                        <TextInput
                                            className="flex-1 ml-3 text-zinc-900 font-medium"
                                            value={formAddress}
                                            onChangeText={setFormAddress}
                                            placeholder="Jl. Raya No. 123..."
                                            placeholderTextColor="#a1a1aa"
                                            multiline
                                            textAlignVertical="top"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-sm font-medium text-zinc-700 mb-1.5">Nomor Telepon</Text>
                                    <View className="flex-row items-center bg-zinc-50 border border-zinc-200 rounded-2xl px-4 h-14">
                                        <MaterialCommunityIcons name="phone-outline" size={20} color="#a1a1aa" />
                                        <TextInput
                                            className="flex-1 ml-3 text-zinc-900 font-medium"
                                            value={formPhone}
                                            onChangeText={setFormPhone}
                                            placeholder="081234..."
                                            placeholderTextColor="#a1a1aa"
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-[32px]">
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isSaving}
                                className={`h-14 rounded-2xl items-center justify-center shadow-lg shadow-primary-500/20 ${isSaving ? 'bg-zinc-400' : 'bg-primary-600'}`}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">
                                        {editingOutlet ? 'Simpan Perubahan' : 'Tambah Outlet'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

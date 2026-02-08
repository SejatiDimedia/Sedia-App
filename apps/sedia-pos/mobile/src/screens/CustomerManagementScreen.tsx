import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

interface CustomerManagementScreenProps {
    onBack: () => void;
    onOpenDrawer: () => void;
}

interface Customer {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    points: number;
    totalSpent: string;
}

export default function CustomerManagementScreen({ onBack, onOpenDrawer }: CustomerManagementScreenProps) {
    const { currentOutlet } = useOutletStore();
    const { token } = useAuthStore();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formName, setFormName] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchCustomers = async () => {
        if (!currentOutlet || !token) return;

        try {
            const queryParams = new URLSearchParams({
                outletId: currentOutlet.id,
                search: searchQuery
            });

            const response = await fetch(`${API_URL}/customers?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setCustomers(data);
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCustomers();
        }, 500); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [searchQuery, currentOutlet]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCustomers();
    };

    const handleOpenModal = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormName(customer.name);
            setFormPhone(customer.phone || "");
            setFormEmail(customer.email || "");
        } else {
            setEditingCustomer(null);
            setFormName("");
            setFormPhone("");
            setFormEmail("");
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            Alert.alert("Error", "Nama pelanggan harus diisi");
            return;
        }

        setIsSaving(true);
        try {
            const url = editingCustomer
                ? `${API_URL}/customers/${editingCustomer.id}`
                : `${API_URL}/customers`;

            const method = editingCustomer ? 'PUT' : 'POST';

            const body = {
                outletId: currentOutlet?.id,
                name: formName,
                phone: formPhone,
                email: formEmail,
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal menyimpan data");
            }

            setModalVisible(false);
            fetchCustomers();
            Alert.alert("Sukses", editingCustomer ? "Data berhasil diperbarui" : "Pelanggan baru berhasil ditambahkan");
        } catch (error: any) {
            Alert.alert("Gagal", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const renderItem = ({ item }: { item: Customer }) => (
        <TouchableOpacity
            onPress={() => handleOpenModal(item)}
            className="flex-row items-center bg-white p-4 mb-2 rounded-xl border border-zinc-100"
        >
            <View
                className="h-10 w-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: (currentOutlet?.primaryColor || '#0f766e') + '15' }}
            >
                <Text
                    className="font-bold text-lg"
                    style={{ color: currentOutlet?.primaryColor || '#0f766e' }}
                >
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View className="flex-1">
                <Text className="text-zinc-900 font-bold text-base">{item.name}</Text>
                {(item.phone || item.email) && (
                    <Text className="text-zinc-500 text-sm">
                        {[item.phone, item.email].filter(Boolean).join(' • ')}
                    </Text>
                )}
            </View>
            <View className="items-end">
                <View
                    className="px-2 py-0.5 rounded-full mb-1"
                    style={{ backgroundColor: (currentOutlet?.secondaryColor || '#f59e0b') + '20' }}
                >
                    <Text
                        className="text-xs font-bold"
                        style={{ color: currentOutlet?.secondaryColor || '#92400e' }}
                    >
                        {item.points} Poin
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-zinc-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-14 pb-4 bg-white border-b border-zinc-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
                        <MaterialCommunityIcons name="arrow-left" size={24} color={currentOutlet?.primaryColor || "#18181b"} />
                    </TouchableOpacity>
                    <Text className="text-xl font-black" style={{ color: currentOutlet?.primaryColor || '#18181b' }}>Pelanggan</Text>
                </View>
                <TouchableOpacity onPress={onOpenDrawer} className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
                    <MaterialCommunityIcons name="menu" size={24} color={currentOutlet?.primaryColor || "#18181b"} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="p-4 bg-white border-b border-zinc-100">
                <View className="flex-row items-center bg-zinc-100 rounded-xl px-4 py-2">
                    <MaterialCommunityIcons name="magnify" size={20} color="#a1a1aa" />
                    <TextInput
                        placeholder="Cari nama, telepon, atau email..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 ml-2 text-base text-zinc-900"
                        placeholderTextColor="#a1a1aa"
                    />
                </View>
            </View>

            {/* List */}
            <FlatList
                data={customers}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !isLoading ? (
                        <View className="items-center justify-center py-20">
                            <MaterialCommunityIcons name="account-group-outline" size={48} color="#d4d4d8" />
                            <Text className="text-zinc-400 mt-2 font-medium">Belum ada pelanggan ditemukan</Text>
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
                    shadowRadius: 5,
                    elevation: 5
                }}
            >
                <MaterialCommunityIcons name="plus" size={28} color="#18181b" />
            </TouchableOpacity>

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 h-[80%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-zinc-900">
                                {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#71717a" />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text className="text-sm font-medium text-zinc-700 mb-1.5">Nama *</Text>
                                <TextInput
                                    value={formName}
                                    onChangeText={setFormName}
                                    placeholder="Contoh: Budi Santoso"
                                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-zinc-700 mb-1.5">No. Telepon</Text>
                                <TextInput
                                    value={formPhone}
                                    onChangeText={setFormPhone}
                                    placeholder="08123456789"
                                    keyboardType="phone-pad"
                                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-zinc-700 mb-1.5">Email</Text>
                                <TextInput
                                    value={formEmail}
                                    onChangeText={setFormEmail}
                                    placeholder="budi@email.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
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

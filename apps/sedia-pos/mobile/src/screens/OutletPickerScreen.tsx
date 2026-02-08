import '../../global.css';
import React, { useState, useMemo } from 'react';
import { Text, View, TouchableOpacity, FlatList, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useOutletStore, Outlet } from '../store/outletStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface OutletPickerScreenProps {
    onOutletSelected: (outlet: Outlet) => void;
    onLogout: () => void;
}

export default function OutletPickerScreen({ onOutletSelected, onLogout }: OutletPickerScreenProps) {
    const { outlets, isLoading, fetchOutlets } = useOutletStore();
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        fetchOutlets();
    }, []);

    const filteredOutlets = useMemo(() => {
        if (!searchQuery.trim()) return outlets;
        return outlets.filter(outlet =>
            outlet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (outlet.address && outlet.address.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [outlets, searchQuery]);

    const renderOutletCard = ({ item }: { item: Outlet }) => (
        <TouchableOpacity
            onPress={() => onOutletSelected(item)}
            className="mb-4 rounded-[32px] bg-white p-6 shadow-sm active:bg-zinc-50 border border-zinc-100/80"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 15,
                elevation: 2,
            }}
        >
            <View className="flex-row items-center">
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
                    <MaterialCommunityIcons name="storefront-outline" size={32} color="#377f7e" />
                </View>
                <View className="flex-1 ml-4">
                    <Text className="text-xl font-black text-zinc-900 tracking-tight" numberOfLines={1}>
                        {item.name}
                    </Text>
                    {item.address ? (
                        <View className="mt-1 flex-row items-center">
                            <MaterialCommunityIcons name="map-marker-outline" size={14} color="#71717a" />
                            <Text className="text-sm text-zinc-500 ml-1 font-medium" numberOfLines={1}>
                                {item.address}
                            </Text>
                        </View>
                    ) : (
                        <Text className="text-xs text-zinc-400 font-medium mt-1 italic">Alamat belum diatur</Text>
                    )}
                </View>
                <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-50">
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#377f7e" />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-zinc-50"
        >
            {/* Premium Header */}
            <View className="bg-white px-6 pb-8 pt-16 border-b border-zinc-100">
                <View className="flex-row items-center justify-between mb-6">
                    <View>
                        <Text className="text-3xl font-black text-zinc-900 tracking-tighter">
                            Pilih Outlet
                        </Text>
                        <Text className="text-sm font-medium text-zinc-500 mt-0.5">
                            Silahkan pilih cabang untuk bertransaksi
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onLogout}
                        className="h-12 w-12 items-center justify-center rounded-full bg-red-50"
                    >
                        <MaterialCommunityIcons name="logout" size={22} color="#ef4444" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                {!isLoading && outlets.length > 0 && (
                    <View className="flex-row items-center bg-zinc-100 rounded-2xl px-4 py-3 border border-zinc-200/50">
                        <MaterialCommunityIcons name="magnify" size={20} color="#71717a" />
                        <TextInput
                            placeholder="Cari nama atau alamat outlet..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#a1a1aa"
                            className="flex-1 ml-2 text-zinc-900 font-medium py-1"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <MaterialCommunityIcons name="close-circle" size={18} color="#a1a1aa" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            {/* Content Container */}
            <View className="flex-1 px-6 pt-6">
                {isLoading ? (
                    <View className="flex-1 items-center justify-center -mt-10">
                        <ActivityIndicator size="large" color="#377f7e" />
                        <Text className="mt-4 text-zinc-500 font-bold tracking-tight">Menghubungkan ke Pusat...</Text>
                    </View>
                ) : outlets.length === 0 ? (
                    <View className="flex-1 items-center justify-center -mt-10">
                        <View className="h-32 w-32 items-center justify-center rounded-full bg-zinc-100 mb-6">
                            <MaterialCommunityIcons name="store-alert-outline" size={64} color="#d4d4d8" />
                        </View>
                        <Text className="text-2xl font-black text-zinc-900 tracking-tight">Belum Ada Outlet</Text>
                        <Text className="mt-3 text-center text-sm text-zinc-500 font-medium px-8 leading-5">
                            Sepertinya akun Anda belum memiliki outlet. Silakan tambahkan melalui Dashboard Web.
                        </Text>
                    </View>
                ) : filteredOutlets.length === 0 ? (
                    <View className="flex-1 items-center justify-center -mt-10">
                        <MaterialCommunityIcons name="store-search-outline" size={64} color="#d4d4d8" />
                        <Text className="text-xl font-black text-zinc-900 mt-4">Outlet Tidak Ditemukan</Text>
                        <Text className="text-sm text-zinc-500 font-medium mt-1">Coba kata kunci lain</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredOutlets}
                        renderItem={renderOutletCard}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        className="flex-1"
                    />
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

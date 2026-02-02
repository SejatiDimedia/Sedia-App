import '../../global.css';
import React from 'react';
import { Text, View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useOutletStore, Outlet } from '../store/outletStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface OutletPickerScreenProps {
    onOutletSelected: (outlet: Outlet) => void;
    onLogout: () => void;
}

export default function OutletPickerScreen({ onOutletSelected, onLogout }: OutletPickerScreenProps) {
    const { outlets, isLoading, fetchOutlets } = useOutletStore();

    React.useEffect(() => {
        fetchOutlets();
    }, []);

    const renderOutletCard = ({ item }: { item: Outlet }) => (
        <TouchableOpacity
            onPress={() => onOutletSelected(item)}
            className="mb-3 rounded-2xl bg-white p-5 shadow-sm active:opacity-90  border border-zinc-100 "
        >
            <View className="flex-row items-center gap-4">
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 ">
                    <MaterialCommunityIcons name="store" size={28} color="#377f7e" />
                </View>
                <View className="flex-1">
                    <Text className="text-lg font-bold text-zinc-900 ">
                        {item.name}
                    </Text>
                    {item.address && (
                        <View className="mt-1 flex-row items-center gap-1">
                            <MaterialCommunityIcons name="map-marker-outline" size={14} color="#71717a" />
                            <Text className="text-sm text-zinc-500">{item.address}</Text>
                        </View>
                    )}
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#a1a1aa" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-zinc-50 ">
            {/* Header */}
            <View className="bg-primary-600 px-4 pb-8 pt-14 shadow-lg">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-2xl font-bold text-white">
                            Pilih Outlet
                        </Text>
                        <Text className="mt-1 text-sm text-primary-200">
                            Pilih outlet untuk memulai transaksi
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onLogout}
                        className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
                    >
                        <MaterialCommunityIcons name="logout" size={20} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View className="flex-1 p-4 -mt-4">
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#377f7e" />
                        <Text className="mt-3 text-zinc-500">Memuat outlet...</Text>
                    </View>
                ) : outlets.length === 0 ? (
                    <View className="flex-1 items-center justify-center rounded-2xl bg-white p-8 ">
                        <MaterialCommunityIcons name="store-alert-outline" size={48} color="#d4d4d8" />
                        <Text className="mt-4 text-center text-lg font-medium text-zinc-700 ">
                            Belum ada outlet
                        </Text>
                        <Text className="mt-2 text-center text-sm text-zinc-500">
                            Buat outlet pertama Anda di Web Dashboard
                        </Text>
                    </View>
                ) : (
                    <>
                        <View className="mb-4 flex-row items-center gap-2 rounded-xl bg-primary-50 p-3 ">
                            <MaterialCommunityIcons name="information-outline" size={18} color="#377f7e" />
                            <Text className="flex-1 text-sm text-primary-700 ">
                                {outlets.length} outlet tersedia
                            </Text>
                        </View>
                        <FlatList
                            data={outlets}
                            renderItem={renderOutletCard}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    </>
                )}
            </View>
        </View>
    );
}

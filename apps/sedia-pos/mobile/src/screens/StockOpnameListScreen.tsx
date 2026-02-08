import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

interface StockOpname {
    id: string;
    date: string;
    status: 'pending' | 'completed';
    notes: string | null;
    createdAt: string;
}

interface StockOpnameListScreenProps {
    onNavigate: (screen: string, params?: any) => void;
    onBack: () => void;
}

export default function StockOpnameListScreen({ onNavigate, onBack }: StockOpnameListScreenProps) {
    // const navigation = useNavigation<any>();
    const { currentOutlet } = useOutletStore();
    const { token } = useAuthStore();

    const [opnames, setOpnames] = useState<StockOpname[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOpnames = async () => {
        if (!currentOutlet) {
            setIsLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/inventory/opname?outletId=${currentOutlet.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOpnames(data);
            } else {
                console.error("Failed to fetch opnames");
            }
        } catch (error) {
            console.error("Error fetching opnames:", error);
            Alert.alert("Error", "Gagal mengambil data stock opname");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOpnames();
    }, [currentOutlet?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOpnames();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderItem = ({ item }: { item: StockOpname }) => (
        <TouchableOpacity
            onPress={() => onNavigate('stock_opname_detail', { opnameId: item.id })}
            className="bg-white p-4 mb-3 rounded-xl border border-zinc-100 shadow-sm"
        >
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-xs text-zinc-500 font-medium mb-1">
                        {formatDate(item.date)}
                    </Text>
                    <Text className="text-zinc-600 font-medium" numberOfLines={2}>
                        {item.notes || "Tanpa Catatan"}
                    </Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${item.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                    <Text className={`text-xs font-bold ${item.status === 'completed' ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                        {item.status === 'completed' ? 'Selesai' : 'Pending'}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center justify-end mt-2">
                <Text
                    className="text-sm font-bold mr-1"
                    style={{ color: currentOutlet?.primaryColor || '#0f766e' }}
                >
                    {item.status === 'pending' ? 'Lanjutkan' : 'Detail'}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={currentOutlet?.secondaryColor || "#f59e0b"} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-zinc-50" edges={['top']}>
            {/* Header */}
            <View className="px-5 py-4 bg-white border-b border-zinc-200 flex-row items-center justify-between">
                <TouchableOpacity onPress={onBack} className="p-2 -ml-2 rounded-full active:bg-zinc-100">
                    <MaterialCommunityIcons name="arrow-left" size={24} color={currentOutlet?.primaryColor || "#3f3f46"} />
                </TouchableOpacity>
                <Text className="text-lg font-bold" style={{ color: currentOutlet?.primaryColor || '#18181b' }}>Stock Opname</Text>
                <View className="w-10" />
            </View>

            {/* List */}
            {isLoading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={currentOutlet?.secondaryColor || "#c28f09"} />
                </View>
            ) : opnames.length === 0 ? (
                <View className="flex-1 justify-center items-center p-8">
                    <View className="w-16 h-16 bg-zinc-100 rounded-full items-center justify-center mb-4">
                        <MaterialCommunityIcons name="clipboard-list-outline" size={32} color="#a1a1aa" />
                    </View>
                    <Text className="text-zinc-500 text-center font-medium">Belum ada riwayat stock opname</Text>
                    <Text className="text-zinc-400 text-center text-sm mt-1">Tekan tombol + untuk memulai opname baru</Text>
                </View>
            ) : (
                <FlatList
                    data={opnames}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[currentOutlet?.secondaryColor || '#c28f09']}
                        />
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                onPress={() => onNavigate('stock_opname_create')}
                className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg elevation-5"
                style={{ backgroundColor: currentOutlet?.primaryColor || '#0f766e' }}
            >
                <MaterialCommunityIcons name="plus" size={28} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

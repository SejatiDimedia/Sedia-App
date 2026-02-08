import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { API_URL } from '../config/api';
import { useAuthStore } from '../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import ShiftDetailScreen from './ShiftDetailScreen';

/* --- Helper Functions --- */
const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
};

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
};

/* --- Types --- */
interface Shift {
    id: string;
    startTime: string;
    endTime: string | null;
    status: 'open' | 'closed';
    startingCash: string;
    endingCash: string | null;
    difference: string | null;
    employee: {
        name: string;
    };
}

interface ShiftReportScreenProps {
    onBack: () => void;
    onOpenDrawer: () => void;
}

export default function ShiftReportScreen({ onBack, onOpenDrawer }: ShiftReportScreenProps) {
    const { currentOutlet } = useOutletStore();
    const token = useAuthStore((state) => state.token);

    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

    const fetchShifts = async () => {
        if (!currentOutlet) return;

        try {
            const res = await fetch(`${API_URL}/shifts?outletId=${currentOutlet.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                // Determine if API returns flat list or nested { shift, employee }
                // Based on web implementation it returns nested.
                const formatted = Array.isArray(data) ? data.map((item: any) => ({
                    ...item.shift,
                    employee: item.employee
                })) : [];
                setShifts(formatted);
            }
        } catch (error) {
            console.error('Failed to fetch shifts:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, [currentOutlet]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchShifts();
    }, [currentOutlet]);

    const renderShiftItem = ({ item }: { item: Shift }) => {
        const isOpen = item.status === 'open';
        const difference = parseFloat(item.difference || '0');

        return (
            <Pressable
                onPress={() => {
                    console.log('Shift pressed:', item.id);
                    setSelectedShiftId(item.id);
                }}
                style={({ pressed }) => ({
                    backgroundColor: pressed ? '#f4f4f5' : '#ffffff',
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#f4f4f5',
                    marginBottom: 12,
                })}
            >
                <View className="flex-row justify-between items-start mb-2">
                    <View>
                        <View className="flex-row items-center mb-1">
                            <MaterialCommunityIcons name="account-circle-outline" size={14} color="#71717a" style={{ marginRight: 4 }} />
                            <Text className="text-xs font-medium text-zinc-500">{item.employee?.name || 'Unknown'}</Text>
                        </View>
                        <Text className="text-sm font-black text-zinc-900">
                            {formatDate(item.startTime)}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <View className={`px-2 py-1 rounded-lg ${isOpen ? 'bg-green-100' : 'bg-zinc-100'}`}>
                            <Text className={`text-[10px] font-bold ${isOpen ? 'text-green-700' : 'text-zinc-500'} uppercase`}>
                                {isOpen ? 'Aktif' : 'Selesai'}
                            </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#d4d4d8" />
                    </View>
                </View>

                <View className="bg-zinc-50 p-3 rounded-xl flex-row justify-between items-center">
                    <View>
                        <Text className="text-[10px] text-zinc-400 font-bold uppercase">Modal Awal</Text>
                        <Text className="text-sm font-bold text-zinc-700">{formatCurrency(parseFloat(item.startingCash))}</Text>
                    </View>
                    {!isOpen && (
                        <View className="items-end">
                            <Text className="text-[10px] text-zinc-400 font-bold uppercase">Selisih</Text>
                            <Text className={`text-sm font-bold ${difference < 0 ? 'text-red-500' : difference > 0 ? 'text-green-500' : 'text-zinc-700'}`}>
                                {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                            </Text>
                        </View>
                    )}
                </View>
            </Pressable>
        );
    };

    // Show detail screen if a shift is selected
    if (selectedShiftId) {
        return (
            <ShiftDetailScreen
                shiftId={selectedShiftId}
                onBack={() => setSelectedShiftId(null)}
            />
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-zinc-50" edges={['top']}>
            <View className="bg-white border-b border-zinc-100 px-5 py-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={onBack} className="w-10 h-10 items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100">
                    <MaterialCommunityIcons name="arrow-left" size={24} color={currentOutlet?.primaryColor || "#18181b"} />
                </TouchableOpacity>
                <Text className="text-lg font-black text-zinc-800">Laporan Shift</Text>
                <TouchableOpacity onPress={onOpenDrawer} className="w-10 h-10 items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100">
                    <MaterialCommunityIcons name="menu" size={24} color={currentOutlet?.primaryColor || "#18181b"} />
                </TouchableOpacity>
            </View>

            {isLoading && !refreshing ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={currentOutlet?.secondaryColor || "#c28f09"} />
                </View>
            ) : shifts.length === 0 ? (
                <ScrollView
                    contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <View className="h-20 w-20 items-center justify-center rounded-full bg-zinc-100 mb-4">
                        <MaterialCommunityIcons name="clock-outline" size={40} color="#a1a1aa" />
                    </View>
                    <Text className="text-lg font-bold text-zinc-900">Belum Ada Laporan</Text>
                    <Text className="text-zinc-500 text-center mt-1 px-10">
                        Data shift harian akan muncul di sini setelah kasir membuka shift.
                    </Text>
                </ScrollView>
            ) : (
                <FlatList
                    data={shifts}
                    renderItem={renderShiftItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}


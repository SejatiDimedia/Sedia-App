import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { API_URL } from '../config/api';
import { useAuthStore } from '../store/authStore';

const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
};

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
};

interface SummaryData {
    totalRevenue: number;
    transactionCount: number;
    averageTicket: number;
    todayRevenue: number;
    todayTransactions: number;
}

interface SalesByDate {
    date: string;
    revenue: number;
    transactions: number;
}

interface TopProduct {
    name: string;
    quantity: number;
    revenue: number;
}

export default function ReportsScreen({ onBack, onOpenDrawer }: { onBack: () => void; onOpenDrawer: () => void }) {
    const { currentOutlet } = useOutletStore();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data States
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [salesByDate, setSalesByDate] = useState<SalesByDate[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week'); // Default to week like web
    const [customStart, setCustomStart] = useState<Date>(new Date());
    const [customEnd, setCustomEnd] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
    const [pickerMonth, setPickerMonth] = useState(new Date());

    const fetchReports = async () => {
        try {
            if (!currentOutlet) return;
            setIsLoading(true);

            const params = new URLSearchParams();
            params.append('outletId', currentOutlet.id);

            // Calculate dates based on range
            const end = new Date();
            const start = new Date();

            if (dateRange === 'week') {
                start.setDate(end.getDate() - 6); // Last 7 days
            } else if (dateRange === 'month') {
                start.setMonth(end.getMonth() - 1);
            } else if (dateRange === 'custom') {
                start.setTime(customStart.getTime());
                end.setTime(customEnd.getTime());
                // Set hours to cover full day
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
            } else {
                // pure today 00:00
                start.setHours(0, 0, 0, 0);
            }

            params.append('startDate', start.toISOString().split('T')[0]);
            params.append('endDate', end.toISOString().split('T')[0]);

            const token = useAuthStore.getState().token;
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Fetch all data in parallel
            const [summaryRes, salesRes, productsRes] = await Promise.all([
                fetch(`${API_URL}/reports/summary?${params.toString()}`, { headers }),
                fetch(`${API_URL}/reports/sales-by-date?${params.toString()}`, { headers }),
                fetch(`${API_URL}/reports/top-products?${params.toString()}`, { headers })
            ]);

            if (summaryRes.ok) setSummary(await summaryRes.json());
            if (salesRes.ok) setSalesByDate(await salesRes.json());
            if (productsRes.ok) setTopProducts(await productsRes.json());

        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };



    useEffect(() => {
        fetchReports();
    }, [currentOutlet, dateRange]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchReports();
    }, [currentOutlet, dateRange]);

    const openCustomPicker = (mode: 'start' | 'end') => {
        setPickerMode(mode);
        setPickerMonth(mode === 'start' ? customStart : customEnd);
        setShowDatePicker(true);
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(pickerMonth);
        newDate.setDate(day);

        if (pickerMode === 'start') {
            setCustomStart(newDate);
            // Auto close if end is already after start, else switch to end picking? 
            // For simplicity, just close or switch. 
            // Let's just update and let user choose.
        } else {
            setCustomEnd(newDate);
        }
        setShowDatePicker(false);
        // Force fetch only if both set? Actually useEffect triggers on dateRange change.
        // We need to trigger fetch explicitly if we are already in 'custom' mode but changing dates.
        if (dateRange === 'custom') {
            // We can't rely on useEffect dependency array for customStart/End simply because we might want to wait for both.
            // But simpler UX: Just let them pick, then click "Apply" or it auto updates.
            // Given the useEffect dependencies [currentOutlet, dateRange], we need to add customStart/End there or trigger manually.
            // Let's add customStart and customEnd to useEffect dependency or just setDateRange('custom') again essentially.
        }
    };

    const changeMonth = (delta: number) => {
        const newMonth = new Date(pickerMonth);
        newMonth.setMonth(newMonth.getMonth() + delta);
        setPickerMonth(newMonth);
    };

    const renderCalendar = () => {
        const year = pickerMonth.getFullYear();
        const month = pickerMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sun

        const days = [];
        // Empty slots for start
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<View key={`empty-${i}`} className="w-[14.28%] aspect-square" />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateStr = date.toDateString();
            const startStr = customStart.toDateString();
            const endStr = customEnd.toDateString();

            const isStart = dateStr === startStr;
            const isEnd = dateStr === endStr;
            const isInRange = date > customStart && date < customEnd;
            const isToday = new Date().toDateString() === dateStr;

            days.push(
                <TouchableOpacity
                    key={d}
                    onPress={() => handleDateSelect(d)}
                    className="w-[14.28%] aspect-square items-center justify-center relative my-1"
                >
                    {/* Range Background */}
                    {(isInRange || isStart || isEnd) && (
                        <View
                            className={`absolute h-8 top-1.5 
                                ${isStart && isEnd ? 'w-8 rounded-full' :
                                    isStart ? 'left-1/2 right-0 rounded-l-full' :
                                        isEnd ? 'left-0 right-1/2 rounded-r-full' :
                                            'left-0 right-0'} 
                            `}
                            style={{ backgroundColor: (currentOutlet?.primaryColor || '#0f766e') + (isInRange ? '15' : '30') }}
                        />
                    )}

                    {/* Selection Circle */}
                    <View
                        className="w-8 h-8 items-center justify-center rounded-full"
                        style={isStart || isEnd ? {
                            backgroundColor: currentOutlet?.primaryColor || '#0f766e',
                            shadowColor: currentOutlet?.primaryColor || '#0f766e',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3,
                            elevation: 3
                        } : {}}
                    >
                        <Text
                            className="text-xs font-bold"
                            style={{
                                color: (isStart || isEnd) ? '#ffffff' : (isToday ? (currentOutlet?.primaryColor || '#0f766e') : '#3f3f46')
                            }}
                        >
                            {d}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        }

        return (
            <View>
                <View className="flex-row flex-wrap mb-2 border-b border-zinc-100 pb-2">
                    {['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, index) => (
                        <View key={`${day}-${index}`} className="w-[14.28%] items-center justify-center">
                            <Text className="text-zinc-400 font-bold text-[10px] uppercase">{day}</Text>
                        </View>
                    ))}
                </View>
                <View className="flex-row flex-wrap">
                    {days}
                </View>
            </View>
        );
    };

    const FilterPill = ({ label, value, active }: { label: string, value: string, active: boolean }) => (
        <TouchableOpacity
            onPress={() => {
                if (value === 'custom') {
                    // Just open the picker for start if switching into custom
                }
                setDateRange(value as any);
            }}
            className="px-4 py-2 rounded-full mr-2 border"
            style={{
                backgroundColor: active ? (currentOutlet?.primaryColor || '#0f766e') : '#ffffff',
                borderColor: active ? (currentOutlet?.primaryColor || '#0f766e') : '#e4e4e7'
            }}
        >
            <Text className={`font-medium ${active ? 'text-white' : 'text-zinc-600'}`}>{label}</Text>
        </TouchableOpacity>
    );

    const StatCard = ({ title, value, icon, color, subValue }: any) => (
        <View className="bg-white p-4 rounded-3xl border border-zinc-100 mb-3 shadow-sm flex-1">
            <View className="flex-row items-center justify-between mb-3">
                <Text className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider">{title}</Text>
                <View
                    className="w-8 h-8 rounded-xl items-center justify-center"
                    style={{ backgroundColor: color }}
                >
                    <MaterialCommunityIcons name={icon} size={16} color="white" />
                </View>
            </View>
            <Text className="text-xl font-black text-zinc-900 leading-6">{value}</Text>
            {subValue && (
                <View className="flex-row items-center mt-2">
                    <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${typeof color === 'string' && color.startsWith('#') ? color : '#e4e4e7'}`} style={{ opacity: 0.5 }} />
                    <Text className="text-[10px] font-bold text-zinc-400">{subValue}</Text>
                </View>
            )}
        </View>
    );

    const maxRevenue = Math.max(...salesByDate.map((s) => s.revenue), 1);
    const maxQuantity = Math.max(...topProducts.map((p) => p.quantity), 1);

    return (
        <SafeAreaView className="flex-1 bg-zinc-50" edges={['top']}>
            {/* Header */}
            <View className="px-5 py-4 flex-row items-center justify-between bg-white border-b border-zinc-100">
                <TouchableOpacity onPress={onOpenDrawer} className="w-10 h-10 items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100">
                    <MaterialCommunityIcons name="menu" size={24} color={currentOutlet?.primaryColor || "#18181b"} />
                </TouchableOpacity>
                <View>
                    <Text className="text-lg font-black text-zinc-800 text-center">Analitik Bisnis</Text>
                    <Text className="text-xs font-medium text-zinc-400 text-center">{currentOutlet?.name}</Text>
                </View>
                <TouchableOpacity onPress={fetchReports} className="w-10 h-10 items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100">
                    <MaterialCommunityIcons name="refresh" size={22} color={currentOutlet?.primaryColor || "#18181b"} />
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Date Filter */}
                <View className="px-5 pt-5 pb-2">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <FilterPill label="Hari Ini" value="today" active={dateRange === 'today'} />
                        <FilterPill label="7 Hari Terakhir" value="week" active={dateRange === 'week'} />
                        <FilterPill label="30 Hari" value="month" active={dateRange === 'month'} />
                        <FilterPill label="Custom" value="custom" active={dateRange === 'custom'} />
                    </ScrollView>

                    {dateRange === 'custom' && (
                        <View className="mt-4 bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-sm font-black text-zinc-900">Pilih Periode</Text>
                                <TouchableOpacity
                                    onPress={fetchReports}
                                    className="px-4 py-2 rounded-xl flex-row items-center space-x-2"
                                    style={{ backgroundColor: currentOutlet?.primaryColor || '#0f766e' }}
                                >
                                    <Text className="text-white text-xs font-bold mr-1">Terapkan</Text>
                                    <MaterialCommunityIcons name="check" size={14} color="white" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => openCustomPicker('start')}
                                    className={`flex-1 p-3 rounded-2xl border ${pickerMode === 'start' && showDatePicker ? 'border-primary-500 bg-primary-50' : 'border-zinc-200 bg-zinc-50'}`}
                                >
                                    <Text className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Mulai</Text>
                                    <View className="flex-row items-center">
                                        <MaterialCommunityIcons name="calendar" size={16} color="#377f7e" style={{ marginRight: 6 }} />
                                        <Text className="text-sm font-black text-zinc-800">{formatDate(customStart.toISOString()).split(',')[1]}</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => openCustomPicker('end')}
                                    className={`flex-1 p-3 rounded-2xl border ${pickerMode === 'end' && showDatePicker ? 'border-primary-500 bg-primary-50' : 'border-zinc-200 bg-zinc-50'}`}
                                >
                                    <Text className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Sampai</Text>
                                    <View className="flex-row items-center">
                                        <MaterialCommunityIcons name="calendar" size={16} color="#377f7e" style={{ marginRight: 6 }} />
                                        <Text className="text-sm font-black text-zinc-800">{formatDate(customEnd.toISOString()).split(',')[1]}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {isLoading && !refreshing ? (
                    <View className="py-20">
                        <ActivityIndicator size="large" color={currentOutlet?.secondaryColor || "#c28f09"} />
                    </View>
                ) : (
                    <View className="px-5 pt-3">
                        {/* Summary Grid */}
                        <View className="flex-row gap-3">
                            <StatCard
                                title="Omzet"
                                value={formatCurrency(summary?.totalRevenue || 0)}
                                icon="currency-usd"
                                color={currentOutlet?.primaryColor || "#0f766e"}
                                subValue="Total Pendapatan"
                            />
                            <StatCard
                                title="Transaksi"
                                value={summary?.transactionCount || 0}
                                icon="receipt"
                                color={currentOutlet?.secondaryColor || "#f59e0b"} // Gold
                                subValue="Order Sukses"
                            />
                        </View>
                        <View className="flex-row gap-3 mb-6">
                            <StatCard
                                title="Avg. Basket"
                                value={formatCurrency(summary?.averageTicket || 0)}
                                icon="basket-outline"
                                color="#f97316" // Keep orange for varied stats
                                subValue="Per Transaksi"
                            />
                            <StatCard
                                title="Today"
                                value={formatCurrency(summary?.todayRevenue || 0)}
                                icon="flash"
                                color="#22c55e" // Keep green for success/growth
                                subValue="Omzet Hari Ini"
                            />
                        </View>


                        {/* Sales Trend Chart (Bar-like visualization) */}
                        <View className="bg-white p-5 rounded-3xl border border-zinc-200 mb-6 shadow-sm">
                            <View className="flex-row justify-between items-center mb-6">
                                <View>
                                    <Text className="text-lg font-black text-zinc-900">Tren Penjualan</Text>
                                    <Text className="text-xs font-medium text-zinc-400">Performa harian</Text>
                                </View>
                                <View
                                    className="px-3 py-1 rounded-full"
                                    style={{ backgroundColor: (currentOutlet?.primaryColor || '#0f766e') + '15' }}
                                >
                                    <Text className="text-[10px] font-bold" style={{ color: currentOutlet?.primaryColor || '#0f766e' }}>Revenue</Text>
                                </View>
                            </View>

                            {salesByDate.length === 0 ? (
                                <View className="h-40 items-center justify-center border-dashed border border-zinc-200 rounded-2xl bg-zinc-50">
                                    <Text className="text-zinc-400 text-xs font-medium">Belum ada data</Text>
                                </View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View className="flex-row items-end h-48 gap-3 pr-4">
                                        {salesByDate.map((day) => (
                                            <View key={day.date} className="items-center w-12 gap-2">
                                                {/* Bar */}
                                                <View className="w-full flex-1 justify-end">
                                                    <View
                                                        className="w-full rounded-t-lg opacity-90"
                                                        style={{
                                                            height: `${Math.max((day.revenue / maxRevenue) * 100, 5)}%`,
                                                            backgroundColor: currentOutlet?.primaryColor || '#0f766e'
                                                        }}
                                                    />
                                                </View>
                                                {/* Date Label */}
                                                <Text className="text-[10px] font-bold text-zinc-400 min-h-[20px] text-center">
                                                    {formatDate(day.date).split(' ')[0]} {/* Show Day Name Only */}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            )}
                        </View>

                        {/* Top Products List */}
                        <View className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm mb-6">
                            <View className="mb-5">
                                <Text className="text-lg font-black text-zinc-900">Produk Terlaris</Text>
                                <Text className="text-xs font-medium text-zinc-400">MVP berdasarkan kuantitas</Text>
                            </View>

                            {topProducts.length === 0 ? (
                                <View className="py-8 items-center justify-center border-dashed border border-zinc-200 rounded-2xl bg-zinc-50">
                                    <MaterialCommunityIcons name="package-variant-closed" size={24} color="#d4d4d8" />
                                    <Text className="text-zinc-400 text-xs font-medium mt-2">Belum ada penjualan</Text>
                                </View>
                            ) : (
                                <View className="gap-5">
                                    {topProducts.slice(0, 5).map((product, index) => (
                                        <View key={product.name} className="gap-2">
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center gap-3 flex-1 mr-4">
                                                    <View
                                                        className="w-7 h-7 rounded-lg items-center justify-center border"
                                                        style={{
                                                            backgroundColor: index === 0 ? (currentOutlet?.secondaryColor || '#f59e0b') + '15' : '#f4f4f5',
                                                            borderColor: index === 0 ? (currentOutlet?.secondaryColor || '#f59e0b') + '30' : '#e4e4e7'
                                                        }}
                                                    >
                                                        <Text
                                                            className="text-xs font-black"
                                                            style={{ color: index === 0 ? (currentOutlet?.secondaryColor || '#92400e') : '#71717a' }}
                                                        >
                                                            #{index + 1}
                                                        </Text>
                                                    </View>
                                                    <Text className="text-sm font-bold text-zinc-800 flex-1" numberOfLines={1}>{product.name}</Text>
                                                </View>
                                                <View>
                                                    <Text className="text-xs font-black text-zinc-900 text-right">{product.quantity} <Text className="text-[9px] font-bold text-zinc-400 uppercase">Terjual</Text></Text>
                                                </View>
                                            </View>

                                            {/* Progress Bar */}
                                            <View className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                                <View
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${(product.quantity / maxQuantity) * 100}%`,
                                                        backgroundColor: index === 0 ? (currentOutlet?.secondaryColor || '#f59e0b') : '#d4d4d8'
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                    </View>
                )}
            </ScrollView>

            {/* Custom Date Picker Modal */}
            <Modal
                transparent
                visible={showDatePicker}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-8">
                    <View className="bg-white w-full rounded-3xl p-5 shadow-2xl">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-lg font-black text-zinc-800">
                                {pickerMode === 'start' ? 'Mulai Tanggal' : 'Sampai Tanggal'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#a1a1aa" />
                            </TouchableOpacity>
                        </View>

                        {/* Month Nav */}
                        <View className="flex-row items-center justify-between mb-4 bg-zinc-50 p-2 rounded-xl">
                            <TouchableOpacity onPress={() => changeMonth(-1)} className="p-2">
                                <MaterialCommunityIcons name="chevron-left" size={24} color={currentOutlet?.primaryColor || "#377f7e"} />
                            </TouchableOpacity>
                            <Text className="text-base font-black text-zinc-900">
                                {pickerMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth(1)} className="p-2">
                                <MaterialCommunityIcons name="chevron-right" size={24} color={currentOutlet?.primaryColor || "#377f7e"} />
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Grid */}
                        {renderCalendar()}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

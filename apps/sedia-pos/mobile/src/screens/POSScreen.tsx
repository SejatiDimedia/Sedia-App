import '../../global.css';
import React from 'react';
import { Text, View, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useCartStore, HeldOrder } from '../store/cartStore';
import { useOutletStore } from '../store/outletStore';
import { useShiftStore } from '../store/shiftStore';
import { useEmployeeStore } from '../store/employeeStore';
import { useLoyaltyStore } from '../store/loyaltyStore';
import { API_URL } from '../config/api';
import { LocalProduct } from '../db/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, ScrollView } from 'react-native';

function formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

interface ProductCardProps {
    product: LocalProduct;
    onAdd: () => void;
}

function ProductCard({ product, onAdd }: ProductCardProps) {
    // Map product names to icons for demo purposes
    const getIconName = (name: string) => {
        const nameLower = name.toLowerCase();
        if (nameLower.includes('kopi') || nameLower.includes('cappuccino') || nameLower.includes('coffee')) return 'coffee';
        if (nameLower.includes('teh') || nameLower.includes('jeruk') || nameLower.includes('tea')) return 'cup';
        if (nameLower.includes('nasi') || nameLower.includes('ayam') || nameLower.includes('rice')) return 'food';
        if (nameLower.includes('mie') || nameLower.includes('noodle')) return 'noodles';
        if (nameLower.includes('roti') || nameLower.includes('bread')) return 'bread-slice';
        return 'food-variant';
    };

    return (
        <TouchableOpacity
            onPress={onAdd}
            className="m-1.5 flex-1 overflow-hidden rounded-2xl bg-white shadow-sm active:bg-zinc-50 "
            style={{ minWidth: 150, maxWidth: '48%' }}
        >
            <View className="h-32 w-full items-center justify-center bg-zinc-100 ">
                <MaterialCommunityIcons
                    name={getIconName(product.name) as any}
                    size={48}
                    color="#377f7e" // Primary color
                />
            </View>

            <View className="p-3">
                <Text className="text-sm font-semibold text-zinc-900 " numberOfLines={1}>
                    {product.name}
                </Text>
                <Text className="mt-1 text-xs font-bold text-primary-600 ">
                    {formatCurrency(product.price)}
                </Text>
                <Text className="mt-0.5 text-xs text-zinc-400">
                    Stok: {product.stock}
                </Text>
            </View>

            <TouchableOpacity
                onPress={onAdd}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 "
            >
                <MaterialCommunityIcons name="plus" size={18} color="#377f7e" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

interface CartSummaryProps {
    itemCount: number;
    total: number;
    onViewCart: () => void;
}

interface CartSummaryProps {
    itemCount: number;
    total: number;
    onViewCart: () => void;
}

function CartSummary({ itemCount, total, onViewCart }: CartSummaryProps) {
    if (itemCount === 0) return null;

    return (
        <View className="absolute bottom-8 left-4 right-4 gap-3">
            <TouchableOpacity
                onPress={onViewCart}
                className="flex-row items-center justify-between rounded-3xl bg-primary-600 px-6 py-4 shadow-2xl shadow-primary-500/40 active:scale-95"
            >
                <View className="flex-row items-center gap-4">
                    <View className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-500 shadow-sm border-2 border-primary-500">
                        <Text className="text-base font-black text-primary-950">{itemCount}</Text>
                    </View>
                    <View>
                        <Text className="text-[10px] font-bold text-primary-100 uppercase tracking-tighter opacity-80">Total Pesanan</Text>
                        <Text className="text-lg font-black text-white">{formatCurrency(total)}</Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-2 bg-white/20 px-4 py-2 rounded-2xl border border-white/10">
                    <Text className="text-sm font-bold text-white ">Lihat Keranjang</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                </View>
            </TouchableOpacity>
        </View>
    );
}

interface POSScreenProps {
    onViewCart: () => void;
    onSwitchOutlet?: () => void;
    onLogout?: () => void;
}

export default function POSScreen({ onViewCart, onSwitchOutlet, onLogout }: POSScreenProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showMenu, setShowMenu] = React.useState(false);
    const [products, setProducts] = React.useState<LocalProduct[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
    const { addItem, getTotal, getItemCount, heldOrders, resumeOrder, deleteHeldOrder, fetchHeldOrders, clearCart, items } = useCartStore();
    const { currentOutlet } = useOutletStore();
    const { currentEmployee } = useEmployeeStore();
    const { activeShift, fetchActiveShift, openShift, closeShift, shiftReconciliation, setShiftReconciliation } = useShiftStore();
    const { fetchLoyaltyData } = useLoyaltyStore();

    const [showHeldOrdersModal, setShowHeldOrdersModal] = React.useState(false);

    // Shift States
    const [showShiftModal, setShowShiftModal] = React.useState(false);
    const [showCloseShiftModal, setShowCloseShiftModal] = React.useState(false);
    const [startingCash, setStartingCash] = React.useState('');
    const [endingCash, setEndingCash] = React.useState('');
    const [shiftNotes, setShiftNotes] = React.useState('');
    const [isProcessingShift, setIsProcessingShift] = React.useState(false);

    // Fetch products and active shift
    React.useEffect(() => {
        const fetchProducts = async () => {
            if (!currentOutlet?.id) return;

            setIsLoadingProducts(true);
            try {
                const response = await fetch(`${API_URL}/products?outletId=${currentOutlet.id}`, {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    // Filter active products with stock > 0
                    const activeProducts = (data || []).filter((p: any) => p.isActive && p.stock > 0);
                    setProducts(activeProducts.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        price: parseFloat(p.price),
                        stock: p.stock,
                        track_stock: p.trackStock ? 1 : 0,
                    })));
                }

                // Fetch active shift and loyalty data
                fetchActiveShift(currentOutlet.id);
                fetchLoyaltyData(currentOutlet.id);
                fetchHeldOrders(currentOutlet.id);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        if (currentOutlet?.id) {
            fetchActiveShift(currentOutlet.id);
            fetchProducts();
        }
    }, [currentOutlet?.id]);

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddProduct = (product: LocalProduct) => {
        const itemInCart = useCartStore.getState().items.find(i => i.productId === product.id);
        const currentQty = itemInCart?.quantity || 0;

        if (currentQty >= product.stock) {
            Alert.alert("Stok Habis", "Jumlah pesanan melebihi stok yang tersedia.");
            return;
        }

        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock
        });
    };



    const handleResumeOrder = (heldOrder: HeldOrder) => {
        if (items.length > 0) {
            Alert.alert(
                'Konfirmasi',
                'Keranjang saat ini akan digantikan dengan pesanan yang ditahan. Lanjutkan?',
                [
                    { text: 'Batal', style: 'cancel' },
                    {
                        text: 'Ya',
                        onPress: () => {
                            resumeOrder(heldOrder);
                            setShowHeldOrdersModal(false);
                        },
                    },
                ]
            );
        } else {
            resumeOrder(heldOrder);
            setShowHeldOrdersModal(false);
        }
    };

    const handleDeleteHeldOrder = (orderId: string) => {
        Alert.alert(
            'Hapus Pesanan',
            'Apakah Anda yakin ingin menghapus pesanan yang ditahan ini?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteHeldOrder(orderId);
                        if (success) {
                            Alert.alert('Berhasil', 'Pesanan dihapus.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View className="flex-1 bg-zinc-50 ">
            {/* Header */}
            <View className="bg-primary-600 px-4 pb-6 pt-14 rounded-b-[32px] shadow-lg shadow-primary-500/20">
                <View className="mb-4 flex-row items-center justify-between">
                    <View>
                        <Text className="text-2xl font-bold text-white">Menu</Text>
                        <View className="flex-row items-center gap-1.5">
                            <View className={`h-1.5 w-1.5 rounded-full ${activeShift ? 'bg-green-400' : 'bg-red-400'}`} />
                            <Text className="text-primary-100 text-sm">
                                {activeShift ? `Kasir: ${currentEmployee?.name}` : 'Shift Belum Dibuka'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowMenu(!showMenu)}
                        className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
                    >
                        <MaterialCommunityIcons name="menu" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center rounded-2xl bg-white px-4 py-2 shadow-sm">
                    <MaterialCommunityIcons name="magnify" size={22} color="#9ca3af" />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Cari makanan atau minuman..."
                        placeholderTextColor="#9ca3af"
                        className="flex-1 px-3 py-2 text-base text-zinc-900"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={18} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Dropdown Menu */}
            {showMenu && (
                <View className="absolute top-28 right-4 z-50 rounded-2xl bg-white shadow-xl border border-zinc-100" style={{ minWidth: 180 }}>
                    <TouchableOpacity
                        onPress={() => {
                            setShowMenu(false);
                            if (activeShift) {
                                setShowCloseShiftModal(true);
                            } else {
                                setShowShiftModal(true);
                            }
                        }}
                        className="flex-row items-center gap-3 px-4 py-3 border-b border-zinc-100"
                    >
                        <MaterialCommunityIcons
                            name={activeShift ? "history" : "plus-circle"}
                            size={20}
                            color={activeShift ? "#f59e0b" : "#10b981"}
                        />
                        <Text className={`text-base font-semibold ${activeShift ? "text-amber-600" : "text-green-600"}`}>
                            {activeShift ? "Tutup Shift" : "Buka Shift"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            setShowMenu(false);
                            setShowHeldOrdersModal(true);
                        }}
                        className="flex-row items-center gap-3 px-4 py-3 border-b border-zinc-100"
                    >
                        <MaterialCommunityIcons name="pause-circle" size={20} color="#377f7e" />
                        <Text className="text-base text-zinc-900">Pesanan Ditahan</Text>
                        {heldOrders.length > 0 && (
                            <View className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {heldOrders.length}
                            </View>
                        )}
                    </TouchableOpacity>

                    {onSwitchOutlet && (
                        <TouchableOpacity
                            onPress={() => {
                                setShowMenu(false);
                                onSwitchOutlet();
                            }}
                            className="flex-row items-center gap-3 px-4 py-3 border-b border-zinc-100"
                        >
                            <MaterialCommunityIcons name="swap-horizontal" size={20} color="#377f7e" />
                            <Text className="text-base text-zinc-900">Ganti Outlet</Text>
                        </TouchableOpacity>
                    )}
                    {onLogout && (
                        <TouchableOpacity
                            onPress={() => {
                                setShowMenu(false);
                                onLogout();
                            }}
                            className="flex-row items-center gap-3 px-4 py-3"
                        >
                            <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
                            <Text className="text-base text-red-500">Logout</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Buka Shift Modal */}
            <Modal
                visible={showShiftModal}
                transparent
                animationType="slide"
            >
                <View className="flex-1 items-center justify-center bg-black/60 px-4">
                    <View className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
                        <View className="bg-primary-600 p-6 flex-row justify-between items-center">
                            <View>
                                <Text className="text-xl font-bold text-white">Buka Shift Kasir</Text>
                                <Text className="text-primary-100 text-sm opacity-90">Modal awal laci kasir</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowShiftModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View className="p-8">
                            <View className="mb-6">
                                <Text className="text-sm font-bold text-primary-900 mb-2 uppercase tracking-wider">Kasir Aktif</Text>
                                <View className="bg-zinc-100 p-4 rounded-xl border border-zinc-200">
                                    <Text className="text-lg font-bold text-zinc-900">{currentEmployee?.name || '...'}</Text>
                                </View>
                            </View>
                            <View className="mb-6">
                                <Text className="text-sm font-bold text-primary-900 mb-2 uppercase tracking-wider">Modal Awal (Cash)</Text>
                                <View className="flex-row items-center bg-white border border-zinc-200 rounded-2xl px-4 py-4">
                                    <Text className="text-xl font-bold text-zinc-400 mr-2">Rp</Text>
                                    <TextInput
                                        value={startingCash}
                                        onChangeText={setStartingCash}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        className="flex-1 text-2xl font-bold text-zinc-900"
                                    />
                                </View>
                                <Text className="text-xs text-zinc-400 mt-2">Sesuai dengan uang fisik yang ada di laci.</Text>
                            </View>

                            <TouchableOpacity
                                onPress={async () => {
                                    if (!currentOutlet?.id || !currentEmployee?.id) return;
                                    setIsProcessingShift(true);
                                    const success = await openShift(currentOutlet.id, currentEmployee.id, parseFloat(startingCash || '0'));
                                    setIsProcessingShift(false);
                                    if (success) {
                                        setShowShiftModal(false);
                                        setStartingCash('');
                                    } else {
                                        Alert.alert("Gagal", "Gagal membuka shift. Silakan coba lagi.");
                                    }
                                }}
                                disabled={isProcessingShift}
                                className="w-full bg-primary-600 py-4 rounded-2xl flex-row items-center justify-center gap-2 active:bg-primary-700"
                            >
                                {isProcessingShift ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="check" size={24} color="white" />
                                        <Text className="text-white text-lg font-bold">Buka Shift Sekarang</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Tutup Shift Modal */}
            <Modal
                visible={showCloseShiftModal}
                transparent
                animationType="slide"
            >
                <View className="flex-1 items-center justify-center bg-black/60 px-4">
                    <View className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
                        <View className="bg-amber-600 p-6 flex-row justify-between items-center">
                            <View>
                                <Text className="text-xl font-bold text-white">Tutup Shift</Text>
                                <Text className="text-amber-100 text-sm opacity-90">Hitung uang fisik di laci</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowCloseShiftModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View className="p-8">
                            <View className="mb-6">
                                <Text className="text-sm font-bold text-primary-900 mb-2 uppercase tracking-wider">Total Uang Fisik (Cash)</Text>
                                <View className="flex-row items-center bg-white border border-zinc-200 rounded-2xl px-4 py-4">
                                    <Text className="text-xl font-bold text-zinc-400 mr-2">Rp</Text>
                                    <TextInput
                                        value={endingCash}
                                        onChangeText={setEndingCash}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        className="flex-1 text-2xl font-bold text-zinc-900"
                                        autoFocus
                                    />
                                </View>
                            </View>
                            <View className="mb-6">
                                <Text className="text-sm font-bold text-primary-900 mb-2 uppercase tracking-wider">Catatan (Opsional)</Text>
                                <TextInput
                                    value={shiftNotes}
                                    onChangeText={setShiftNotes}
                                    placeholder="Alasan selisih, dll..."
                                    multiline
                                    numberOfLines={3}
                                    className="bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 text-zinc-900"
                                    style={{ textAlignVertical: 'top' }}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={async () => {
                                    if (!activeShift) return;
                                    setIsProcessingShift(true);
                                    const success = await closeShift(activeShift.id, parseFloat(endingCash || '0'), shiftNotes);
                                    setIsProcessingShift(false);
                                    if (success) {
                                        setShowCloseShiftModal(false);
                                        setEndingCash('');
                                        setShiftNotes('');
                                    } else {
                                        Alert.alert("Gagal", "Gagal menutup shift.");
                                    }
                                }}
                                disabled={isProcessingShift}
                                className="w-full bg-amber-600 py-4 rounded-2xl flex-row items-center justify-center gap-2 active:bg-amber-700"
                            >
                                {isProcessingShift ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="calculator" size={24} color="white" />
                                        <Text className="text-white text-lg font-bold">Konfirmasi & Tutup Shift</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Reconciliation Report Modal */}
            <Modal
                visible={!!shiftReconciliation}
                transparent
                animationType="fade"
            >
                <View className="flex-1 items-center justify-center bg-black/60 px-4">
                    <View className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
                        <View className="bg-primary-700 p-8">
                            <Text className="text-2xl font-bold text-white">Laporan Rekonsiliasi</Text>
                            <Text className="text-primary-100 text-sm opacity-90 mt-1">ID: {shiftReconciliation?.invoiceNumber || shiftReconciliation?.id?.slice(0, 8)}</Text>
                        </View>
                        <ScrollView className="p-8 max-h-[500px]">
                            <View className="bg-primary-50 rounded-2xl p-6 space-y-4">
                                <View className="flex-row justify-between border-b border-primary-100 pb-3">
                                    <Text className="text-zinc-500">Modal Awal</Text>
                                    <Text className="font-bold text-zinc-900">{formatCurrency(parseFloat(shiftReconciliation?.summary?.startCash || '0'))}</Text>
                                </View>
                                <View className="flex-row justify-between border-b border-primary-100 pb-3">
                                    <Text className="text-zinc-500">Total Penjualan Tunai</Text>
                                    <Text className="font-bold text-zinc-900">{formatCurrency(parseFloat(shiftReconciliation?.summary?.cashSales || '0'))}</Text>
                                </View>
                                <View className="flex-row justify-between border-b border-primary-100 py-3">
                                    <Text className="font-bold text-primary-700">Total Ekspektasi Kas</Text>
                                    <Text className="text-lg font-bold text-zinc-950">{formatCurrency(parseFloat(shiftReconciliation?.summary?.expectedCash || '0'))}</Text>
                                </View>
                                <View className="flex-row justify-between border-b border-primary-100 py-3">
                                    <Text className="font-bold text-primary-700">Total Uang Fisik</Text>
                                    <Text className="text-lg font-bold text-zinc-950">{formatCurrency(parseFloat(shiftReconciliation?.summary?.actualEndingCash || '0'))}</Text>
                                </View>
                                <View className={`flex-row justify-between rounded-xl p-4 mt-2 ${parseFloat(shiftReconciliation?.summary?.difference || '0') === 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <Text className={`font-bold ${parseFloat(shiftReconciliation?.summary?.difference || '0') === 0 ? 'text-green-700' : 'text-red-700'}`}>Selisih</Text>
                                    <Text className={`text-xl font-black ${parseFloat(shiftReconciliation?.summary?.difference || '0') === 0 ? 'text-green-800' : 'text-red-800'}`}>
                                        {formatCurrency(parseFloat(shiftReconciliation?.summary?.difference || '0'))}
                                    </Text>
                                </View>
                            </View>

                            {shiftReconciliation?.notes && (
                                <View className="mt-6">
                                    <Text className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-2">Catatan</Text>
                                    <View className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl">
                                        <Text className="italic text-zinc-600">"{shiftReconciliation.notes}"</Text>
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity
                                onPress={() => {
                                    setShiftReconciliation(null);
                                    setShowShiftModal(true);
                                }}
                                className="mt-8 bg-primary-600 py-4 rounded-2xl items-center shadow-lg shadow-primary-500/30 active:scale-95"
                            >
                                <Text className="text-white text-lg font-bold">Tutup & Buka Shift Baru</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShiftReconciliation(null)}
                                className="mt-3 mb-8 py-3 items-center"
                            >
                                <Text className="text-zinc-400 font-bold">Tutup Laporan</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Held Orders Modal */}
            <Modal
                visible={showHeldOrdersModal}
                transparent
                animationType="slide"
            >
                <View className="flex-1 bg-black/60">
                    <View className="w-full h-2/3 bg-white rounded-t-[32px] mt-auto">
                        <View className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-5 rounded-t-[32px]">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-xl font-bold text-white">Pesanan Ditahan</Text>
                                    <Text className="text-primary-100 text-sm opacity-90">{heldOrders.length} pesanan aktif</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowHeldOrdersModal(false)}
                                    className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                                >
                                    <MaterialCommunityIcons name="close" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <FlatList
                            data={heldOrders}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleResumeOrder(item)}
                                    className="bg-white border border-zinc-200 rounded-2xl p-4 mb-3 active:bg-zinc-50 shadow-sm"
                                >
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-1">
                                            <View className="flex-row items-center gap-2 mb-1">
                                                <MaterialCommunityIcons name="clock" size={14} color="#9ca3af" />
                                                <Text className="text-sm text-zinc-500">
                                                    {new Date(item.createdAt).toLocaleString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </Text>
                                            </View>
                                            {item.customerName && (
                                                <View className="flex-row items-center gap-1.5 mt-1">
                                                    <MaterialCommunityIcons name="account" size={14} color="#377f7e" />
                                                    <Text className="text-sm font-semibold text-zinc-900">
                                                        {item.customerName}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View className="bg-primary-50 px-3 py-1.5 rounded-full border border-primary-200">
                                            <Text className="text-xs font-bold text-primary-700">
                                                {item.items.length} item
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="mb-3">
                                        <Text className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5">Item</Text>
                                        <View className="flex flex-wrap gap-1.5">
                                            {item.items.slice(0, 3).map((i, idx) => (
                                                <View key={idx} className="bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-200">
                                                    <Text className="text-xs text-zinc-700">
                                                        {i.name} ×{i.quantity}
                                                    </Text>
                                                </View>
                                            ))}
                                            {item.items.length > 3 && (
                                                <View className="bg-primary-50 px-2 py-1 rounded-lg border border-primary-200">
                                                    <Text className="text-xs font-medium text-primary-700">
                                                        +{item.items.length - 3} lainnya
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        {item.notes && (
                                            <View className="flex-row items-start gap-1.5 mt-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                                                <MaterialCommunityIcons name="note-text" size={12} color="#f59e0b" />
                                                <Text className="text-xs text-zinc-600 italic flex-1">
                                                    "{item.notes}"
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View className="flex-row items-center justify-between pt-3 border-t border-zinc-100">
                                        <View>
                                            <Text className="text-xs text-zinc-400">Total</Text>
                                            <Text className="text-lg font-black text-primary-700">
                                                {formatCurrency(item.totalAmount)}
                                            </Text>
                                        </View>
                                        <View className="flex-row gap-2">
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteHeldOrder(item.id);
                                                }}
                                                className="w-9 h-9 bg-red-50 rounded-xl items-center justify-center border border-red-200 active:bg-red-100"
                                            >
                                                <MaterialCommunityIcons name="delete" size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleResumeOrder(item);
                                                }}
                                                className="flex-row items-center gap-1.5 bg-primary-600 px-4 py-2 rounded-xl active:bg-primary-700"
                                            >
                                                <MaterialCommunityIcons name="play" size={16} color="white" />
                                                <Text className="text-sm font-bold text-white">Lanjutkan</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View className="flex-1 items-center justify-center py-16">
                                    <View className="bg-zinc-50 rounded-full p-6 mb-4">
                                        <MaterialCommunityIcons name="pause-circle" size={48} color="#d4d4d8" />
                                    </View>
                                    <Text className="text-base font-semibold text-zinc-400">Belum ada pesanan ditahan</Text>
                                    <Text className="text-sm text-zinc-300 mt-1">Pesanan akan muncul di sini</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Product Grid */}
            {isLoadingProducts ? (
                <View className="flex-1 items-center justify-center py-20">
                    <ActivityIndicator size="large" color="#377f7e" />
                    <Text className="mt-4 text-zinc-500">Memuat produk...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={{ padding: 12, paddingBottom: 100, paddingTop: 16 }}
                    renderItem={({ item }) => (
                        <ProductCard product={item} onAdd={() => handleAddProduct(item)} />
                    )}
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-20">
                            <MaterialCommunityIcons name="food-off" size={48} color="#d4d4d8" />
                            <Text className="mt-4 text-zinc-400">
                                {products.length === 0 ? 'Belum ada produk' : 'Produk tidak ditemukan'}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Cart Summary Bar */}
            <CartSummary
                itemCount={getItemCount()}
                total={getTotal()}
                onViewCart={onViewCart}
            />
        </View>
    );
}

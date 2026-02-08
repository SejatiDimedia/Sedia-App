import '../../global.css';
import React from 'react';
import { Text, View, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, useWindowDimensions } from 'react-native';
import CartScreen from './CartScreen';
import CheckoutScreen from './CheckoutScreen';
import { useCartStore, HeldOrder } from '../store/cartStore';
import { useOutletStore } from '../store/outletStore';
import { useShiftStore } from '../store/shiftStore';
import { useEmployeeStore } from '../store/employeeStore';
import { useAuthStore } from '../store/authStore';
import { useLoyaltyStore } from '../store/loyaltyStore';
import { API_URL } from '../config/api';
import { LocalProduct, LocalProductVariant } from '../db/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, ScrollView } from 'react-native';
import { useSync } from '../hooks/useSync';

interface Category {
    id: string;
    name: string;
}

function formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

interface ProductCardProps {
    product: LocalProduct;
    onAdd: () => void;
    isTablet: boolean;
    currentOutlet: any; // Add prop
}

function ProductCard({ product, onAdd, isTablet, currentOutlet }: ProductCardProps) {
    return (
        <TouchableOpacity
            onPress={onAdd}
            activeOpacity={0.9}
            className={`m-2 overflow-hidden rounded-[32px] bg-white border border-zinc-100 shadow-xl shadow-zinc-200/50 ${isTablet ? 'h-[280px]' : 'h-[240px]'}`}
        >
            <View className={`w-full items-center justify-center bg-zinc-50 overflow-hidden ${isTablet ? 'h-44' : 'h-36'}`}>
                {(product.imageUrl || (product as any).image_url) ? (
                    <Image
                        source={{ uri: product.imageUrl || (product as any).image_url }}
                        className="h-full w-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View
                        className="bg-zinc-100 p-6 rounded-full"
                        style={{ backgroundColor: (currentOutlet?.primaryColor || '#377f7e') + '10' }}
                    >
                        <MaterialCommunityIcons
                            name="silverware-variant"
                            size={isTablet ? 48 : 36}
                            color={(currentOutlet?.primaryColor || '#377f7e') + '80'} // Primary color with some opacity
                        />
                    </View>
                )}
            </View>

            <View className="p-5 flex-1 justify-between">
                <View>
                    <Text className="text-base font-extrabold text-zinc-900 leading-5" numberOfLines={2}>
                        {product.name}
                    </Text>
                    {product.sku && (
                        <Text className="text-[10px] text-zinc-400 mt-1 font-medium tracking-tighterUppercase">
                            SKU: {product.sku}
                        </Text>
                    )}
                </View>
                <View className="flex-row items-end justify-between">
                    <View>
                        <Text className="text-xs text-zinc-400 font-bold mb-0.5">Price</Text>
                        <Text className="text-lg font-black text-primary-600 tracking-tight" style={{ color: currentOutlet?.primaryColor || '#0f766e' }}>
                            {product.variants && product.variants.length > 0 ? "Mulai " : ""}{formatCurrency(product.price)}
                        </Text>
                    </View>
                    <View className="bg-secondary-100 px-3 py-1.5 rounded-2xl">
                        <Text className="text-[10px] font-black text-secondary-700">
                            {product.stock}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Premium Add Indicator */}
            <View
                className="absolute top-4 right-4 h-10 w-10 items-center justify-center rounded-2xl bg-white/90 shadow-sm border border-white/50"
            >
                <MaterialCommunityIcons name="plus" size={24} color={currentOutlet?.primaryColor || "#377f7e"} />
            </View>
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
    currentOutlet: any;
}

function CartSummary({ itemCount, total, onViewCart, currentOutlet }: CartSummaryProps) {
    if (itemCount === 0) return null;

    const primaryColor = currentOutlet?.primaryColor || '#0f766e';
    const secondaryColor = currentOutlet?.secondaryColor || '#f59e0b';

    return (
        <View className="absolute bottom-8 left-4 right-4 gap-3">
            <TouchableOpacity
                onPress={onViewCart}
                className="flex-row items-center justify-between rounded-3xl bg-primary-600 px-6 py-4 shadow-2xl shadow-primary-500/40 active:scale-95"
                style={{
                    backgroundColor: primaryColor,
                    shadowColor: primaryColor
                }}
            >
                <View className="flex-row items-center gap-4">
                    <View
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-500 shadow-sm border-2 border-primary-500"
                        style={{ backgroundColor: secondaryColor, borderColor: primaryColor }}
                    >
                        <Text className="text-base font-black text-white">{itemCount}</Text>
                    </View>
                    <View>
                        <Text className="text-[10px] font-bold text-white uppercase tracking-tighter opacity-80">Total Pesanan</Text>
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
    onOpenDrawer: () => void;
    onSwitchOutlet?: () => void;
    onLogout?: () => void;
}

export default function POSScreen({ onViewCart, onOpenDrawer, onSwitchOutlet, onLogout }: POSScreenProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showMenu, setShowMenu] = React.useState(false);
    const [products, setProducts] = React.useState<LocalProduct[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
    const [showVariantModal, setShowVariantModal] = React.useState(false);
    const [selectedProductForVariant, setSelectedProductForVariant] = React.useState<LocalProduct | null>(null);
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const numColumns = isTablet ? 3 : 2;

    const { addItem, getTotal, getItemCount, heldOrders, resumeOrder, deleteHeldOrder, fetchHeldOrders, clearCart, items } = useCartStore();
    const currentOutlet = useOutletStore(state => state.currentOutlet);
    const currentEmployee = useEmployeeStore(state => state.currentEmployee);
    const { activeShift, fetchActiveShift, openShift, closeShift, shiftReconciliation, setShiftReconciliation } = useShiftStore();
    const { fetchLoyaltyData } = useLoyaltyStore();
    const { isOnline } = useSync();

    const [showHeldOrdersModal, setShowHeldOrdersModal] = React.useState(false);
    const [sidebarView, setSidebarView] = React.useState<'cart' | 'checkout'>('cart');

    // Shift States
    const [showShiftModal, setShowShiftModal] = React.useState(false);
    const [showCloseShiftModal, setShowCloseShiftModal] = React.useState(false);
    const [startingCash, setStartingCash] = React.useState('');
    const [endingCash, setEndingCash] = React.useState('');
    const [shiftNotes, setShiftNotes] = React.useState('');
    const [isProcessingShift, setIsProcessingShift] = React.useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>('');

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
                        categoryId: p.categoryId,
                        track_stock: p.trackStock ? 1 : 0,
                        imageUrl: p.imageUrl,
                        isActive: p.isActive,
                        variants: p.variants,
                    })));
                }

                // Fetch active shift and loyalty data
                fetchActiveShift(currentOutlet.id);
                fetchLoyaltyData(currentOutlet.id);
                fetchHeldOrders(currentOutlet.id);
                useOutletStore.getState().fetchTaxSettings(currentOutlet.id);
                useOutletStore.getState().fetchPaymentMethods(currentOutlet.id);
                useEmployeeStore.getState().fetchEmployees(currentOutlet.id);

                // Fetch categories
                const catResponse = await fetch(`${API_URL}/categories?outletId=${currentOutlet.id}`, {
                    credentials: 'include',
                });
                if (catResponse.ok) {
                    const catData = await catResponse.json();
                    setCategories(catData || []);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        if (currentOutlet?.id) {
            fetchActiveShift(currentOutlet.id);
            fetchProducts();
        }
    }, [currentOutlet?.id]);

    const filteredProducts = products.filter((product) => {
        // DEBUG: Check if colors are present
        console.log('[POSScreen] Filter render. Current Outlet:', JSON.stringify(currentOutlet, null, 2));

        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategoryId || product.categoryId === selectedCategoryId;
        return matchesSearch && matchesCategory;
    });

    const handleAddProduct = (product: LocalProduct, variant?: LocalProductVariant) => {
        if (!variant && product.variants && product.variants.length > 0) {
            setSelectedProductForVariant(product);
            setShowVariantModal(true);
            return;
        }

        const itemInCart = useCartStore.getState().items.find(i =>
            variant ? i.id === `${product.id}-${variant.id}` : i.id === product.id
        );
        const currentQty = itemInCart?.quantity || 0;
        const stockToCheck = variant ? variant.stock : product.stock;

        if (currentQty >= stockToCheck) {
            Alert.alert("Stok Habis", "Jumlah pesanan melebihi stok yang tersedia.");
            return;
        }

        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl,
        }, variant);

        setShowVariantModal(false);
        setSelectedProductForVariant(null);
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
            <View className={`flex-1 ${isTablet ? 'flex-row' : 'flex-col'}`}>
                {/* Left Side: Product List */}
                <View className={`${isTablet ? 'flex-[1.5]' : 'flex-1'} bg-[#fdfdfd]`}>
                    {/* Header */}
                    <View className="bg-white border-b border-zinc-100 px-6 pb-6 pt-14">
                        <View className="mb-6 flex-row items-center justify-between">
                            <View>
                                <Text className="text-3xl font-black text-zinc-900 tracking-tight">Katalog Menu</Text>
                                <View className="flex-row items-center gap-2 mt-1">
                                    <View
                                        key={activeShift ? 'active' : 'inactive'}
                                        className={`h-2 w-2 rounded-full ${activeShift ? 'bg-green-500' : 'bg-red-500'}`}
                                    />
                                    <Text className="text-zinc-500 text-sm font-semibold">
                                        {activeShift ? `Kasir: ${currentEmployee?.name || useAuthStore.getState().user?.name || 'Owner'}` : 'Shift Belum Dibuka'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    console.log('[POSScreen] Menu button pressed');
                                    onOpenDrawer();
                                }}
                                className="h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100"
                            >
                                <MaterialCommunityIcons name="menu" size={24} color={currentOutlet?.primaryColor || "#18181b"} />
                            </TouchableOpacity>
                        </View>

                        {/* Modern Search Bar */}
                        <View className="flex-row items-center rounded-2xl bg-zinc-100 px-5 py-3 border border-zinc-200/50">
                            <MaterialCommunityIcons name="magnify" size={24} color="#a1a1aa" />
                            <TextInput
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Cari menu favorit kamu..."
                                placeholderTextColor="#a1a1aa"
                                className="flex-1 px-4 text-base font-semibold text-zinc-900"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <MaterialCommunityIcons name="close-circle" size={20} color="#a1a1aa" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Main Content: Shift Check */}
                    {!activeShift && !isLoadingProducts ? (
                        <View className="flex-1 items-center justify-center px-8">
                            <View className="bg-white p-8 rounded-[32px] shadow-2xl shadow-zinc-200/50 w-full items-center border border-zinc-100">
                                <View className="h-24 w-24 bg-red-50 rounded-full items-center justify-center mb-6 border-4 border-red-100">
                                    <MaterialCommunityIcons name="store-clock-outline" size={48} color="#ef4444" />
                                </View>

                                <Text className="text-2xl font-black text-zinc-900 text-center mb-3">
                                    Shift Belum Dibuka
                                </Text>

                                <Text className="text-zinc-500 text-center font-medium leading-6 mb-8">
                                    Silakan buka shift terlebih dahulu untuk mulai melakukan transaksi penjualan di outlet ini.
                                </Text>

                                <TouchableOpacity
                                    onPress={() => setShowShiftModal(true)}
                                    className="w-full py-4 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg shadow-primary-500/30 active:scale-95 transition-all"
                                    style={{ backgroundColor: currentOutlet?.primaryColor || '#0f766e' }}
                                >
                                    <MaterialCommunityIcons name="login-variant" size={24} color="white" />
                                    <Text className="text-white text-lg font-bold">Buka Shift Sekarang</Text>
                                </TouchableOpacity>

                                {onLogout && (
                                    <TouchableOpacity
                                        onPress={onLogout}
                                        className="mt-4 py-3"
                                    >
                                        <Text className="text-zinc-400 font-bold text-sm">Ganti Akun / Logout</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ) : (
                        <>
                            {/* Highly Stylized Category Selector */}
                            {categories.length > 0 && (
                                <View className="bg-white py-6 border-b border-zinc-50">
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 4 }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => setSelectedCategoryId(null)}
                                            activeOpacity={0.8}
                                            className={`mr-4 overflow-hidden rounded-[24px] px-8 py-4 border ${selectedCategoryId === null ? 'border-transparent' : 'bg-white border-zinc-100'}`}
                                            style={selectedCategoryId === null ? { backgroundColor: currentOutlet?.primaryColor || '#0f766e' } : {}}
                                        >
                                            <View className="flex-row items-center gap-3">
                                                <MaterialCommunityIcons
                                                    name="apps"
                                                    size={20}
                                                    color={selectedCategoryId === null ? '#ffffff' : '#a1a1aa'}
                                                />
                                                <Text className={`text-base font-black tracking-tight ${selectedCategoryId === null ? 'text-white' : 'text-zinc-500'}`}>
                                                    Semua
                                                </Text>
                                                <View className={`ml-1 rounded-full px-2.5 py-1 ${selectedCategoryId === null ? 'bg-white/20' : 'bg-zinc-100'}`}>
                                                    <Text className={`text-[10px] font-black ${selectedCategoryId === null ? 'text-white' : 'text-zinc-400'}`}>
                                                        {products.length}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                        {categories.map((cat) => {
                                            const count = products.filter(p => p.categoryId === cat.id).length;
                                            const isActive = selectedCategoryId === cat.id;
                                            return (
                                                <TouchableOpacity
                                                    key={cat.id}
                                                    onPress={() => setSelectedCategoryId(cat.id)}
                                                    activeOpacity={0.8}
                                                    className={`mr-4 overflow-hidden rounded-[24px] px-8 py-4 border ${isActive ? 'border-transparent' : 'bg-white border-zinc-100'}`}
                                                    style={isActive ? { backgroundColor: currentOutlet?.primaryColor || '#0f766e' } : {}}
                                                >
                                                    <View className="flex-row items-center gap-3">
                                                        <Text className={`text-base font-black tracking-tight ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                                                            {cat.name}
                                                        </Text>
                                                        <View className={`ml-1 rounded-full px-2.5 py-1 ${isActive ? 'bg-white/20' : 'bg-zinc-100'}`}>
                                                            <Text className={`text-[10px] font-black ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                                                                {count}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Product Grid */}
                            {isLoadingProducts ? (
                                <View className="flex-1 items-center justify-center py-20">
                                    <ActivityIndicator size="large" color="#377f7e" />
                                    <Text className="mt-4 text-zinc-500">Memuat produk...</Text>
                                </View>
                            ) : (
                                <FlatList
                                    key={`grid-${numColumns}`} // Force re-render when column count changes
                                    data={filteredProducts}
                                    keyExtractor={(item) => item.id}
                                    numColumns={numColumns}
                                    contentContainerStyle={{ padding: 12, paddingBottom: isTablet ? 20 : 100, paddingTop: 16 }}
                                    renderItem={({ item }) => (
                                        <View style={{ width: isTablet ? '33.33%' : '50%' }}>
                                            <ProductCard
                                                product={item}
                                                onAdd={() => handleAddProduct(item)}
                                                isTablet={isTablet}
                                                currentOutlet={currentOutlet}
                                            />
                                        </View>
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
                        </>
                    )}
                </View>

                {/* Right Side: Cart (Tablet Only) */}
                {isTablet && (
                    <View className="flex-1 border-l border-zinc-200 bg-white">
                        {sidebarView === 'cart' ? (
                            <CartScreen
                                isSidebar
                                onBack={() => { }} // No back on tablet sidebar
                                onCheckout={() => setSidebarView('checkout')}
                            />
                        ) : (
                            <CheckoutScreen
                                isSidebar
                                onBack={() => setSidebarView('cart')}
                                onComplete={() => {
                                    setSidebarView('cart');
                                    // POS navigation complete logic is already handled by stores and clearCart inside CheckoutScreen
                                }}
                            />
                        )}
                    </View>
                )}
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
                            <View className="bg-red-500 px-1.5 py-0.5 rounded-full">
                                <Text className="text-white text-[10px] font-bold">
                                    {heldOrders.length}
                                </Text>
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
                        <View className="p-6 flex-row justify-between items-center" style={{ backgroundColor: currentOutlet?.primaryColor || '#0f766e' }}>
                            <View>
                                <Text className="text-xl font-bold text-white">Buka Shift Kasir</Text>
                                <Text className="text-white/80 text-sm opacity-90">Modal awal laci kasir</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowShiftModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View className="p-8">
                            <View className="mb-6">
                                <Text className="text-sm font-bold text-primary-900 mb-2 uppercase tracking-wider">Pilih Kasir Bertugas</Text>
                                <View className="bg-zinc-100 rounded-xl border border-zinc-200 overflow-hidden">
                                    <ScrollView className="max-h-40">
                                        {useEmployeeStore.getState().employees.map((emp) => (
                                            <TouchableOpacity
                                                key={emp.id}
                                                onPress={() => setSelectedEmployeeId(emp.id)}
                                                className={`p-4 border-b border-zinc-200 flex-row items-center justify-between ${selectedEmployeeId === emp.id ? 'bg-primary-50' : 'bg-white'}`}
                                            >
                                                <Text className={`font-bold ${selectedEmployeeId === emp.id ? 'text-primary-700' : 'text-zinc-900'}`}>{emp.name}</Text>
                                                {selectedEmployeeId === emp.id && (
                                                    <MaterialCommunityIcons name="check-circle" size={20} color={currentOutlet?.primaryColor || "#377f7e"} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                        {useEmployeeStore.getState().employees.length === 0 && (
                                            <View className="p-4 bg-white">
                                                <Text className="text-zinc-500 italic">Tidak ada karyawan terdaftar.</Text>
                                            </View>
                                        )}
                                    </ScrollView>
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
                                    if (!currentOutlet?.id) return;
                                    // Use selected employee or fallback to current user/owner
                                    const employeeId = selectedEmployeeId || currentEmployee?.id || useAuthStore.getState().user?.id;

                                    if (!employeeId) {
                                        Alert.alert("Erro", "Pilih kasir terlebih dahulu.");
                                        return;
                                    }

                                    setIsProcessingShift(true);
                                    const success = await openShift(currentOutlet.id, employeeId, parseFloat(startingCash || '0'));
                                    setIsProcessingShift(false);
                                    if (success) {
                                        setShowShiftModal(false);
                                        setStartingCash('');
                                        // Reset selection
                                        setSelectedEmployeeId('');
                                    } else {
                                        Alert.alert("Gagal", "Gagal membuka shift. Silakan coba lagi.");
                                    }
                                }}
                                disabled={isProcessingShift}
                                className="w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90"
                                style={{ backgroundColor: currentOutlet?.primaryColor || '#0f766e' }}
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
                        <View className="p-6 flex-row justify-between items-center" style={{ backgroundColor: currentOutlet?.secondaryColor || '#d97706' }}>
                            <View>
                                <Text className="text-xl font-bold text-white">Tutup Shift</Text>
                                <Text className="text-white/80 text-sm opacity-90">Hitung uang fisik di laci</Text>
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
                                className="w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90"
                                style={{ backgroundColor: currentOutlet?.secondaryColor || '#d97706' }}
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
                        <View className="p-8" style={{ backgroundColor: currentOutlet?.primaryColor || '#0f766e' }}>
                            <Text className="text-2xl font-bold text-white">Laporan Rekonsiliasi</Text>
                            <Text className="text-white/90 text-sm mt-1">ID: {shiftReconciliation?.invoiceNumber || shiftReconciliation?.id?.slice(0, 8)}</Text>
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
                                    <Text className="font-bold" style={{ color: currentOutlet?.primaryColor || '#0f766e' }}>Total Uang Fisik</Text>
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
                                className="mt-8 py-4 rounded-2xl items-center shadow-lg shadow-primary-500/30 active:scale-95"
                                style={{ backgroundColor: currentOutlet?.primaryColor || '#0f766e' }}
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
                        <View className="px-6 py-5 rounded-t-[32px]" style={{ backgroundColor: currentOutlet?.primaryColor || '#0f766e' }}>
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-xl font-bold text-white">Pesanan Ditahan</Text>
                                    <Text className="text-white/90 text-sm opacity-90">{heldOrders.length} pesanan aktif</Text>
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
                                                <View className="px-2 py-1 rounded-lg border" style={{ backgroundColor: (currentOutlet?.primaryColor || '#0f766e') + '15', borderColor: (currentOutlet?.primaryColor || '#0f766e') + '30' }}>
                                                    <Text className="text-xs font-medium" style={{ color: currentOutlet?.primaryColor || '#0f766e' }}>
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
                                                className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl active:opacity-90"
                                                style={{ backgroundColor: currentOutlet?.primaryColor || '#0f766e' }}
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

            {/* Cart Summary Bar (Only on Mobile) */}
            {/* Variant Selection Modal */}
            <Modal
                visible={showVariantModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowVariantModal(false)}
            >
                <View className="flex-1 items-center justify-center bg-black/50 px-4">
                    <View className="w-full max-w-md rounded-3xl bg-white overflow-hidden shadow-xl">
                        <View className="flex-row items-center justify-between border-b border-zinc-100 p-6">
                            <View>
                                <Text className="text-xl font-bold text-zinc-900">Pilih Varian</Text>
                                <Text className="text-sm text-zinc-500">{selectedProductForVariant?.name}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowVariantModal(false);
                                    setSelectedProductForVariant(null);
                                }}
                                className="rounded-xl p-2 bg-zinc-50"
                            >
                                <MaterialCommunityIcons name="close" size={24} color="#71717a" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="max-h-[60vh] p-6">
                            <View className="gap-3 pb-6">
                                {selectedProductForVariant?.variants?.filter(v => v.isActive).map((variant) => {
                                    const finalPrice = (selectedProductForVariant?.price || 0) + parseFloat(variant.priceAdjustment);
                                    return (
                                        <TouchableOpacity
                                            key={variant.id}
                                            onPress={() => handleAddProduct(selectedProductForVariant!, variant)}
                                            disabled={variant.stock <= 0}
                                            className="flex-row items-center justify-between rounded-2xl border border-zinc-100 bg-white p-4 active:scale-95 disabled:opacity-50"
                                        >
                                            <View className="flex-row items-center gap-4">
                                                <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                                                    <MaterialCommunityIcons name="layers-outline" size={24} color={currentOutlet?.primaryColor || "#0f766e"} />
                                                </View>
                                                <View>
                                                    <Text className="font-bold text-zinc-900">{variant.name}</Text>
                                                    <Text className="text-xs text-zinc-500">Stok: {variant.stock}</Text>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className="font-black text-primary-600" style={{ color: currentOutlet?.primaryColor || "#0f766e" }}>
                                                    {formatCurrency(finalPrice)}
                                                </Text>
                                                {parseFloat(variant.priceAdjustment) !== 0 && (
                                                    <Text className="text-[10px] font-bold text-zinc-400">
                                                        {parseFloat(variant.priceAdjustment) > 0 ? '+' : ''}{formatCurrency(parseFloat(variant.priceAdjustment))}
                                                    </Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Cart Summary Bar (Only on Mobile) */}
            {!isTablet && (
                <CartSummary
                    itemCount={getItemCount()}
                    total={getTotal()}
                    onViewCart={onViewCart}
                    currentOutlet={currentOutlet}
                />
            )}
        </View>
    );
}

import '../../global.css';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, FlatList, ActivityIndicator, Image } from 'react-native';
import { useCartStore, CartItem, HeldOrder } from '../store/cartStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, LocalCustomer } from '../db/client';
import { useEmployeeStore } from '../store/employeeStore';
import { useToast } from '../components/Toast';
import ManagerAuthModal from '../components/ManagerAuthModal';
import { useSync } from '../hooks/useSync';
import { useOutletStore } from '../store/outletStore';
import { useShiftStore } from '../store/shiftStore';
import { useLoyaltyStore } from '../store/loyaltyStore';

function formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

interface CartItemRowProps {
    item: CartItem;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
    currentOutlet?: any;
}

function CartItemRow({ item, onUpdateQuantity, onRemove, currentOutlet }: CartItemRowProps) {
    return (
        <View className="mb-3 flex-row items-center rounded-2xl bg-white p-4 shadow-sm  border border-zinc-100 ">
            {/* Product Image */}
            <View
                className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-primary-50 overflow-hidden"
                style={{ backgroundColor: (currentOutlet?.primaryColor || '#377f7e') + '15' }}
            >
                {(item.imageUrl || (item as any).image_url) ? (
                    <Image
                        source={{ uri: item.imageUrl || (item as any).image_url }}
                        className="h-full w-full"
                        resizeMode="cover"
                    />
                ) : (
                    <MaterialCommunityIcons name="food" size={24} color={currentOutlet?.primaryColor || '#377f7e'} />
                )}
            </View>

            {/* Product Info */}
            <View className="flex-1">
                <Text className="text-base font-semibold text-zinc-900 " numberOfLines={1}>
                    {item.name}
                </Text>
                {item.variantName && (
                    <Text className="text-xs font-bold text-primary-600 " style={{ color: currentOutlet?.primaryColor || '#377f7e' }}>
                        {item.variantName}
                    </Text>
                )}
                <Text className="text-sm font-medium text-zinc-500 ">
                    {formatCurrency(item.price)}
                </Text>
            </View>

            {/* Quantity Controls */}
            <View className="flex-row items-center gap-3 rounded-lg bg-zinc-50 p-1 ">
                <TouchableOpacity
                    onPress={() => onUpdateQuantity(item.quantity - 1)}
                    className="h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm "
                >
                    <MaterialCommunityIcons name="minus" size={16} color="#3f3f46" />
                </TouchableOpacity>

                <Text className="min-w-[20px] text-center text-sm font-bold text-zinc-900 ">
                    {item.quantity}
                </Text>

                <TouchableOpacity
                    onPress={() => onUpdateQuantity(item.quantity + 1)}
                    className="h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm "
                >
                    <MaterialCommunityIcons name="plus" size={16} color="#3f3f46" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

interface CartScreenProps {
    onBack: () => void;
    onCheckout: () => void;
    isSidebar?: boolean;
}

export default function CartScreen({ onBack, onCheckout, isSidebar = false }: CartScreenProps) {
    // Optimized store selectors
    const items = useCartStore(state => state.items);
    const updateQuantity = useCartStore(state => state.updateQuantity);
    const removeItem = useCartStore(state => state.removeItem);
    const getTotal = useCartStore(state => state.getTotal);
    const clearCart = useCartStore(state => state.clearCart);
    const customer = useCartStore(state => state.customer);
    const setCustomer = useCartStore(state => state.setCustomer);
    const holdOrder = useCartStore(state => state.holdOrder);
    const heldOrders = useCartStore(state => state.heldOrders);
    const fetchHeldOrders = useCartStore(state => state.fetchHeldOrders);
    const deleteHeldOrder = useCartStore(state => state.deleteHeldOrder);
    const resumeOrder = useCartStore(state => state.resumeOrder);
    const isFetchingHeldOrders = useCartStore(state => state.isFetchingHeldOrders);

    const activeShift = useShiftStore(state => state.activeShift);
    const currentOutlet = useOutletStore(state => state.currentOutlet);
    const tiers = useLoyaltyStore(state => state.tiers);

    // Auth & Sync
    const { isOnline } = useSync();
    const currentEmployee = useEmployeeStore(state => state.currentEmployee);

    const getMemberDiscount = () => {
        if (!customer?.tier_id) return 0;
        const tier = tiers.find(t => t.id === customer.tier_id);
        if (!tier) return 0;
        const discountPercent = parseFloat(tier.discountPercent) || 0;
        return (getTotal() * discountPercent) / 100;
    };

    const getFinalTotal = () => getTotal() - getMemberDiscount();

    // Check if user is restricted (requires auth to delete items)
    // Allowed roles: manager, owner, admin, superadmin, manager/owner
    const roleName = currentEmployee?.role?.toLowerCase() || '';
    const allowedRoles = ['manager', 'admin', 'owner', 'superadmin', 'manager/owner'];

    // If NO role (null/empty) -> Restricted (fail safe)
    // If role is NOT in allowed list -> Restricted
    const isRestricted = !roleName || !allowedRoles.includes(roleName);

    console.log(`[CartScreen] currentEmployee: ${currentEmployee?.name}, role: ${currentEmployee?.role}, asLow: ${roleName}, isRestricted: ${isRestricted}`);


    const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
    const [customers, setCustomers] = useState<LocalCustomer[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [managerAuthVisible, setManagerAuthVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState<'delete_item' | 'clear_cart' | null>(null);
    const [pendingRemovals, setPendingRemovals] = useState<string | null>(null);
    const { showToast } = useToast();
    const [isHeldOrdersModalVisible, setIsHeldOrdersModalVisible] = useState(false);
    const [isHoldInputVisible, setIsHoldInputVisible] = useState(false);
    const [holdNote, setHoldNote] = useState("");
    const [isHolding, setIsHolding] = useState(false);

    const isEmpty = items.length === 0;

    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        console.log(`[CartScreen] handleUpdateQuantity: itemId=${itemId}, newQuantity=${newQuantity}`);
        if (newQuantity === 0) {
            console.log(`[CartScreen] Quantity is 0, triggering handleRemoveItem`);
            handleRemoveItem(itemId);
            return;
        }

        // Find the item to check max quantity
        const item = items.find(i => i.id === itemId);
        if (item && newQuantity > (item.maxQuantity || Infinity)) {
            console.log(`[CartScreen] Max quantity reached for ${item.name}`);
            showToast('Stok Habis', 'Stok produk ini sudah habis!', 'warning');
            return;
        }

        updateQuantity(itemId, newQuantity);
    };

    const handleRemoveItem = (itemId: string) => {
        console.log(`[CartScreen] handleRemoveItem: itemId=${itemId}, isRestricted=${isRestricted}, role=${currentEmployee?.role}`);
        if (isRestricted) {
            // If Restricted, prompt for manager auth
            console.log(`[CartScreen] Prompting for manager auth for removal`);
            setPendingRemovals(itemId);
            setPendingAction("delete_item");
            setManagerAuthVisible(true);
        } else {
            // Can delete directly if manager/admin
            console.log(`[CartScreen] Removing item directly (authorized)`);
            removeItem(itemId);
        }
    };

    const handleManagerAuthSuccess = () => {
        console.log(`[CartScreen] Manager authorization successful, pendingAction: ${pendingAction}`);
        setManagerAuthVisible(false);
        if (pendingAction === 'delete_item' && pendingRemovals) {
            removeItem(pendingRemovals);
            setPendingRemovals(null);
            setPendingAction(null);
            showToast('Item Dihapus', 'Produk telah dihapus dari keranjang', 'success');
        } else if (pendingAction === 'clear_cart') {
            clearCart();
            setPendingAction(null);
            showToast('Keranjang Direset', 'Semua item telah dihapus', 'success');
        }
    };

    const handleClearCart = () => {
        if (isRestricted) {
            setPendingAction("clear_cart");
            setManagerAuthVisible(true);
        } else {
            clearCart();
            showToast('Keranjang Direset', 'Semua item telah dihapus', 'success');
        }
    };


    useEffect(() => {
        let isMounted = true;

        async function init() {
            await loadCustomers();
            if (isMounted && isOnline && currentOutlet?.id) {
                console.log(`[CartScreen] Triggering fetchHeldOrders for outlet: ${currentOutlet.id}`);
                try {
                    await fetchHeldOrders(currentOutlet.id);
                } catch (err) {
                    console.error('[CartScreen] fetchHeldOrders failed:', err);
                }
            }
        }

        init();
        return () => { isMounted = false; };
    }, [isOnline, currentOutlet?.id]);

    const loadCustomers = async () => {
        // Try API fetch when online
        // Get outlet ID - prefer currentOutlet but fallback to first available outlet
        const outletId = currentOutlet?.id || useOutletStore.getState().outlets[0]?.id;

        if (isOnline && outletId) {
            try {
                const { API_URL } = await import('../config/api');
                const response = await fetch(`${API_URL}/customers?outletId=${outletId}`);
                if (response.ok) {
                    const apiCustomers = await response.json();
                    console.log('[CartScreen] Fetched customers from API:', apiCustomers.length);
                    // Map API response to LocalCustomer format
                    const mappedCustomers: LocalCustomer[] = apiCustomers.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        phone: c.phone || null,
                        email: c.email || null,
                        points: c.points || 0,
                        tier_id: c.tierId || null,
                    }));
                    setCustomers(mappedCustomers);
                    return;
                }
            } catch (error) {
                console.warn('Failed to fetch customers from API, falling back to local:', error);
            }
        } else {
            console.log('[CartScreen] Offline or no outlet, using local DB. isOnline:', isOnline, 'outletId:', outletId);
        }

        // Fallback to local SQLite
        const allCustomers = await db.customers.getAll();
        setCustomers(allCustomers);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery))
    );

    return (
        <View className="flex-1 bg-zinc-50 ">
            {/* Header */}
            {!isSidebar && (
                <View className="flex-row items-center justify-between bg-white px-4 pb-4 pt-14 shadow-sm ">
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity
                            onPress={onBack}
                            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 active:bg-zinc-200 "
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#18181b" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-zinc-900 ">
                            Keranjang ({items.length})
                        </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                        {/* Held Orders List Button */}
                        <TouchableOpacity
                            onPress={() => setIsHeldOrdersModalVisible(true)}
                            className="h-10 w-10 items-center justify-center rounded-full bg-amber-100 active:bg-amber-200 relative"
                        >
                            <MaterialCommunityIcons name="clipboard-clock-outline" size={22} color="#d97706" />
                            {heldOrders.length > 0 && (
                                <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-red-500 border border-white">
                                    <Text className="text-[10px] font-bold text-white">{heldOrders.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {!isEmpty && (
                            <>
                                {/* Hold Current Order Button */}
                                <TouchableOpacity
                                    onPress={() => setIsHoldInputVisible(true)}
                                    className="h-10 w-10 items-center justify-center rounded-full bg-blue-100 active:bg-blue-200"
                                >
                                    <MaterialCommunityIcons name="pause" size={22} color="#2563eb" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleClearCart} className="h-10 w-10 items-center justify-center rounded-full bg-red-100 active:bg-red-200">
                                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ef4444" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            )}

            {/* Cart Items */}
            {isEmpty ? (
                <View className="flex-1 items-center justify-center p-8">
                    <View className="mb-6 h-32 w-32 items-center justify-center rounded-full bg-zinc-100 ">
                        <MaterialCommunityIcons name="cart-off" size={64} color="#d4d4d8" />
                    </View>
                    <Text className="mb-2 text-xl font-bold text-zinc-900 ">Keranjang Kosong</Text>
                    <Text className="text-center text-zinc-500 ">
                        Belum ada produk yang dipilih. Silakan kembali ke menu untuk memesan.
                    </Text>
                    <TouchableOpacity
                        onPress={onBack}
                        className="mt-8 rounded-full bg-primary-600 px-8 py-3 shadow-lg shadow-primary-500/30"
                        style={{ backgroundColor: currentOutlet?.primaryColor || '#0f766e', shadowColor: currentOutlet?.primaryColor || '#0f766e' }}
                    >
                        <Text className="font-bold text-white">Mulai Pesan</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View className="flex-1">
                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 200 }}>
                        {/* Customer Selector */}
                        <TouchableOpacity
                            onPress={() => setIsCustomerModalVisible(true)}
                            className="mb-4 flex-row items-center justify-between rounded-xl border border-zinc-200 bg-white p-4"
                        >
                            <View className="flex-row items-center gap-3">
                                <View
                                    className="h-10 w-10 items-center justify-center rounded-full"
                                    style={{ backgroundColor: customer ? (currentOutlet?.primaryColor || '#377f7e') + '20' : '#f4f4f5' }}
                                >
                                    <MaterialCommunityIcons
                                        name={customer ? "account-check" : "account-plus"}
                                        size={20}
                                        color={customer ? (currentOutlet?.primaryColor || '#377f7e') : "#71717a"}
                                    />
                                </View>
                                <View>
                                    <Text className="font-medium text-zinc-900">
                                        {customer ? customer.name : "Pilih Pelanggan"}
                                    </Text>
                                    <Text className="text-xs text-zinc-500">
                                        {customer ? `${customer.points} Poin` : "Simpan poin untuk pelanggan"}
                                    </Text>
                                </View>
                            </View>
                            {customer && (
                                <TouchableOpacity onPress={() => setCustomer(null)} className="p-2">
                                    <MaterialCommunityIcons name="close" size={20} color="#71717a" />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>

                        {items.map((item) => (
                            <CartItemRow
                                key={item.id}
                                item={item}
                                onUpdateQuantity={(qty) => handleUpdateQuantity(item.id, qty)}
                                onRemove={() => handleRemoveItem(item.id)}
                                currentOutlet={currentOutlet}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Checkout Bar */}
            {!isEmpty && (
                <View className={`${isSidebar ? 'border-t border-zinc-100 px-4 py-4' : 'absolute bottom-0 left-0 right-0 rounded-t-[32px] bg-white p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'} `}>
                    <View className="mb-4 space-y-2">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-zinc-500 ">Subtotal</Text>
                            <Text className="text-lg font-semibold text-zinc-900 ">
                                {formatCurrency(useCartStore.getState().getSubtotal())}
                            </Text>
                        </View>
                        {getMemberDiscount() > 0 && (
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-1">
                                    <MaterialCommunityIcons name="star" size={14} color="#059669" />
                                    <Text className="text-green-600 font-medium">Diskon Member</Text>
                                </View>
                                <Text className="text-lg font-semibold text-green-600 ">
                                    -{formatCurrency(getMemberDiscount())}
                                </Text>
                            </View>
                        )}

                        {/* Tax Row */}
                        {(() => {
                            const { taxSettings } = useOutletStore.getState();
                            const taxAmount = useCartStore.getState().getTax();

                            if (taxSettings?.isEnabled && taxAmount > 0) {
                                return (
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-zinc-500">
                                            {taxSettings.name} ({taxSettings.rate}%)
                                            {taxSettings.isInclusive ? " (Termasuk)" : ""}
                                        </Text>
                                        <Text className="text-lg font-semibold text-zinc-900">
                                            {formatCurrency(taxAmount)}
                                        </Text>
                                    </View>
                                );
                            }
                            return null;
                        })()}

                        <View className="flex-row items-center justify-between border-t border-zinc-100 pt-2">
                            <Text className="text-zinc-500 ">Total Pembayaran</Text>
                            <Text className="text-2xl font-bold text-zinc-900 ">
                                {formatCurrency(getFinalTotal())}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            if (!activeShift) {
                                showToast('Shift Belum Dibuka', 'Buka shift terlebih dahulu di menu utama!', 'error');
                                return;
                            }
                            onCheckout();
                        }}
                        disabled={!activeShift}
                        className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 shadow-lg active:opacity-90 ${activeShift ? 'bg-secondary-500 shadow-secondary-500/20' : 'bg-zinc-300 shadow-none'}`}
                        style={activeShift ? {
                            backgroundColor: currentOutlet?.secondaryColor || '#f59e0b',
                            shadowColor: currentOutlet?.secondaryColor || '#f59e0b'
                        } : {}}
                    >
                        <Text className={`text-base font-bold ${activeShift ? 'text-white' : 'text-zinc-500'}`} style={activeShift ? { color: '#ffffff' } : {}}>
                            {activeShift ? 'Checkout Sekarang' : 'Buka Shift Dahulu'}
                        </Text>
                        <MaterialCommunityIcons name={activeShift ? "arrow-right" : "lock"} size={20} color={activeShift ? "#ffffff" : "#71717a"} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Customer Selection Modal */}
            <Modal
                visible={isCustomerModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View className="flex-1 bg-zinc-50 pt-4">
                    <View className="flex-row items-center justify-between px-4 pb-4">
                        <Text className="text-lg font-bold text-zinc-900">Pilih Pelanggan</Text>
                        <TouchableOpacity
                            onPress={() => setIsCustomerModalVisible(false)}
                            className="rounded-full bg-zinc-100 p-2"
                        >
                            <MaterialCommunityIcons name="close" size={24} color="#18181b" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-4 pb-4">
                        <View className="flex-row items-center rounded-xl bg-white px-4 py-3 border border-zinc-200">
                            <MaterialCommunityIcons name="magnify" size={20} color="#a1a1aa" />
                            <TextInput
                                placeholder="Cari nama atau no. hp..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                className="ml-2 flex-1 text-base text-zinc-900"
                            />
                        </View>
                    </View>

                    <FlatList
                        data={filteredCustomers}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 16 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    setCustomer(item);
                                    setIsCustomerModalVisible(false);
                                }}
                                className="mb-3 flex-row items-center justify-between rounded-xl bg-white p-4 border border-zinc-100"
                            >
                                <View className="flex-row items-center gap-3">
                                    <View
                                        className="h-10 w-10 items-center justify-center rounded-full"
                                        style={{ backgroundColor: (currentOutlet?.primaryColor || '#377f7e') + '15' }}
                                    >
                                        <Text
                                            className="font-bold"
                                            style={{ color: currentOutlet?.primaryColor || '#2e6a69' }}
                                        >
                                            {item.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className="font-semibold text-zinc-900">{item.name}</Text>
                                        <Text className="text-zinc-500">{item.phone || "No phone"}</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text
                                        className="font-medium"
                                        style={{ color: currentOutlet?.secondaryColor || '#f2b30c' }}
                                    >
                                        {item.points} Poin
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                            <View className="items-center py-8">
                                <Text className="text-zinc-500">Pelanggan tidak ditemukan</Text>
                            </View>
                        )}
                    />
                </View>
            </Modal>

            {/* Hold Order Input Modal */}
            <Modal
                visible={isHoldInputVisible}
                transparent
                animationType="fade"
            >
                <View className="flex-1 items-center justify-center bg-black/50 px-4">
                    <View className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <Text className="mb-2 text-xl font-bold text-slate-800">Tahan Pesanan</Text>
                        <Text className="mb-4 text-slate-500">Berikan catatan untuk pesanan ini (opsional)</Text>

                        <TextInput
                            className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800"
                            placeholder="Contoh: Meja 5, Ditunggu Pak Budi, dll"
                            value={holdNote}
                            onChangeText={setHoldNote}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setIsHoldInputVisible(false)}
                                className="flex-1 items-center justify-center rounded-xl bg-slate-100 py-3"
                            >
                                <Text className="font-semibold text-slate-600">Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    if (!activeShift) {
                                        showToast('Error', 'Shift belum dibuka!', 'error');
                                        return;
                                    }
                                    setIsHolding(true);
                                    const success = await holdOrder(currentOutlet?.id || '', holdNote);
                                    setIsHolding(false);
                                    if (success) {
                                        setHoldNote("");
                                        setIsHoldInputVisible(false);
                                        showToast('Sukses', 'Pesanan berhasil ditahan', 'success');
                                        onBack(); // Go back to POS
                                    } else {
                                        showToast('Gagal', 'Gagal menahan pesanan', 'error');
                                    }
                                }}
                                disabled={isHolding}
                                className="flex-1 items-center justify-center rounded-xl bg-blue-600 py-3"
                            >
                                {isHolding ? (
                                    <Text className="font-semibold text-white">Menyimpan...</Text>
                                ) : (
                                    <Text className="font-semibold text-white">Simpan</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Held Orders List Modal */}
            <Modal
                visible={isHeldOrdersModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View className="flex-1 bg-slate-50 pt-4">
                    <View className="flex-row items-center justify-between px-4 pb-4 border-b border-slate-200 bg-white pt-2">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-xl font-bold text-slate-800">Pesanan Ditahan</Text>
                            {isFetchingHeldOrders && <ActivityIndicator size="small" color="#2563eb" />}
                        </View>
                        <View className="flex-row items-center gap-2">
                            <TouchableOpacity
                                onPress={() => currentOutlet?.id && fetchHeldOrders(currentOutlet.id)}
                                disabled={isFetchingHeldOrders}
                                className="rounded-full bg-blue-50 p-2"
                            >
                                <MaterialCommunityIcons
                                    name="refresh"
                                    size={22}
                                    color={isFetchingHeldOrders ? "#94a3b8" : "#2563eb"}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setIsHeldOrdersModalVisible(false)}
                                className="rounded-full bg-slate-100 p-2"
                            >
                                <MaterialCommunityIcons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList
                        data={heldOrders}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 16 }}
                        ListEmptyComponent={() => (
                            <View className="items-center py-12">
                                {isFetchingHeldOrders ? (
                                    <View className="items-center">
                                        <ActivityIndicator size="large" color="#2563eb" />
                                        <Text className="mt-4 text-slate-500">Memuat pesanan...</Text>
                                    </View>
                                ) : (
                                    <>
                                        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                                            <MaterialCommunityIcons name="clipboard-text-off-outline" size={40} color="#94a3b8" />
                                        </View>
                                        <Text className="text-lg font-medium text-slate-600">Tidak ada pesanan ditahan</Text>
                                        <Text className="text-sm text-slate-400 text-center px-8 mt-2">
                                            Pesanan yang ditahan di outlet ini akan muncul di sini.
                                        </Text>
                                    </>
                                )}
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <View className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <View className="flex-row items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-100">
                                    <View>
                                        <Text className="font-bold text-slate-700">
                                            {item.customerName || "Pelanggan Umum"}
                                        </Text>
                                        <Text className="text-xs text-slate-500">
                                            {new Date(item.createdAt).toLocaleString('id-ID', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                    <Text className="font-bold text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                        {formatCurrency(item.totalAmount)}
                                    </Text>
                                </View>

                                <View className="p-4">
                                    {item.notes && (
                                        <View className="mb-3 flex-row gap-2 rounded-lg bg-yellow-50 p-2 border border-yellow-100">
                                            <MaterialCommunityIcons name="note-text-outline" size={16} color="#d97706" />
                                            <Text className="flex-1 text-xs italic text-yellow-700">{item.notes}</Text>
                                        </View>
                                    )}

                                    <Text className="mb-3 text-sm text-slate-600">
                                        {item.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                                    </Text>

                                    <View className="flex-row gap-3">
                                        <TouchableOpacity
                                            onPress={async () => {
                                                const success = await deleteHeldOrder(item.id);
                                                if (success) showToast("Dihapus", "Pesanan dihapus", "success");
                                                else showToast("Gagal", "Gagal menghapus", "error");
                                            }}
                                            className="flex-row items-center justify-center rounded-xl bg-red-50 px-4 py-2 border border-red-100"
                                        >
                                            <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={async () => {
                                                console.log('[CartScreen] Resuming held order:', item.id, 'with', item.items.length, 'items');
                                                await resumeOrder(item);
                                                setIsHeldOrdersModalVisible(false);
                                                showToast("Dilanjutkan", "Pesanan dimuat kembali", "success");
                                            }}
                                            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2"
                                            style={{ backgroundColor: currentOutlet?.primaryColor || '#2e6a69' }}
                                        >
                                            <MaterialCommunityIcons name="play-circle-outline" size={20} color="white" />
                                            <Text className="font-bold text-white">Lanjutkan</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    />
                </View>
            </Modal >

            <ManagerAuthModal
                visible={managerAuthVisible}
                onClose={() => {
                    setManagerAuthVisible(false);
                    setPendingRemovals(null);
                    setPendingAction(null);
                }}
                onSuccess={handleManagerAuthSuccess}
                actionDescription={pendingAction === 'clear_cart' ? 'Mengosongkan/Reset seluruh keranjang' : 'Hapus item dari keranjang'}
            />
        </View >
    );
}

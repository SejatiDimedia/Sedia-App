import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, CheckCircle, XCircle, PackageCheck } from "lucide-react-native";
import { theme } from "../config/theme";
import { useOutletStore } from "../store/outletStore";
import { useAuth } from "../hooks/useAuth";
import { API_URL } from "../config/api";

interface PurchaseOrderDetailScreenProps {
    onBack: () => void;
    poId: string; // Passed from parent
}

export default function PurchaseOrderDetailScreen({ onBack, poId }: PurchaseOrderDetailScreenProps) {
    const { token } = useAuth() as any;
    const { currentOutlet } = useOutletStore();

    // Dynamic theme colors from outlet
    const primaryColor = currentOutlet?.primaryColor || theme.colors.primary[600];

    const [po, setPo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        loadDetail();
    }, []);

    const loadDetail = async () => {
        setIsLoading(true);
        try {
            const url = `${API_URL}/purchase-orders/${poId}`;
            console.log(`[PO Detail] Fetching: ${url}`);
            console.log(`[PO Detail] Token present: ${!!token}`);

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log(`[PO Detail] Response status: ${res.status}`);

            if (res.ok) {
                const data = await res.json();
                console.log(`[PO Detail] Data received:`, data?.invoiceNumber);
                setPo(data);
            } else {
                const errorText = await res.text();
                console.error(`[PO Detail] Error response: ${errorText}`);
                Alert.alert("Error", `Gagal memuat detail PO: ${res.status}`);
            }
        } catch (error: any) {
            console.error("[PO Detail] Fetch error:", error);
            Alert.alert("Error", "Gagal memuat detail PO: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReceive = () => {
        Alert.alert(
            "Terima Barang",
            "Apakah Anda yakin semua barang sudah diterima? Stok akan bertambah otomatis.",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Ya, Terima Semua",
                    onPress: async () => {
                        setIsActionLoading(true);
                        try {
                            const response = await fetch(`${API_URL}/purchase-orders/${poId}`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ action: "receive" })
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || errorData.message || 'Gagal menerima barang');
                            }
                            Alert.alert("Sukses", "Barang berhasil diterima & stok diperbarui!");
                            loadDetail();
                        } catch (error: any) {
                            Alert.alert("Error", "Gagal menerima barang: " + (error.response?.data?.error || error.message));
                        } finally {
                            setIsActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCancel = () => {
        Alert.alert(
            "Batalkan PO",
            "Apakah Anda yakin ingin membatalkan PO ini?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Ya, Batalkan",
                    style: "destructive",
                    onPress: async () => {
                        setIsActionLoading(true);
                        try {
                            await fetch(`${API_URL}/purchase-orders/${poId}`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    action: "update_status",
                                    status: "cancelled"
                                })
                            });
                            loadDetail();
                        } catch (error: any) {
                            Alert.alert("Error", "Gagal membatalkan PO");
                        } finally {
                            setIsActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleOrder = async () => { // Example status update to 'ordered'
        setIsActionLoading(true);
        try {
            await fetch(`${API_URL}/purchase-orders/${poId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: "update_status",
                    status: "ordered"
                })
            });
            loadDetail();
        } catch (error: any) {
            Alert.alert("Error", "Gagal update status");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) return <View className="flex-1 justify-center items-center bg-zinc-50"><ActivityIndicator size="large" color={primaryColor} /></View>;
    if (!po) return <View className="flex-1 justify-center items-center bg-zinc-50"><Text className="text-center text-zinc-500">Tidak ditemukan</Text></View>;

    return (
        <SafeAreaView className="flex-1 bg-zinc-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-zinc-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-zinc-50">
                        <ArrowLeft size={20} color={theme.colors.zinc[900]} />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-lg font-bold text-zinc-900">{po.invoiceNumber}</Text>
                        <Text className="text-zinc-500 text-xs">{po.supplier.name}</Text>
                    </View>
                </View>
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: primaryColor + '20' }}>
                    <Text className="text-xs font-bold uppercase" style={{ color: primaryColor }}>{po.status}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Details Card */}
                <View className="bg-white p-4 rounded-xl border border-zinc-100 mb-4 shadow-sm">
                    <Text className="text-zinc-500 text-xs uppercase font-bold mb-4">Informasi Order</Text>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-zinc-500">Tanggal Order</Text>
                        <Text className="font-medium">{new Date(po.orderDate).toLocaleDateString("id-ID")}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-zinc-500">Estimasi Tiba</Text>
                        <Text className="font-medium">{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString("id-ID") : '-'}</Text>
                    </View>
                    <View className="flex-row justify-between mt-2 pt-2 border-t border-zinc-50">
                        <Text className="font-bold text-zinc-900">Total Biaya</Text>
                        <Text className="font-bold text-lg text-primary-600" style={{ color: theme.colors.primary[600] }}>
                            Rp {parseFloat(po.totalAmount).toLocaleString("id-ID")}
                        </Text>
                    </View>
                </View>

                {/* Items List */}
                <Text className="text-zinc-500 text-xs uppercase font-bold mb-2 ml-1">Detail Barang</Text>
                {po.items.map((item: any, idx: number) => (
                    <View key={idx} className="bg-white p-3 rounded-xl border border-zinc-100 mb-2 flex-row justify-between items-center">
                        <View className="flex-1">
                            <Text className="font-bold text-zinc-900">{item.product.name} {item.variant ? `(${item.variant.name})` : ''}</Text>
                            <Text className="text-zinc-500 text-xs">{item.quantity} x Rp {parseFloat(item.costPrice).toLocaleString()}</Text>
                        </View>
                        <Text className="font-medium text-zinc-800">Rp {parseFloat(item.subtotal).toLocaleString()}</Text>
                    </View>
                ))}

                <View className="mt-4 mb-10">
                    <Text className="text-zinc-500 text-xs uppercase font-bold mb-2 ml-1">Catatan</Text>
                    <View className="bg-white p-4 rounded-xl border border-zinc-100">
                        <Text className="text-zinc-600 italic">{po.notes || "Tidak ada catatan."}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="p-4 bg-white border-t border-zinc-100 flex-row gap-3">
                {po.status === 'draft' && (
                    <TouchableOpacity
                        onPress={handleOrder} disabled={isActionLoading}
                        className="flex-1 py-3 rounded-xl items-center justify-center"
                        style={{ backgroundColor: primaryColor, opacity: isActionLoading ? 0.5 : 1 }}
                    >
                        <Text className="text-white font-bold">Mark Ordered</Text>
                    </TouchableOpacity>
                )}

                {(po.status === 'ordered') && (
                    <TouchableOpacity
                        onPress={handleReceive} disabled={isActionLoading}
                        className="flex-1 py-3 rounded-xl items-center justify-center flex-row gap-2"
                        style={{ backgroundColor: '#10b981', opacity: isActionLoading ? 0.5 : 1 }}
                    >
                        <PackageCheck size={20} color="white" />
                        <Text className="text-white font-bold">Terima Barang</Text>
                    </TouchableOpacity>
                )}

                {(po.status === 'draft' || po.status === 'ordered') && (
                    <TouchableOpacity
                        onPress={handleCancel} disabled={isActionLoading}
                        className="aspect-square items-center justify-center rounded-xl"
                        style={{ backgroundColor: '#fef2f2', opacity: isActionLoading ? 0.5 : 1 }}
                    >
                        <XCircle size={24} color="#ef4444" />
                    </TouchableOpacity>
                )}

                {po.status === 'received' && (
                    <View className="flex-1 bg-zinc-100 py-3 rounded-xl items-center justify-center">
                        <Text className="text-zinc-500 font-bold">Sudah Diterima</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

interface TaxManagementScreenProps {
    onBack: () => void;
    onOpenDrawer: () => void;
}

export default function TaxManagementScreen({ onBack, onOpenDrawer }: TaxManagementScreenProps) {
    const { currentOutlet } = useOutletStore();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        isEnabled: false,
        name: "PPN",
        rate: "11",
        isInclusive: false,
        type: "percentage"
    });

    useEffect(() => {
        fetchSettings();
    }, [currentOutlet]);

    const fetchSettings = async () => {
        if (!currentOutlet || !token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/tax-settings?outletId=${currentOutlet.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setSettings({
                        isEnabled: data.is_enabled ?? data.isEnabled ?? false,
                        name: data.name || "PPN",
                        rate: String(data.rate || "0"),
                        isInclusive: data.is_inclusive ?? data.isInclusive ?? false,
                        type: data.type || "percentage"
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch tax settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentOutlet || !token) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/tax-settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                },
                body: JSON.stringify({
                    outletId: currentOutlet.id,
                    ...settings
                }),
            });

            if (res.ok) {
                Alert.alert("Sukses", "Pengaturan pajak berhasil disimpan");
            } else {
                throw new Error("Gagal menyimpan pengaturan");
            }
        } catch (error: any) {
            Alert.alert("Gagal", error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-zinc-50">
                <ActivityIndicator size="large" color={currentOutlet?.primaryColor || "#0f766e"} />
                <Text className="mt-4 text-zinc-500 font-medium">Memuat pengaturan pajak...</Text>
            </View>
        );
    }

    const primaryColor = currentOutlet?.primaryColor || '#0f766e';

    return (
        <SafeAreaView className="flex-1 bg-zinc-50" edges={['top']}>
            {/* Header */}
            <View className="px-5 py-4 flex-row items-center justify-between bg-white border-b border-zinc-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="w-10 h-10 items-center justify-center rounded-xl bg-zinc-50 active:bg-zinc-100">
                        <MaterialCommunityIcons name="arrow-left" size={24} color={primaryColor} />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-lg font-black text-zinc-800">Pajak & Biaya</Text>
                        <Text className="text-xs font-medium text-zinc-400">{currentOutlet?.name}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={onOpenDrawer} className="w-10 h-10 items-center justify-center rounded-xl bg-zinc-50 active:bg-zinc-100">
                    <MaterialCommunityIcons name="menu" size={24} color={primaryColor} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5">
                {/* Status Card */}
                <View className="bg-white rounded-3xl p-6 mb-6 border border-zinc-100 shadow-sm">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-4">
                            <Text className="text-base font-bold text-zinc-900 mb-1">Status Pajak</Text>
                            <Text className="text-xs text-zinc-500 leading-5">
                                Aktifkan untuk mulai menghitung pajak secara otomatis di setiap transaksi.
                            </Text>
                        </View>
                        <Switch
                            value={settings.isEnabled}
                            onValueChange={(val) => setSettings({ ...settings, isEnabled: val })}
                            trackColor={{ false: "#e4e4e7", true: primaryColor + '40' }}
                            thumbColor={settings.isEnabled ? primaryColor : "#f4f4f5"}
                        />
                    </View>
                </View>

                {/* Form Fields */}
                <View style={{ opacity: settings.isEnabled ? 1 : 0.5 }}>
                    <View className="space-y-4">
                        <View>
                            <Text className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Nama Pajak</Text>
                            <View className="flex-row items-center bg-white rounded-2xl border border-zinc-200 px-4 py-3 shadow-sm">
                                <MaterialCommunityIcons name="label-outline" size={20} color="#a1a1aa" />
                                <TextInput
                                    editable={settings.isEnabled}
                                    value={settings.name}
                                    onChangeText={(val) => setSettings({ ...settings, name: val })}
                                    placeholder="Contoh: PPN, Pajak Resto"
                                    className="flex-1 ml-3 text-base text-zinc-900"
                                    placeholderTextColor="#a1a1aa"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Persentase (%)</Text>
                            <View className="flex-row items-center bg-white rounded-2xl border border-zinc-200 px-4 py-3 shadow-sm">
                                <MaterialCommunityIcons name="percent" size={20} color="#a1a1aa" />
                                <TextInput
                                    editable={settings.isEnabled}
                                    value={settings.rate}
                                    onChangeText={(val) => setSettings({ ...settings, rate: val })}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    className="flex-1 ml-3 text-lg font-bold text-zinc-900"
                                    placeholderTextColor="#a1a1aa"
                                />
                                <Text className="font-black text-zinc-400">%</Text>
                            </View>
                        </View>

                        {/* Inclusive Checkbox */}
                        <TouchableOpacity
                            disabled={!settings.isEnabled}
                            onPress={() => setSettings({ ...settings, isInclusive: !settings.isInclusive })}
                            className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex-row items-start gap-4 mt-2"
                        >
                            <View className={`w-6 h-6 rounded-lg border-2 items-center justify-center ${settings.isInclusive ? '' : 'border-zinc-200 bg-white'}`}
                                style={settings.isInclusive ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                            >
                                {settings.isInclusive && <MaterialCommunityIcons name="check" size={16} color="white" />}
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-zinc-900 mb-1">Harga Termasuk Pajak (Inclusive)</Text>
                                <Text className="text-xs text-zinc-500 leading-5">
                                    Aktifkan jika harga produk yang Anda input sudah termasuk pajak. Jika tidak, pajak akan ditambahkan di atas harga jual.
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info Tip */}
                <View className="mt-8 flex-row items-center gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 border-dashed">
                    <MaterialCommunityIcons name="information-outline" size={20} color={primaryColor} />
                    <Text className="text-[10px] font-bold text-zinc-400 leading-4 flex-1">
                        TIP: Pajak yang diatur di sini akan otomatis dihitung dan ditampilkan pada struk transaksi pelanggan.
                    </Text>
                </View>

                <View className="h-20" />
            </ScrollView>

            {/* Save Button */}
            <View className="p-5 bg-white border-t border-zinc-100">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="h-14 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg"
                    style={{
                        backgroundColor: primaryColor,
                        shadowColor: primaryColor,
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 5
                    }}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="content-save-outline" size={22} color="white" />
                            <Text className="text-white font-black text-base">Simpan Pengaturan</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

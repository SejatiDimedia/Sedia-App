import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

interface SettingsScreenProps {
    onBack: () => void;
    onOpenDrawer: () => void;
}

export default function SettingsScreen({ onBack, onOpenDrawer }: SettingsScreenProps) {
    const { currentOutlet, updateOutlet } = useOutletStore();
    const { token } = useAuthStore();
    const [saving, setSaving] = useState(false);

    // Local state for branding
    const [primary, setPrimary] = useState(currentOutlet?.primaryColor || "#0f766e");
    const [secondary, setSecondary] = useState(currentOutlet?.secondaryColor || "#f5c23c");

    const handleSaveBranding = async () => {
        if (!currentOutlet || !token) return;
        setSaving(true);
        try {
            // Use unified updateOutlet which now supports branding colors on the backend
            if (updateOutlet) {
                await updateOutlet(currentOutlet.id, {
                    primaryColor: primary,
                    secondaryColor: secondary
                });
                Alert.alert("Sukses", "Branding outlet berhasil diperbarui! 🎨");
            }
        } catch (error: any) {
            Alert.alert("Gagal", error.message || "Gagal memperbarui branding");
        } finally {
            setSaving(false);
        }
    };

    const primaryColor = currentOutlet?.primaryColor || '#0f766e';

    const presets = [
        { name: "Sedia Classic", primary: "#2e6a69", secondary: "#f2b30c" },
        { name: "Ocean Blue", primary: "#0f172a", secondary: "#38bdf8" },
        { name: "Midnight Purple", primary: "#581c87", secondary: "#d8b4fe" },
        { name: "Forest Green", primary: "#14532d", secondary: "#4ade80" },
        { name: "Crimson Red", primary: "#991b1b", secondary: "#fca5a5" },
        { name: "Charcoal Gold", primary: "#18181b", secondary: "#fbbf24" },
    ];

    const SettingItem = ({ icon, title, subtitle, onPress, color }: any) => (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center p-4 bg-white rounded-3xl border border-zinc-100 mb-3 shadow-sm"
        >
            <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: (color || primaryColor) + '15' }}
            >
                <MaterialCommunityIcons name={icon} size={20} color={color || primaryColor} />
            </View>
            <View className="flex-1">
                <Text className="text-zinc-900 font-bold text-base">{title}</Text>
                <Text className="text-zinc-400 text-xs">{subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#d4d4d8" />
        </TouchableOpacity>
    );

    const LivePreview = () => (
        <View className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm p-4 items-center">
            <View className="absolute top-2 right-2 rounded-full bg-black/80 px-2 py-0.5 z-10">
                <Text className="text-[8px] font-bold text-white">LIVE PREVIEW</Text>
            </View>
            <View className="w-full max-w-[200px] h-[350px] rounded-[2rem] border-4 border-zinc-900 bg-white shadow-lg overflow-hidden relative flex flex-col">
                {/* Notch */}
                <View className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-900 rounded-b-lg z-20"></View>

                {/* Header */}
                <View className="h-10 flex items-center justify-between px-3 pt-2 shadow-sm z-10 bg-white">
                    <View className="w-6 h-6 rounded-lg flex items-center justify-center opacity-90" style={{ backgroundColor: primary }}>
                        <View className="w-3 h-3 bg-white/20 rounded-sm"></View>
                    </View>
                    <Text className="font-bold text-[10px] text-zinc-800">Sedia POS</Text>
                    <View className="w-6 h-6 rounded-full bg-zinc-100"></View>
                </View>

                {/* Simulated Content */}
                <View className="flex-1 p-3">
                    <View className="flex-row items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-100 mb-3">
                        <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: secondary }}>
                            <Text className="text-white font-bold text-[10px]">K</Text>
                        </View>
                        <View className="gap-1">
                            <View className="w-12 h-1.5 bg-zinc-200 rounded-full"></View>
                            <View className="w-8 h-1 bg-zinc-100 rounded-full"></View>
                        </View>
                    </View>

                    <View className="space-y-1.5">
                        {[1, 2, 3].map((i) => (
                            <View key={i} className="h-8 rounded-lg flex-row items-center px-2 gap-2"
                                style={{
                                    backgroundColor: i === 1 ? `${primary}15` : 'transparent',
                                }}
                            >
                                <View className="w-4 h-4 rounded-md" style={{ backgroundColor: i === 1 ? primary : '#e4e4e7' }}></View>
                                <View className="w-16 h-1.5 rounded-full" style={{ backgroundColor: i === 1 ? `${primary}40` : '#f4f4f5' }}></View>
                            </View>
                        ))}
                    </View>

                    <View className="mt-auto mb-2 p-2 rounded-xl border border-dashed flex-row items-center gap-2" style={{ borderColor: secondary }}>
                        <View className="w-6 h-6 rounded-lg items-center justify-center" style={{ backgroundColor: `${secondary}20` }}>
                            <View className="w-3 h-3 rounded-sm" style={{ backgroundColor: secondary }}></View>
                        </View>
                        <View className="w-10 h-1.5 rounded-full bg-zinc-100"></View>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-zinc-50" edges={['top']}>
            {/* Header */}
            <View className="px-5 py-4 flex-row items-center justify-between bg-white border-b border-zinc-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="w-10 h-10 items-center justify-center rounded-xl bg-zinc-50 active:bg-zinc-100">
                        <MaterialCommunityIcons name="arrow-left" size={24} color={primaryColor} />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-lg font-black text-zinc-800">Pengaturan</Text>
                        <Text className="text-xs font-medium text-zinc-400">{currentOutlet?.name}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={onOpenDrawer} className="w-10 h-10 items-center justify-center rounded-xl bg-zinc-50 active:bg-zinc-100">
                    <MaterialCommunityIcons name="menu" size={24} color={primaryColor} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5">
                <Text className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 ml-1">Konfigurasi Outlet</Text>

                {/* Branding Section */}
                <View className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm mb-6">
                    <View className="flex-row items-center gap-3 mb-6">
                        <View className="p-2 bg-yellow-50 rounded-lg">
                            <MaterialCommunityIcons name="palette-outline" size={20} color="#ca8a04" />
                        </View>
                        <Text className="text-zinc-900 font-black">Tampilan & Branding</Text>
                    </View>

                    <View className="mb-6">
                        <Text className="text-[10px] font-bold text-zinc-400 uppercase mb-3 ml-1">Pilih Preset Tema</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {presets.map((preset) => (
                                <TouchableOpacity
                                    key={preset.name}
                                    onPress={() => {
                                        setPrimary(preset.primary);
                                        setSecondary(preset.secondary);
                                    }}
                                    className="w-[31%] aspect-square items-center justify-center p-2 rounded-2xl border bg-white"
                                    style={{
                                        borderColor: (primary === preset.primary && secondary === preset.secondary) ? primaryColor : '#f4f4f5',
                                        borderWidth: (primary === preset.primary && secondary === preset.secondary) ? 2 : 1,
                                    }}
                                >
                                    <View className="flex-row -space-x-2 mb-2">
                                        <View className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.primary }} />
                                        <View className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.secondary }} />
                                    </View>
                                    <Text className="text-[8px] font-bold text-zinc-500 text-center" numberOfLines={1}>{preset.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View className="space-y-4 mb-6">
                        <View>
                            <Text className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5 ml-1">Warna Utama (Primary)</Text>
                            <View className="flex-row items-center gap-3">
                                <View className="h-10 w-10 rounded-xl border border-zinc-100 shadow-sm" style={{ backgroundColor: primary }} />
                                <TextInput
                                    value={primary}
                                    onChangeText={setPrimary}
                                    placeholder="#HEX"
                                    className="flex-1 bg-zinc-50 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 border border-zinc-200"
                                />
                            </View>
                        </View>
                        <View>
                            <Text className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5 ml-1">Warna Aksen (Secondary)</Text>
                            <View className="flex-row items-center gap-3">
                                <View className="h-10 w-10 rounded-xl border border-zinc-100 shadow-sm" style={{ backgroundColor: secondary }} />
                                <TextInput
                                    value={secondary}
                                    onChangeText={setSecondary}
                                    placeholder="#HEX"
                                    className="flex-1 bg-zinc-50 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 border border-zinc-200"
                                />
                            </View>
                        </View>
                    </View>

                    <LivePreview />

                    <TouchableOpacity
                        onPress={handleSaveBranding}
                        disabled={saving}
                        className="h-14 rounded-2xl items-center justify-center mt-6 shadow-lg"
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
                            <View className="flex-row items-center gap-2">
                                <MaterialCommunityIcons name="check-circle-outline" size={20} color="white" />
                                <Text className="text-white font-black text-base">Terapkan Tema</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <Text className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 ml-1">Perangkat & Sistem</Text>

                <SettingItem
                    icon="printer-pos"
                    title="Printer Thermal"
                    subtitle="Atur koneksi printer struk via Bluetooth/Network"
                    onPress={() => Alert.alert("Informasi", "Fitur printer thermal akan segera tersedia di update mendatang.")}
                />

                <SettingItem
                    icon="sync"
                    title="Paksa Sinkronisasi"
                    subtitle="Sinkronisasi ulang data produk dan transaksi"
                    onPress={() => Alert.alert("Sinkronisasi", "Memulai sinkronisasi manual...")}
                />

                <SettingItem
                    icon="information-outline"
                    title="Informasi Aplikasi"
                    subtitle="Versi 1.0.0 (Stable)"
                    onPress={() => { }}
                    color="#71717a"
                />

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}

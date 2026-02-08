import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Save } from "lucide-react-native";
import { theme } from "../config/theme";
import { useOutletStore } from "../store/outletStore";
import { useAuth } from "../hooks/useAuth";
import { API_URL } from "../config/api";

interface SupplierFormScreenProps {
    onBack: () => void;
    supplier?: any; // Passed from parent
}

export default function SupplierFormScreen({ onBack, supplier }: SupplierFormScreenProps) {
    const { token } = useAuth() as any;
    const { currentOutlet } = useOutletStore();

    // Dynamic theme colors from outlet
    const primaryColor = currentOutlet?.primaryColor || theme.colors.primary[600];

    // Form State
    const [name, setName] = useState(supplier?.name || "");
    const [contactPerson, setContactPerson] = useState(supplier?.contactPerson || "");
    const [email, setEmail] = useState(supplier?.email || "");
    const [phone, setPhone] = useState(supplier?.phone || "");
    const [address, setAddress] = useState(supplier?.address || "");
    const [notes, setNotes] = useState(supplier?.notes || "");

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name) {
            Alert.alert("Error", "Nama supplier wajib diisi");
            return;
        }

        setIsSaving(true);
        try {
            const currentOutlet = useOutletStore.getState().currentOutlet;
            if (!currentOutlet) {
                Alert.alert("Error", "No outlet selected");
                setIsSaving(false);
                return;
            }
            const outletId = currentOutlet.id;

            const payload = {
                outletId,
                name,
                contactPerson,
                email,
                phone,
                address,
                notes
            };

            let response;
            if (supplier) {
                response = await fetch(`${API_URL}/suppliers?id=${supplier.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch(`${API_URL}/suppliers`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save supplier');
            }

            onBack();
        } catch (error: any) {
            console.error("Save error:", error);
            Alert.alert("Error", "Gagal menyimpan: " + (error.response?.data?.error || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-zinc-50">
                        <ArrowLeft size={20} color={theme.colors.zinc[900]} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-zinc-900">
                        {supplier ? "Edit Supplier" : "Tambah Supplier"}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg flex-row items-center gap-2"
                    style={{ backgroundColor: primaryColor, opacity: isSaving ? 0.5 : 1 }}
                >
                    {isSaving ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <>
                            <Save size={16} color="white" />
                            <Text className="text-white font-medium text-sm">Simpan</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5">
                <View className="space-y-4 pb-10">
                    <View>
                        <Text className="text-sm font-medium text-zinc-700 mb-1.5">Nama Supplier *</Text>
                        <TextInput
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                            placeholder="Contoh: PT. Sedia Sejahtera"
                            placeholderTextColor={theme.colors.zinc[400]}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-medium text-zinc-700 mb-1.5">Kontak Person</Text>
                        <TextInput
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                            placeholder="Contoh: Budi Santoso"
                            value={contactPerson}
                            onChangeText={setContactPerson}
                        />
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-sm font-medium text-zinc-700 mb-1.5">Telepon</Text>
                            <TextInput
                                className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                                placeholder="0812..."
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm font-medium text-zinc-700 mb-1.5">Email</Text>
                            <TextInput
                                className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900"
                                placeholder="email@contoh.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-sm font-medium text-zinc-700 mb-1.5">Alamat</Text>
                        <TextInput
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900 h-24"
                            placeholder="Alamat lengkap supplier"
                            multiline
                            textAlignVertical="top"
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-medium text-zinc-700 mb-1.5">Catatan Tambahan</Text>
                        <TextInput
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900 h-20"
                            placeholder="Catatan internal..."
                            multiline
                            textAlignVertical="top"
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

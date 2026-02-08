import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Modal, Alert, RefreshControl, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

interface EmployeeManagementScreenProps {
    onBack: () => void;
    onOpenDrawer: () => void;
}

interface Employee {
    id: string;
    name: string;
    role: string;
    roleId?: string | null;
    roleData?: { name: string; permissions: string } | null;
    isActive: boolean;
    pinCode?: string;
    email?: string;
    outletIds: string[];
    primaryOutletId: string | null;
    createdAt?: string;
}

interface Role {
    id: string;
    name: string;
    description?: string;
}

export default function EmployeeManagementScreen({ onBack, onOpenDrawer }: EmployeeManagementScreenProps) {
    const { currentOutlet, outlets, fetchOutlets } = useOutletStore();
    const { token } = useAuthStore();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [formName, setFormName] = useState("");
    const [formRole, setFormRole] = useState("cashier");
    const [formRoleId, setFormRoleId] = useState<string | null>(null);
    const [formPin, setFormPin] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formPassword, setFormPassword] = useState("");
    const [formOutletIds, setFormOutletIds] = useState<string[]>([]);
    const [formPrimaryOutletId, setFormPrimaryOutletId] = useState<string | null>(null);
    const [formIsActive, setFormIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchEmployees = async () => {
        if (!selectedOutletId || !token) return;
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                outletId: selectedOutletId
            });
            const response = await fetch(`${API_URL}/employees?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_URL.replace('/api', ''),
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const fetchRoles = async () => {
        if (!token) return;
        try {
            // Fetch all roles available to the user across all outlets
            const response = await fetch(`${API_URL}/roles`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    useEffect(() => {
        if (currentOutlet && !selectedOutletId) {
            setSelectedOutletId(currentOutlet.id);
        }
    }, [currentOutlet]);

    useEffect(() => {
        if (selectedOutletId) {
            fetchEmployees();
        }
        fetchRoles();
        if (outlets.length === 0 && token) {
            fetchOutlets(token);
        }
    }, [selectedOutletId, token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEmployees();
        fetchRoles();
    };

    const handleOpenModal = (employee?: Employee) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormName(employee.name);
            setFormRole(employee.role);
            setFormRoleId(employee.roleId || null);
            setFormPin(""); // Don't show existing PIN
            setFormEmail(""); // Don't show existing email/password
            setFormPassword("");
            setFormOutletIds(employee.outletIds || []);
            setFormPrimaryOutletId(employee.primaryOutletId);
            setFormIsActive(employee.isActive);
        } else {
            setEditingEmployee(null);
            setFormName("");
            setFormRole("cashier");
            setFormRoleId(null);
            setFormPin("");
            setFormEmail("");
            setFormPassword("");
            setFormOutletIds(currentOutlet ? [currentOutlet.id] : []);
            setFormPrimaryOutletId(currentOutlet?.id || null);
            setFormIsActive(true);
        }
        setModalVisible(true);
    };

    const toggleOutletSelection = (id: string) => {
        setFormOutletIds(prev => {
            if (prev.includes(id)) {
                const next = prev.filter(oid => oid !== id);
                if (formPrimaryOutletId === id) {
                    setFormPrimaryOutletId(next[0] || null);
                }
                return next;
            } else {
                const next = [...prev, id];
                if (!formPrimaryOutletId) {
                    setFormPrimaryOutletId(id);
                }
                return next;
            }
        });
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            Alert.alert("Error", "Nama karyawan harus diisi");
            return;
        }

        if (formOutletIds.length === 0) {
            Alert.alert("Error", "Pilih minimal satu outlet");
            return;
        }

        if (formOutletIds.includes('default-outlet')) {
            Alert.alert("Error", "Outlet tidak valid. Hubungkan ke internet.");
            return;
        }

        if (!editingEmployee && (!formEmail.trim() || !formPassword.trim())) {
            Alert.alert("Error", "Email dan Password wajib untuk karyawan baru");
            return;
        }

        setIsSaving(true);
        try {
            const url = editingEmployee
                ? `${API_URL}/employees/${editingEmployee.id}`
                : `${API_URL}/employees`;

            const method = editingEmployee ? 'PUT' : 'POST';

            const body = {
                name: formName,
                role: formRole,
                roleId: formRoleId,
                pinCode: formPin || null,
                email: formEmail || undefined,
                password: formPassword || undefined,
                outletIds: formOutletIds,
                primaryOutletId: formPrimaryOutletId || formOutletIds[0],
                isActive: formIsActive
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal menyimpan data");
            }

            setModalVisible(false);
            fetchEmployees();
            Alert.alert("Sukses", editingEmployee ? "Data diperbarui" : "Karyawan ditambahkan");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: Employee }) => (
        <TouchableOpacity
            onPress={() => handleOpenModal(item)}
            className="flex-row items-center bg-white p-4 mb-3 rounded-2xl border border-zinc-100 shadow-sm"
        >
            <View
                className="h-12 w-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: (currentOutlet?.primaryColor || '#377f7e') + '15' }}
            >
                <MaterialCommunityIcons name="account" size={26} color={currentOutlet?.primaryColor || '#377f7e'} />
            </View>
            <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-zinc-900 font-bold text-base flex-1 mr-2" numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View className={`${item.isActive ? 'bg-green-100' : 'bg-red-100'} px-2 py-0.5 rounded-md`}>
                        <Text className={`${item.isActive ? 'text-green-700' : 'text-red-700'} text-[10px] font-black uppercase`}>
                            {item.isActive ? 'AKTIF' : 'OFF'}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center flex-wrap gap-y-1">
                    {/* Role Badge */}
                    <View className="bg-zinc-100 px-2 py-0.5 rounded-md flex-row items-center mr-2">
                        <MaterialCommunityIcons name="shield-outline" size={10} color="#71717a" />
                        <Text className="text-zinc-600 text-[10px] font-bold uppercase ml-1">
                            {item.roleData?.name || item.role}
                        </Text>
                    </View>

                    {/* Joined Date */}
                    {item.createdAt && (
                        <View className="flex-row items-center">
                            <Text className="text-zinc-300 text-[10px] mr-2">•</Text>
                            <Text className="text-zinc-400 text-[10px] font-medium uppercase">
                                Gabung {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            <View className="ml-2">
                <MaterialCommunityIcons name="chevron-right" size={20} color="#d4d4d8" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-zinc-50">
            {/* Header */}
            <View className="bg-white px-4 pt-12 pb-4 border-b border-zinc-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={onBack} className="mr-3">
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#18181b" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-xl font-black leading-tight" style={{ color: currentOutlet?.primaryColor || '#134e4a' }}>Manajemen Staf</Text>
                            <Text className="text-zinc-500 text-sm leading-tight">
                                {outlets.find(o => o.id === selectedOutletId)?.name || currentOutlet?.name}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleOpenModal()}
                        className="px-3 py-2 rounded-xl flex-row items-center shadow-sm"
                        style={{ backgroundColor: currentOutlet?.primaryColor || '#377f7e', elevation: 2, shadowColor: currentOutlet?.primaryColor || '#377f7e', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } }}
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white" />
                        <Text className="text-white font-bold ml-1">Tambah</Text>
                    </TouchableOpacity>
                </View>

                {/* Outlet Selector (Horizontal Scroll) */}
                {outlets.length > 1 && (
                    <View className="mb-4">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8 }}
                        >
                            {outlets.map((outlet) => {
                                const isSelected = selectedOutletId === outlet.id;
                                return (
                                    <TouchableOpacity
                                        key={outlet.id}
                                        onPress={() => setSelectedOutletId(outlet.id)}
                                        className={`px-4 py-2 rounded-xl border ${isSelected ? '' : 'bg-white border-zinc-200'}`}
                                        style={isSelected ? { backgroundColor: currentOutlet?.primaryColor || '#377f7e', borderColor: currentOutlet?.primaryColor || '#377f7e' } : {}}
                                    >
                                        <Text className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-600'}`}>
                                            {outlet.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Search */}
                <View className="flex-row items-center bg-zinc-100 px-3 py-2.5 rounded-xl border border-zinc-200">
                    <MaterialCommunityIcons name="magnify" size={20} color="#71717a" />
                    <TextInput
                        className="flex-1 ml-2 text-zinc-900 text-sm h-6"
                        placeholder="Cari nama staf..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#a1a1aa"
                    />
                </View>
            </View>

            <FlatList
                data={filteredEmployees}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <MaterialCommunityIcons name="account-group-outline" size={64} color="#d4d4d8" />
                        <Text className="text-zinc-400 mt-4 text-center">
                            {searchQuery ? "Karyawan tidak ditemukan" : "Belum ada karyawan di outlet ini"}
                        </Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />

            {/* Employee Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-center bg-primary-900/40 px-3"
                >
                    <View className="bg-white rounded-[32px] max-h-[85%] border border-zinc-100 shadow-2xl overflow-hidden">
                        <View className="p-6 border-b border-zinc-100 flex-row items-center justify-between">
                            <Text className="text-xl font-black" style={{ color: currentOutlet?.primaryColor || '#134e4a' }}>
                                {editingEmployee ? 'Edit Staf' : 'Tambah Staf Baru'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2 rounded-full" style={{ backgroundColor: (currentOutlet?.primaryColor || '#377f7e') + '15' }}>
                                <MaterialCommunityIcons name="close" size={20} color={currentOutlet?.primaryColor || '#377f7e'} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-6">
                            <View className="space-y-6 mb-10">
                                {/* Basic Info */}
                                <View>
                                    <Text className="text-sm font-medium text-zinc-700 mb-1.5">Nama Lengkap *</Text>
                                    <View
                                        className="flex-row items-center rounded-xl px-4 h-12"
                                        style={{ backgroundColor: (currentOutlet?.primaryColor || '#377f7e') + '10', borderColor: (currentOutlet?.primaryColor || '#377f7e') + '30', borderWidth: 1 }}
                                    >
                                        <MaterialCommunityIcons name="account-outline" size={20} color={currentOutlet?.primaryColor || '#377f7e'} />
                                        <TextInput
                                            className="flex-1 ml-2 text-zinc-900"
                                            value={formName}
                                            onChangeText={setFormName}
                                            placeholder="Contoh: Ahmad Kasir"
                                            placeholderTextColor="#a1a1aa"
                                        />
                                    </View>
                                </View>

                                {/* Outlets Assignment */}
                                <View>
                                    <Text className="text-sm font-medium text-zinc-700 mb-1.5 font-bold">Assign ke Outlet *</Text>
                                    <View className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 space-y-2">
                                        {outlets.map((outlet) => (
                                            <TouchableOpacity
                                                key={outlet.id}
                                                onPress={() => toggleOutletSelection(outlet.id)}
                                                className={`flex-row items-center p-3 rounded-xl ${formOutletIds.includes(outlet.id) ? '' : 'bg-white border border-zinc-100'}`}
                                                style={formOutletIds.includes(outlet.id) ? { backgroundColor: currentOutlet?.primaryColor || '#377f7e' } : {}}
                                            >
                                                <MaterialCommunityIcons
                                                    name={formOutletIds.includes(outlet.id) ? "checkbox-marked" : "checkbox-blank-outline"}
                                                    size={22}
                                                    color={formOutletIds.includes(outlet.id) ? "white" : "#a1a1aa"}
                                                />
                                                <Text className={`flex-1 ml-3 text-sm font-medium ${formOutletIds.includes(outlet.id) ? 'text-white' : 'text-zinc-700'}`}>
                                                    {outlet.name}
                                                </Text>
                                                {formOutletIds.includes(outlet.id) && formOutletIds.length > 1 && (
                                                    <TouchableOpacity
                                                        onPress={() => setFormPrimaryOutletId(outlet.id)}
                                                        className="px-2 py-1 rounded-lg"
                                                        style={{ backgroundColor: formPrimaryOutletId === outlet.id ? (currentOutlet?.secondaryColor || '#f59e0b') : (currentOutlet?.primaryColor || '#377f7e') }} // Simplified
                                                    >
                                                        <Text className="text-white text-[10px] font-black uppercase">
                                                            {formPrimaryOutletId === outlet.id ? 'UTAMA' : 'SET UTAMA'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Login Access */}
                                <View className="bg-primary-50/50 p-4 rounded-2xl border border-primary-100 space-y-4">
                                    <Text className="text-sm font-black text-primary-900 uppercase tracking-widest mb-2">Akses Login {editingEmployee && "(Opsional)"}</Text>
                                    <View>
                                        <Text className="text-xs text-zinc-500 mb-1">Email</Text>
                                        <View className="flex-row items-center bg-white border border-zinc-200 rounded-xl px-4 h-12">
                                            <MaterialCommunityIcons name="email-outline" size={18} color="#a1a1aa" />
                                            <TextInput
                                                className="flex-1 ml-2 text-zinc-900 text-sm"
                                                value={formEmail}
                                                onChangeText={setFormEmail}
                                                placeholder={editingEmployee ? "Ubah email (biarkan kosong jika tetap)" : "email@karyawan.com"}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </View>
                                    <View>
                                        <Text className="text-xs text-zinc-500 mb-1">Password</Text>
                                        <View className="flex-row items-center bg-white border border-zinc-200 rounded-xl px-4 h-12">
                                            <MaterialCommunityIcons name="lock-outline" size={18} color="#a1a1aa" />
                                            <TextInput
                                                className="flex-1 ml-2 text-zinc-900 text-sm"
                                                value={formPassword}
                                                onChangeText={setFormPassword}
                                                placeholder={editingEmployee ? "Biarkan kosong jika tidak diubah" : "******"}
                                                secureTextEntry={true}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Role Selection */}
                                <View>
                                    <Text className="text-sm font-medium text-zinc-700 mb-1.5">Role / Jabatan</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {roles.length > 0 ? (
                                            roles.map((rd) => (
                                                <TouchableOpacity
                                                    key={rd.id}
                                                    onPress={() => {
                                                        setFormRoleId(rd.id);
                                                        setFormRole(rd.name);
                                                    }}
                                                    className={`px-4 py-2 rounded-xl border ${formRoleId === rd.id ? 'bg-primary-600 border-primary-600' : 'bg-white border-zinc-200'}`}
                                                >
                                                    <Text className={`text-sm font-medium ${formRoleId === rd.id ? 'text-white' : 'text-zinc-600'}`}>
                                                        {rd.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))
                                        ) : (
                                            ['cashier', 'manager'].map((r) => (
                                                <TouchableOpacity
                                                    key={r}
                                                    onPress={() => {
                                                        setFormRole(r);
                                                        setFormRoleId(null);
                                                    }}
                                                    className={`px-4 py-2 rounded-xl border ${formRole === r && !formRoleId ? '' : 'bg-white border-zinc-200'}`}
                                                    style={formRole === r && !formRoleId ? { backgroundColor: currentOutlet?.primaryColor || '#377f7e', borderColor: currentOutlet?.primaryColor || '#377f7e' } : {}}
                                                >
                                                    <Text className={`text-sm font-medium capitalize ${formRole === r && !formRoleId ? 'text-white' : 'text-zinc-600'}`}>
                                                        {r === 'cashier' ? 'Kasir' : 'Manager'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                    <Text className="text-[10px] text-zinc-500 mt-2 italic">* Kelola role custom di web dashboard untul pilihan lebih lengkap</Text>
                                </View>

                                {/* PIN Access */}
                                <View>
                                    <Text className="text-sm font-medium text-zinc-700 mb-1.5">PIN Akses (4-6 Digit)</Text>
                                    <View
                                        className="flex-row items-center border rounded-xl px-4 h-12"
                                        style={{ backgroundColor: (currentOutlet?.primaryColor || '#377f7e') + '10', borderColor: (currentOutlet?.primaryColor || '#377f7e') + '30' }}
                                    >
                                        <MaterialCommunityIcons name="key-outline" size={20} color={currentOutlet?.primaryColor || '#377f7e'} />
                                        <TextInput
                                            className="flex-1 ml-2 text-zinc-900"
                                            value={formPin}
                                            onChangeText={(t) => setFormPin(t.replace(/\\D/g, '').slice(0, 6))}
                                            placeholder={editingEmployee ? "Kosongkan jika tidak diubah" : "1234"}
                                            keyboardType="numeric"
                                            placeholderTextColor="#a1a1aa"
                                            secureTextEntry={true}
                                            maxLength={6}
                                        />
                                    </View>
                                </View>

                                {/* Status Switch */}
                                {editingEmployee && (
                                    <View className="flex-row items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                                        <View>
                                            <Text className="text-sm font-medium text-zinc-900">Status Aktif</Text>
                                            <Text className="text-xs text-zinc-500">Karyawan dapat mengakses POS</Text>
                                        </View>
                                        <Switch
                                            value={formIsActive}
                                            onValueChange={setFormIsActive}
                                            trackColor={{ false: '#d4d4d8', true: currentOutlet?.primaryColor || '#377f7e' }}
                                        />
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        <View className="p-6 border-t border-zinc-100" style={{ backgroundColor: (currentOutlet?.primaryColor || '#377f7e') + '10' }}>
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isSaving}
                                className={`h-14 rounded-2xl items-center justify-center shadow-lg ${isSaving ? 'bg-zinc-400' : ''}`}
                                style={!isSaving ? { backgroundColor: currentOutlet?.primaryColor || '#377f7e', shadowColor: currentOutlet?.primaryColor || '#377f7e', shadowOpacity: 0.3 } : {}}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">
                                        {editingEmployee ? 'Simpan Perubahan' : 'Tambah Karyawan'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

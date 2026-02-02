import '../../global.css';
import React from 'react';
import { Text, View, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

interface RegisterScreenProps {
    onBack: () => void;
    onRegisterSuccess: () => void;
}

export default function RegisterScreen({ onBack, onRegisterSuccess }: RegisterScreenProps) {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const { register, isLoading, error } = useAuthStore();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Mohon isi semua data');
            return;
        }

        try {
            await register(name, email, password);
            // Alert.alert('Sukses', 'Akun berhasil dibuat!');
            onRegisterSuccess();
        } catch (e: any) {
            Alert.alert('Gagal Registrasi', e.message || 'Terjadi kesalahan');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-zinc-50 ">
                <View className="flex-1 px-8 pt-20 pb-8">

                    {/* Header */}
                    <TouchableOpacity onPress={onBack} className="mb-8">
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#3f3f46" />
                    </TouchableOpacity>

                    <View className="mb-8">
                        <Text className="text-3xl font-bold text-zinc-900 ">Buat Akun Baru</Text>
                        <Text className="mt-2 text-zinc-500 ">Bergabung dengan Sedia POS untuk mengelola bisnismu.</Text>
                    </View>

                    {/* Form */}
                    <View className="gap-4">
                        <View>
                            <Text className="mb-2 font-medium text-zinc-700 ">Nama Lengkap</Text>
                            <View className="flex-row items-center rounded-2xl bg-white px-4 py-3 shadow-sm border border-zinc-100  ">
                                <MaterialCommunityIcons name="account-outline" size={20} color="#9ca3af" />
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Masukkan nama lengkap"
                                    className="flex-1 ml-3 text-base text-zinc-900 "
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="mb-2 font-medium text-zinc-700 ">Email</Text>
                            <View className="flex-row items-center rounded-2xl bg-white px-4 py-3 shadow-sm border border-zinc-100  ">
                                <MaterialCommunityIcons name="email-outline" size={20} color="#9ca3af" />
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="contoh@email.com"
                                    className="flex-1 ml-3 text-base text-zinc-900 "
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="mb-2 font-medium text-zinc-700 ">Password</Text>
                            <View className="flex-row items-center rounded-2xl bg-white px-4 py-3 shadow-sm border border-zinc-100  ">
                                <MaterialCommunityIcons name="lock-outline" size={20} color="#9ca3af" />
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Minimal 8 karakter"
                                    className="flex-1 ml-3 text-base text-zinc-900 "
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry
                                />
                            </View>
                        </View>
                    </View>

                    {/* Action Button */}
                    <View className="mt-8">
                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={isLoading}
                            className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 shadow-lg ${isLoading ? 'bg-zinc-300' : 'bg-primary-600 shadow-primary-500/30 active:opacity-90'
                                }`}
                        >
                            {isLoading && <ActivityIndicator color="white" />}
                            <Text className="text-base font-bold text-white">
                                {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
                            </Text>
                            {!isLoading && <MaterialCommunityIcons name="arrow-right" size={20} color="white" />}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View className="mt-8 flex-row justify-center">
                        <Text className="text-zinc-500">Sudah punya akun? </Text>
                        <TouchableOpacity onPress={onBack}>
                            <Text className="font-bold text-primary-600">Masuk disini</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

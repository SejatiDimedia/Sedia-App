import '../../global.css';
import React from 'react';
import { Text, View, TouchableOpacity, Alert, Vibration, ScrollView } from 'react-native';
import { useEmployeeStore } from '../store/employeeStore';
import { useOutletStore } from '../store/outletStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PinEntryScreenProps {
    onPinSuccess: () => void;
    onBack: () => void;
}

export default function PinEntryScreen({ onPinSuccess, onBack }: PinEntryScreenProps) {
    const [pin, setPin] = React.useState('');
    const [errorMessage, setErrorMessage] = React.useState('');
    const { verifyPin, isLoading, error } = useEmployeeStore();
    const { currentOutlet } = useOutletStore();

    const handlePinPress = (digit: string) => {
        if (pin.length < 6) {
            Vibration.vibrate(30);
            setPin(prev => prev + digit);
            setErrorMessage(''); // Clear error when typing
        }
    };

    const handleDelete = () => {
        if (pin.length > 0) {
            Vibration.vibrate(30);
            setPin(prev => prev.slice(0, -1));
        }
    };

    const handleSubmit = async () => {
        if (pin.length < 4) {
            Alert.alert('Error', 'PIN minimal 4 digit');
            return;
        }

        if (!currentOutlet?.id) {
            Alert.alert('Error', 'Outlet tidak dipilih');
            return;
        }

        const success = await verifyPin(currentOutlet.id, pin);
        if (success) {
            setErrorMessage('');
            onPinSuccess();
        } else {
            Vibration.vibrate([0, 100, 50, 100]);
            setPin('');
            setErrorMessage('PIN salah atau karyawan tidak aktif');
        }
    };

    const renderPinDots = () => {
        const dots = [];
        for (let i = 0; i < 6; i++) {
            dots.push(
                <View
                    key={i}
                    className={`h-4 w-4 rounded-full mx-2 ${i < pin.length
                        ? 'bg-secondary-500'
                        : 'bg-zinc-200 '
                        }`}
                />
            );
        }
        return dots;
    };

    const renderKeypad = () => {
        const keys = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'del'],
        ];

        return keys.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-center gap-4 mb-4">
                {row.map((key, keyIndex) => {
                    if (key === '') {
                        return <View key={keyIndex} className="h-18 w-18" />;
                    }

                    if (key === 'del') {
                        return (
                            <TouchableOpacity
                                key={keyIndex}
                                onPress={handleDelete}
                                className="h-18 w-18 items-center justify-center rounded-full bg-zinc-100  active:bg-zinc-200 :bg-zinc-700"
                                style={{ height: 72, width: 72 }}
                            >
                                <MaterialCommunityIcons name="backspace-outline" size={28} color="#71717a" />
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={keyIndex}
                            onPress={() => handlePinPress(key)}
                            className="h-18 w-18 items-center justify-center rounded-full bg-white  border border-zinc-200  active:bg-zinc-100 :bg-zinc-800"
                            style={{ height: 72, width: 72 }}
                        >
                            <Text className="text-2xl font-bold text-zinc-900 ">
                                {key}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        ));
    };

    return (
        <View className="flex-1 bg-zinc-50 ">
            {/* Header */}
            <View className="bg-primary-600 px-4 pb-8 pt-14 shadow-lg">
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity
                        onPress={onBack}
                        className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-white">
                            Masukkan PIN
                        </Text>
                        <Text className="mt-0.5 text-sm text-primary-200">
                            {currentOutlet?.name || 'Outlet'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 32 }}>
                {/* Icon */}
                <View className="mb-6 h-20 w-20 items-center justify-center rounded-3xl bg-primary-100 ">
                    <MaterialCommunityIcons name="lock-outline" size={40} color="#377f7e" />
                </View>

                {/* Instruction */}
                <Text className="mb-2 text-lg font-semibold text-zinc-900 ">
                    Masukkan PIN Karyawan
                </Text>
                <Text className="mb-8 text-center text-sm text-zinc-500">
                    Gunakan PIN 4-6 digit yang terdaftar
                </Text>

                {/* PIN Dots */}
                <View className="mb-4 flex-row">{renderPinDots()}</View>

                {/* Error Message */}
                {errorMessage ? (
                    <View className="mb-6 flex-row items-center gap-2 rounded-xl bg-red-50 px-4 py-3">
                        <MaterialCommunityIcons name="alert-circle" size={18} color="#ef4444" />
                        <Text className="text-sm font-medium text-red-600">{errorMessage}</Text>
                    </View>
                ) : (
                    <View className="mb-6 h-10" />
                )}

                {/* Keypad */}
                <View className="mb-8">{renderKeypad()}</View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={pin.length < 4 || isLoading}
                    className={`w-full max-w-xs flex-row items-center justify-center gap-2 rounded-2xl py-4 ${pin.length >= 4 && !isLoading
                        ? 'bg-secondary-500'
                        : 'bg-zinc-200 '
                        }`}
                >
                    {isLoading ? (
                        <MaterialCommunityIcons name="loading" size={20} color="#18181b" />
                    ) : (
                        <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color={pin.length >= 4 ? '#18181b' : '#a1a1aa'}
                        />
                    )}
                    <Text
                        className={`text-base font-bold ${pin.length >= 4 && !isLoading
                            ? 'text-zinc-900'
                            : 'text-zinc-400'
                            }`}
                    >
                        {isLoading ? 'Memverifikasi...' : 'Masuk'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

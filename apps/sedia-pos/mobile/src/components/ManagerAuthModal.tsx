import React, { useState } from 'react';
import { Modal, Text, View, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEmployeeStore } from '../store/employeeStore';
import { useOutletStore } from '../store/outletStore';

interface ManagerAuthModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    actionDescription: string;
}

export default function ManagerAuthModal({ visible, onClose, onSuccess, actionDescription }: ManagerAuthModalProps) {
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { validatePin } = useEmployeeStore();
    const { currentOutlet } = useOutletStore();

    const handlePinChange = (value: string, index: number) => {
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        // Auto move to next input
        if (value && index < 5) {
            // In a real app we'd use refs to focus next input, 
            // but for simplicity/time constraint in this environment we'll rely on user or single input implementation.
            // Let's actually switch to a single hidden input for simpler UX in this MVP.
        }
    };

    // Easier single input implementation for MVP
    const [pinCode, setPinCode] = useState('');

    const handleSubmit = async () => {
        if (pinCode.length !== 6) {
            setError('PIN harus 6 digit');
            return;
        }

        if (!currentOutlet) {
            setError('Outlet tidak ditemukan');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const employee = await validatePin(currentOutlet.id, pinCode);
            console.log('[ManagerAuthModal] validatePin response:', employee);
            const employeeRole = employee?.role?.toLowerCase() || '';
            console.log('[ManagerAuthModal] Role check:', employeeRole, 'fullRole:', employee?.role);
            const isAuthorized = employeeRole === 'manager' || employeeRole === 'owner' || employeeRole === 'admin' || employeeRole === 'manager/owner';
            console.log('[ManagerAuthModal] isAuthorized:', isAuthorized);

            if (employee && isAuthorized) {
                setPinCode('');
                onSuccess();
            } else if (employee) {
                setError(`Peran ${employee.role} tidak diizinkan.`);
            } else {
                setError('PIN Salah.');
            }
        } catch (err) {
            setError('Gagal memverifikasi PIN.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-center bg-black/50 px-4">
                <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
                    <View className="mb-6 items-center">
                        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-red-50">
                            <MaterialCommunityIcons name="shield-lock" size={32} color="#dc2626" />
                        </View>
                        <Text className="text-xl font-bold text-zinc-900">Otorisasi Manager</Text>
                        <Text className="mt-2 text-center text-sm text-zinc-500">
                            {actionDescription}
                        </Text>
                    </View>

                    <View className="mb-6">
                        <TextInput
                            value={pinCode}
                            onChangeText={(text) => {
                                setError(null);
                                setPinCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                            }}
                            keyboardType="number-pad"
                            secureTextEntry={true} // Hidden logic
                            className="w-full rounded-2xl bg-zinc-50 px-4 py-4 text-center text-2xl font-bold tracking-[8px] text-zinc-900 border border-zinc-200"
                            placeholder="******"
                            autoFocus
                        />
                        {error && (
                            <Text className="mt-2 text-center text-xs font-medium text-red-500">
                                {error}
                            </Text>
                        )}
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={onClose}
                            className="flex-1 items-center justify-center rounded-2xl bg-zinc-100 py-3"
                            disabled={isLoading}
                        >
                            <Text className="font-bold text-zinc-900">Batal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            className="flex-1 items-center justify-center rounded-2xl bg-red-600 py-3 shadow-lg shadow-red-500/20"
                            disabled={isLoading || pinCode.length !== 6}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="font-bold text-white">Approve</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

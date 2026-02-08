import '../../global.css';
import React from 'react';
import { Text, View, TouchableOpacity, Alert, ScrollView, ActivityIndicator, TextInput, Clipboard } from 'react-native';
import { useCartStore } from '../store/cartStore';
import { db } from '../db/client';
import { useSync } from '../hooks/useSync';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useWindowDimensions } from 'react-native';

function formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatPaymentMethodName(method: string): string {
    if (!method) return '';
    if (method.startsWith('midtrans_va_')) {
        return `Transfer ${method.replace('midtrans_va_', '').toUpperCase()} (VA)`;
    }
    if (method === 'midtrans_qris') return 'QRIS';
    return method.charAt(0).toUpperCase() + method.slice(1);
}

type DefaultPaymentMethod = 'cash' | 'qris' | 'transfer';

interface CheckoutScreenProps {
    onBack: () => void;
    onComplete: () => void;
    isSidebar?: boolean;
}

import type { ModalProps } from 'react-native';
import { Modal } from 'react-native';

// Success Modal Component
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import { API_URL } from '../config/api';
import { generateReceiptHtml } from '../utils/receiptGenerator';
import { useOutletStore } from '../store/outletStore';
import { useShiftStore } from '../store/shiftStore';
import { useAuthStore } from '../store/authStore';
import { useLoyaltyStore } from '../store/loyaltyStore';
import { useEmployeeStore } from '../store/employeeStore';

// Success Modal Component
function SuccessModal({ visible, onClose, transaction, isOnline }: {
    visible: boolean;
    onClose: () => void;
    transaction: any;
    isOnline: boolean;
}) {
    const { currentOutlet } = useOutletStore();
    const [isPrinting, setIsPrinting] = React.useState(false);

    const handlePrint = async () => {
        try {
            setIsPrinting(true);
            const html = generateReceiptHtml(transaction, currentOutlet);
            await Print.printAsync({
                html,
            });
        } catch (error) {
            console.error('Print error:', error);
            Alert.alert('Error', 'Gagal mencetak struk');
        } finally {
            setIsPrinting(false);
        }
    };

    const handleShare = async () => {
        try {
            setIsPrinting(true);
            const html = generateReceiptHtml(transaction, currentOutlet);
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: `Struk - ${transaction.invoiceNumber}`
            });
        } catch (error) {
            console.error('Share error:', error);
            Alert.alert('Error', 'Gagal membagikan struk');
        } finally {
            setIsPrinting(false);
        }
    };

    const handleWhatsApp = async () => {
        const baseUrl = API_URL.replace('/api', '');
        const url = `${baseUrl}/receipt/${transaction.invoiceNumber}`;
        const message = `Halo, berikut struk belanja Anda di ${currentOutlet?.name || 'SediaPOS'}: ${url}`;
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

        try {
            const supported = await Linking.canOpenURL(whatsappUrl);
            if (supported) {
                await Linking.openURL(whatsappUrl);
            } else {
                await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
            }
        } catch (error) {
            console.error('WhatsApp error:', error);
            Alert.alert('Error', 'Gagal membuka WhatsApp');
        }
    };

    if (!transaction) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-center bg-black/50 px-4">
                <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl text-center items-center">
                    <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-green-100">
                        <MaterialCommunityIcons name="check-circle" size={48} color="#22c55e" />
                    </View>

                    <Text className="mb-2 text-2xl font-bold text-zinc-900">Pembayaran Berhasil!</Text>
                    <Text className="mb-6 text-center text-zinc-500">
                        Transaksi telah tersimpan.
                    </Text>

                    <View className="mb-6 w-full rounded-2xl bg-zinc-50 p-4">
                        <View className="mb-2 flex-row justify-between">
                            <Text className="text-zinc-500">Total Bayar</Text>
                            <Text className="font-bold text-zinc-900 text-lg">{formatCurrency(transaction.totalAmount)}</Text>
                        </View>
                        {transaction.payments && transaction.payments.length > 1 ? (
                            <View className="mt-2 border-t border-zinc-200 pt-2 space-y-2">
                                <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Rincian Pembayaran</Text>
                                {transaction.payments.map((p: any, i: number) => (
                                    <View key={i} className="flex-row justify-between">
                                        <Text className="text-zinc-500 text-xs">{formatPaymentMethodName(p.paymentMethod)}</Text>
                                        <Text className="font-medium text-zinc-900 text-xs">{formatCurrency(p.amount)}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View className="mb-2 flex-row justify-between">
                                <Text className="text-zinc-500">Metode</Text>
                                <Text className="font-medium text-zinc-900">{formatPaymentMethodName(transaction.paymentMethod)}</Text>
                            </View>
                        )}
                        <View className="flex-row justify-between mt-2 pt-2 border-t border-dashed border-zinc-200">
                            <Text className="text-zinc-500">Status</Text>
                            <View className="flex-row items-center gap-1">
                                <MaterialCommunityIcons
                                    name={isOnline ? "cloud-check" : "cloud-off-outline"}
                                    size={14}
                                    color={isOnline ? "#22c55e" : "#f59e0b"}
                                />
                                <Text className={`font-medium text-xs ${isOnline ? 'text-green-600' : 'text-amber-600'}`}>
                                    {isOnline ? 'Tersinkron' : 'Disimpan Lokal'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="w-full flex-row gap-2 mb-2">
                        <TouchableOpacity
                            onPress={handlePrint}
                            disabled={isPrinting}
                            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 active:bg-zinc-200"
                        >
                            <MaterialCommunityIcons name="printer" size={20} color="#18181b" />
                            <Text className="font-bold text-zinc-900">Cetak</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleShare}
                            disabled={isPrinting}
                            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 active:bg-zinc-200"
                        >
                            <MaterialCommunityIcons name="share-variant" size={20} color="#18181b" />
                            <Text className="font-bold text-zinc-900">Share PDF</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={handleWhatsApp}
                        disabled={isPrinting}
                        className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 mb-4 active:opacity-90"
                    >
                        <MaterialCommunityIcons name="whatsapp" size={20} color="white" />
                        <Text className="font-bold text-white">Share ke WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClose}
                        className="w-full items-center justify-center rounded-2xl py-4 active:opacity-90 shadow-lg"
                        style={{
                            backgroundColor: currentOutlet?.secondaryColor || '#f5c23c',
                            shadowColor: currentOutlet?.secondaryColor || '#f5c23c'
                        }}
                    >
                        <Text className="text-base font-bold text-zinc-900">Kembali ke Menu</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// QRIS Modal Component
// Static configuration moved outside component
const defaultMethods: { key: DefaultPaymentMethod; label: string; icon: string; desc: string }[] = [
    { key: 'cash', label: 'Tunai', icon: 'cash', desc: 'Bayar di kasir' },
    { key: 'qris', label: 'QRIS', icon: 'qrcode-scan', desc: 'Scan QR Code' },
    { key: 'transfer', label: 'Transfer', icon: 'bank', desc: 'Bank Transfer' },
];

function QrisModal({ visible, onClose, qrString, amount, status }: {
    visible: boolean;
    onClose: () => void;
    qrString: string;
    amount: number;
    status: string;
}) {
    const { width } = useWindowDimensions();
    const qrSize = Math.min(width * 0.7, 280);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-center bg-black/50 px-4">
                <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl items-center">
                    <Text className="mb-2 text-xl font-bold text-zinc-900">Scan QRIS</Text>
                    <Text className="mb-6 text-zinc-500">Scan QR Code untuk membayar</Text>

                    <View className="items-center justify-center overflow-hidden rounded-xl border border-zinc-200 p-4 bg-white mb-6">
                        {qrString ? (
                            <QRCode
                                value={qrString}
                                size={qrSize}
                            />
                        ) : (
                            <ActivityIndicator size="large" color="#377f7e" />
                        )}
                    </View>

                    <Text className="mb-2 text-2xl font-bold text-zinc-900">{formatCurrency(amount)}</Text>

                    <View className="flex-row items-center gap-2 mb-6 rounded-full bg-zinc-100 px-3 py-1">
                        {status === 'pending' && <ActivityIndicator size="small" color="#f59e0b" />}
                        <Text className={`font-medium ${status === 'settlement' ? 'text-green-600' : 'text-amber-600'}`}>
                            {status === 'settlement' ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran...'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={onClose}
                        className="w-full items-center justify-center rounded-2xl bg-zinc-200 py-3 active:opacity-90"
                    >
                        <Text className="text-base font-bold text-zinc-700">Batalkan</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// Transfer/VA Modal Component
function TransferModal({ visible, onClose, vaNumber, bankName, amount, status, billerCode, isManual, onConfirm }: {
    visible: boolean;
    onClose: () => void;
    vaNumber: string;
    bankName: string;
    amount: number;
    status: string;
    billerCode?: string;
    isManual?: boolean;
    onConfirm?: () => void;
}) {
    const handleCopy = () => {
        Clipboard.setString(vaNumber);
        Alert.alert('Berhasil', 'Nomor VA disalin!');
    };

    const { currentOutlet } = useOutletStore();

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-center bg-black/50 px-4">
                <View className="w-full max-w-md rounded-[40px] bg-white p-8 shadow-2xl items-center border border-zinc-50">
                    <Text className={`mb-2 text-xl font-bold text-center ${isManual ? 'text-primary-800' : 'text-zinc-900'}`}>
                        {isManual ? `Transfer ${bankName?.toUpperCase()}` : `Virtual Account ${bankName?.toUpperCase()}`}
                    </Text>
                    <Text className="mb-6 text-sm text-zinc-500 text-center">Lakukan transfer ke nomor berikut</Text>

                    <View className="w-full rounded-2xl border border-zinc-200 p-5 bg-white mb-6 shadow-sm">
                        {billerCode ? (
                            // ... Mandiri UI stays same
                            <View className="w-full gap-4">
                                <View>
                                    <Text className="text-xs text-zinc-500 mb-2 uppercase tracking-widest font-bold">Biller Code (Mandiri)</Text>
                                    <View className="flex-row items-center justify-between bg-white p-3 rounded-xl border border-zinc-200">
                                        <Text className="text-xl font-black text-primary-700">{billerCode}</Text>
                                        <TouchableOpacity onPress={() => { Clipboard.setString(billerCode); Alert.alert('Berhasil', 'Biller Code disalin!'); }} className="p-2 bg-primary-50 rounded-lg">
                                            <MaterialCommunityIcons name="content-copy" size={16} color="#377f7e" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View>
                                    <Text className="text-xs text-zinc-500 mb-2 uppercase tracking-widest font-bold">Bill Key / Pay Code</Text>
                                    <View className="flex-row items-center justify-between bg-white p-3 rounded-xl border border-zinc-200">
                                        <Text className="text-xl font-black text-primary-700">{vaNumber}</Text>
                                        <TouchableOpacity onPress={() => { Clipboard.setString(vaNumber); Alert.alert('Berhasil', 'Pay Code disalin!'); }} className="p-2 bg-primary-50 rounded-lg">
                                            <MaterialCommunityIcons name="content-copy" size={16} color="#377f7e" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <>
                                <Text className="text-base text-zinc-500 mb-3">{isManual ? `Rekening ${bankName?.toUpperCase()}` : `Nomor VA ${bankName?.toUpperCase()}`}</Text>
                                <View className="flex-row items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 w-full justify-between">
                                    <Text
                                        className="flex-1 text-xl font-bold font-mono text-center"
                                        style={{ color: currentOutlet?.primaryColor || '#255554' }}
                                        adjustsFontSizeToFit
                                        numberOfLines={1}
                                    >
                                        {vaNumber || '...'}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={handleCopy}
                                        className="p-3 rounded-xl active:opacity-80"
                                        style={{ backgroundColor: (currentOutlet?.primaryColor || '#377f7e') + '20' }}
                                    >
                                        <MaterialCommunityIcons name="content-copy" size={20} color={currentOutlet?.primaryColor || "#377f7e"} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                        <Text className="text-sm text-zinc-400 mt-4 text-center">Status otomatis terupdate setelah pembayaran</Text>
                    </View>

                    <Text className="mb-6 text-3xl font-bold text-primary-800">{formatCurrency(amount)}</Text>

                    <View className="w-full gap-3">
                        {!isManual ? (
                            <View className="flex-row items-center justify-center gap-2 mb-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                                <ActivityIndicator size="small" color="#d97706" />
                                <Text className="text-sm font-medium text-amber-700">Menunggu Pembayaran...</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={onConfirm}
                                className="w-full items-center justify-center rounded-full bg-primary-700 py-3.5 active:opacity-90 shadow-sm shadow-primary-200"
                            >
                                <View className="flex-row items-center gap-2">
                                    <MaterialCommunityIcons name="check" size={18} color="white" />
                                    <Text className="text-base font-bold text-white">Selesaikan Pembayaran</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={onClose}
                            className={`w-full items-center justify-center rounded-full py-3 active:opacity-70 ${isManual ? 'bg-transparent' : 'bg-zinc-100'}`}
                        >
                            <Text className={`text-base font-bold ${isManual ? 'text-zinc-800' : 'text-zinc-600'}`}>
                                {isManual ? 'Batal' : 'Batalkan'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// Error Modal Component  
function ErrorModal({ visible, onClose, message }: {
    visible: boolean;
    onClose: () => void;
    message: string;
}) { // ... existing code ...
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-center bg-black/50 px-4">
                <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl text-center items-center">
                    <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-red-100">
                        <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
                    </View>

                    <Text className="mb-2 text-2xl font-bold text-zinc-900">Transaksi Gagal</Text>
                    <Text className="mb-6 text-center text-zinc-500">
                        {message}
                    </Text>

                    <TouchableOpacity
                        onPress={onClose}
                        className="w-full items-center justify-center rounded-2xl bg-red-500 py-4 active:opacity-90"
                    >
                        <Text className="text-base font-bold text-white">Tutup</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

export default function CheckoutScreen({ onBack, onComplete, isSidebar }: CheckoutScreenProps) {
    console.log('[Checkout] Rendering. isSidebar:', isSidebar);
    const { width } = useWindowDimensions();

    // Payment State
    const [selectedMethodId, setSelectedMethodId] = React.useState<string>('cash');
    const [appliedPayments, setAppliedPayments] = React.useState<any[]>([]);
    const [isSplitMode, setIsSplitMode] = React.useState(false);
    const [selectedManualAccount, setSelectedManualAccount] = React.useState<any>(null);

    // Get Payment Methods from Store
    const customMethods = useOutletStore(state => state.paymentMethods);
    const isFetchingPayments = useOutletStore(state => state.isFetchingPayments);

    // Merge methods
    const paymentMethods = React.useMemo(() => {
        // Map custom methods to uniform UI format
        const custom = customMethods.map(m => ({
            key: m.id,
            label: m.name,
            icon: m.type === 'cash' ? 'cash' : m.type === 'qris' ? 'qrcode-scan' : m.type === 'transfer' ? 'bank' : 'credit-card',
            type: m.type,
            isManual: m.isManual,
            bankAccounts: m.bankAccounts || []
        }));

        if (custom.length > 0) return custom;

        // Fallback to defaults if no custom methods
        return defaultMethods.map(m => ({
            ...m,
            type: m.key,
            isManual: false,
            bankAccounts: []
        }));
    }, [customMethods]);

    // Optimized store selectors
    const items = useCartStore(state => state.items);
    const getTotal = useCartStore(state => state.getTotal);
    const clearCart = useCartStore(state => state.clearCart);
    const customer = useCartStore(state => state.customer);
    const holdOrder = useCartStore(state => state.holdOrder);
    const markHeldOrderCompleted = useCartStore(state => state.markHeldOrderCompleted);
    const resumedOrderId = useCartStore(state => state.resumedOrderId);
    const clearResumedOrder = useCartStore(state => state.clearResumedOrder);

    const { isOnline } = useSync();
    const activeShift = useShiftStore(state => state.activeShift);
    const currentOutlet = useOutletStore(state => state.currentOutlet);
    const taxSettings = useOutletStore(state => state.taxSettings);
    const currentEmployee = useEmployeeStore(state => state.currentEmployee);

    // Polling Ref
    const pollingRef = React.useRef<NodeJS.Timeout | null>(null);

    const checkPaymentStatus = async (orderId: string, chosenMethod: string) => {
        try {
            const response = await fetch(`${API_URL}/payment/midtrans/status/${orderId}`);
            const data = await response.json();

            if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
                setPaymentStatus('settlement');
                if (pollingRef.current) clearInterval(pollingRef.current);
                setShowQris(false);
                setShowTransfer(false);
                saveTransactionWithStatus(orderId, 'paid', chosenMethod);
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        setBillerCode('');
        const currentTotal = getTotal();
        const transactionId = `txn-${Date.now()}`;
        setCurrentTransactionId(transactionId);

        // Get Active Method Object
        const activeMethod = paymentMethods.find(m => m.key === selectedMethodId);
        let activeAmount = currentTotal;

        if (isSplitMode && appliedPayments.length > 0) {
            // Find first potentially integrated payment
            const IntegratedPayment = appliedPayments.find(p =>
                (p.type === 'qris' || p.type === 'transfer') && !p.isManual
            );
            if (IntegratedPayment) {
                // We'll prioritize the integrated payment for modal display
                const methodObj = paymentMethods.find(m => m.key === IntegratedPayment.paymentMethod);
                activeAmount = IntegratedPayment.amount;
                // Continue with electronic flow...
            } else {
                // All manual/cash, complete directly
                await saveTransactionWithStatus(transactionId, 'paid', 'Split');
                setIsProcessing(false);
                return;
            }
        }

        console.log('[Checkout] Confirming Payment:', { selectedMethodId, type: activeMethod?.type, isManual: activeMethod?.isManual });

        // Manual Flow Check
        // If it is 'cash', save immediately.
        // If it is 'manual' explicitly, or it is a 'transfer' but HAS bank accounts, we treat as manual transfer (show modal).
        if (activeMethod?.type === 'cash') {
            await saveTransactionWithStatus(transactionId, 'paid', activeMethod.label);
            setIsProcessing(false);
            return;
        }

        if (activeMethod?.isManual || (activeMethod?.type === 'transfer' && activeMethod?.bankAccounts && activeMethod.bankAccounts.length > 0)) {
            // No setLastInvoice needed for mobile
            setPaymentStatus('pending');

            // Set VA Number to the manual account number for display
            if (activeMethod.type === 'transfer' && activeMethod.bankAccounts?.length > 0) {
                // Use selected manual account if available, or just the first one
                const accountToUse = selectedManualAccount || activeMethod.bankAccounts[0];
                if (accountToUse) {
                    setVaNumber(accountToUse.accountNumber);
                    setSelectedBank(accountToUse.bankName as any); // Type assertion or simple string
                }
            }

            setShowTransfer(true);
            setIsProcessing(false);
            return;
        }

        // Integrated QRIS Flow
        if (activeMethod?.type === 'qris' && isOnline) {
            try {
                const response = await fetch(`${API_URL}/payment/midtrans/charge`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: transactionId,
                        amount: activeAmount,
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed to generate QRIS');

                const qrCode = data.qr_string || (data.actions && data.actions.find((a: any) => a.name === 'generate-qr-code')?.url);

                if (qrCode) {
                    setQrisString(qrCode);
                    setShowQris(true);
                    setPaymentStatus('pending');
                    pollingRef.current = setInterval(() => checkPaymentStatus(transactionId, 'midtrans_qris'), 3000);
                } else {
                    throw new Error('QR Code not found');
                }
                setIsProcessing(false);
                return;
            } catch (error: any) {
                setErrorMessage(error.message || 'Gagal membuat QRIS');
                setShowError(true);
                setIsProcessing(false);
                return;
            }
        }

        // Integrated Transfer/VA Flow (Only if no manual accounts)
        if (activeMethod?.type === 'transfer' && isOnline && !activeMethod.isManual && (!activeMethod.bankAccounts || activeMethod.bankAccounts.length === 0)) {
            try {
                const response = await fetch(`${API_URL}/payment/midtrans/charge`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: transactionId,
                        amount: activeAmount,
                        paymentType: 'bank_transfer',
                        bank: selectedBank
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed to generate VA');

                const va = data.va_numbers?.[0]?.va_number || data.permata_va_number || data.bill_key;
                const bCode = data.biller_code;

                if (va) {
                    setVaNumber(va);
                    setBillerCode(bCode);
                    setShowTransfer(true);
                    setPaymentStatus('pending');
                    pollingRef.current = setInterval(() => checkPaymentStatus(transactionId, `midtrans_va_${selectedBank}`), 3000);
                } else {
                    throw new Error('VA Number not found');
                }
                setIsProcessing(false);
                return;
            } catch (error: any) {
                setErrorMessage(error.message || 'Gagal membuat VA');
                setShowError(true);
                setIsProcessing(false);
                return;
            }
        }

        // Default: Proceed directly (Cash or Offline)
        await saveTransactionWithStatus(transactionId, 'paid', activeMethod?.label || selectedMethodId);
        setIsProcessing(false);
    };

    const handleManualTransferComplete = async () => {
        const activeMethod = paymentMethods.find(m => m.key === selectedMethodId);
        const label = activeMethod?.label || selectedMethodId;
        await saveTransactionWithStatus(currentTransactionId, 'paid', label);
        setShowTransfer(false);
    };

    const saveTransactionWithStatus = async (transactionId: string, pStatus: string, pMethod: string) => {
        setIsProcessing(true);
        const currentTotal = getTotal();

        // Calculate tax for payload
        const { taxSettings } = useOutletStore.getState();
        const taxAmount = useCartStore.getState().getTax();
        const subtotal = useCartStore.getState().getSubtotal();

        const transactionPayload = {
            outletId: currentOutlet?.id || 'default-outlet',
            invoiceNumber: transactionId,
            customerId: customer?.id,
            totalAmount: currentTotal,
            subtotal: subtotal,
            tax: taxAmount,
            taxDetails: taxSettings?.isEnabled ? {
                name: taxSettings.name,
                rate: taxSettings.rate,
                isInclusive: taxSettings.isInclusive
            } : null,
            paymentMethod: appliedPayments.length > 1 ? 'Split' : pMethod,
            paymentStatus: pStatus,
            status: 'completed',
            cashierId: activeShift?.employeeId,
            items: items.map(item => ({
                productId: item.productId,
                variantId: item.variantId || undefined,
                productName: item.variantName ? `${item.name} - ${item.variantName}` : item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
            })),
            payments: appliedPayments.length > 0 ? appliedPayments.map(p => ({
                paymentMethod: p.paymentMethod,
                amount: p.amount
            })) : [{ paymentMethod: pMethod, amount: currentTotal }]
        };

        try {
            if (isOnline) {
                const response = await fetch(`${API_URL}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(transactionPayload),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed');
            } else {
                const transaction = {
                    ...transactionPayload,
                    id: transactionId,
                    syncStatus: 'pending',
                    createdAt: new Date(),
                } as any;
                await db.transactions.insert(transaction);
            }

            if (resumedOrderId) {
                await markHeldOrderCompleted(resumedOrderId);
                clearResumedOrder();
            }

            // Mapped label for receipt display
            const methodLabel = paymentMethods.find(m => m.key === selectedMethodId)?.label || selectedMethodId;
            setCompletedTransaction({
                ...transactionPayload,
                paymentMethod: appliedPayments.length > 1 ? 'Split' : methodLabel,
                payments: appliedPayments.length > 0 ? appliedPayments.map(p => ({
                    paymentMethod: paymentMethods.find(m => m.key === p.paymentMethod)?.label || p.paymentMethod,
                    amount: p.amount
                })) : [{ paymentMethod: methodLabel, amount: currentTotal }],
                createdAt: new Date().toISOString(),
                // Inject names for receipt generator
                cashierName: (activeShift as any)?.employeeName || currentEmployee?.name || useAuthStore.getState().user?.name || 'Kasir',
                customerName: customer?.name || 'Pelanggan Umum',
            });
            setShowSuccess(true);
        } catch (error: any) {
            setErrorMessage(error.message || 'Gagal menyimpan transaksi');
            setShowError(true);
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle modal close
    const handleSuccessClose = () => {
        setShowSuccess(false);
        clearCart();
        // Customer is cleared via clearCart() in store
        onComplete();
    };

    const addPayment = (methodId: string) => {
        const total = getTotal();
        const paid = appliedPayments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = total - paid;

        if (remaining <= 0 && isSplitMode) {
            Alert.alert('Info', 'Tagihan sudah terpenuhi');
            return;
        }

        const methodObj = paymentMethods.find(m => m.key === methodId);
        const newPayment = {
            paymentMethod: methodId,
            amount: remaining > 0 ? remaining : total,
            type: methodObj?.type,
            isManual: methodObj?.isManual,
            // Capture manual account if single, or reset if multiple
            manualAccount: methodObj?.bankAccounts?.length === 1 ? methodObj.bankAccounts[0] : null
        };

        console.log('[Checkout] addPayment details:', newPayment);

        if (isSplitMode) {
            setAppliedPayments(prev => [...prev, newPayment]);
        } else {
            setAppliedPayments([newPayment]);
        }
        setSelectedMethodId(methodId);

        // Auto-select manual account if exactly one
        if (methodObj?.bankAccounts?.length === 1) {
            setSelectedManualAccount(methodObj.bankAccounts[0]);
        } else {
            setSelectedManualAccount(null);
        }
    };

    const removePayment = (index: number) => {
        const newPayments = [...appliedPayments];
        newPayments.splice(index, 1);
        setAppliedPayments(newPayments);
        if (newPayments.length === 0) {
            setSelectedMethodId('cash');
            setSelectedManualAccount(null);
        } else {
            const lastMethodId = newPayments[newPayments.length - 1].paymentMethod;
            setSelectedMethodId(lastMethodId);
            const methodObj = paymentMethods.find(m => m.key === lastMethodId);
            setSelectedManualAccount(newPayments[newPayments.length - 1].manualAccount || (methodObj?.bankAccounts?.length === 1 ? methodObj.bankAccounts[0] : null));
        }
    };

    const getRemainingBalance = () => {
        const paid = appliedPayments.reduce((sum, p) => sum + p.amount, 0);
        return getTotal() - paid;
    };

    const [isProcessing, setIsProcessing] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [showError, setShowError] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [completedTransaction, setCompletedTransaction] = React.useState<any>(null);

    const [showHoldOrderModal, setShowHoldOrderModal] = React.useState(false);
    const [holdOrderNotes, setHoldOrderNotes] = React.useState('');
    const [isProcessingHold, setIsProcessingHold] = React.useState(false);

    const [showQris, setShowQris] = React.useState(false);
    const [qrisString, setQrisString] = React.useState('');
    const [paymentStatus, setPaymentStatus] = React.useState('pending');

    // Transfer/VA State
    const [showTransfer, setShowTransfer] = React.useState(false);
    const [vaNumber, setVaNumber] = React.useState('');
    const [billerCode, setBillerCode] = React.useState('');
    const [selectedBank, setSelectedBank] = React.useState<'bca' | 'bni' | 'bri' | 'mandiri'>('bca');
    const [currentTransactionId, setCurrentTransactionId] = React.useState('');

    return (
        <View className="flex-1 bg-zinc-50 ">
            {showSuccess && (
                <SuccessModal
                    visible={showSuccess}
                    onClose={handleSuccessClose}
                    transaction={completedTransaction}
                    isOnline={isOnline}
                />
            )}
            {showError && (
                <ErrorModal
                    visible={showError}
                    onClose={() => setShowError(false)}
                    message={errorMessage}
                />
            )}
            {showQris && (
                <QrisModal
                    visible={showQris}
                    onClose={() => setShowQris(false)}
                    qrString={qrisString}
                    amount={appliedPayments.find(p => p.paymentMethod === 'qris')?.amount || getTotal()}
                    status={paymentStatus}
                />
            )}
            {showTransfer && (
                <TransferModal
                    visible={showTransfer}
                    onClose={() => setShowTransfer(false)}
                    vaNumber={vaNumber}
                    bankName={selectedBank}
                    billerCode={billerCode}
                    amount={appliedPayments.find(p => p.paymentMethod === 'transfer')?.amount || getTotal()}
                    status={paymentStatus}
                    isManual={(paymentMethods.find(m => m.key === selectedMethodId)?.isManual) || (paymentMethods.find(m => m.key === selectedMethodId)?.bankAccounts?.length > 0)}
                    onConfirm={handleManualTransferComplete}
                />
            )}

            {/* Header */}
            {!isSidebar ? (
                <View className={`flex-row items-center bg-white px-4 pb-4 pt-14 shadow-sm ${width >= 768 ? 'justify-between' : ''}`}>
                    <TouchableOpacity
                        onPress={onBack}
                        className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 active:bg-zinc-200 "
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#18181b" />
                    </TouchableOpacity>
                    <Text className="ml-4 text-xl font-bold text-zinc-900 ">
                        Pembayaran
                    </Text>
                    {/* Sync Status Indicator */}
                    <View className="ml-auto flex-row items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 ">
                        <MaterialCommunityIcons
                            name={isOnline ? "cloud-check" : "cloud-off-outline"}
                            size={14}
                            color={isOnline ? "#22c55e" : "#71717a"}
                        />
                        <Text className="text-xs text-zinc-500">{isOnline ? "Online" : "Offline"}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowHoldOrderModal(true)}
                        className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-amber-50 active:bg-amber-100 "
                    >
                        <MaterialCommunityIcons name="pause-circle" size={24} color="#f59e0b" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View className="flex-row items-center justify-between bg-white px-4 py-4 border-b border-zinc-100">
                    <Text className="text-lg font-black text-zinc-900">Pembayaran</Text>
                    <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center gap-1 rounded-full bg-zinc-50 px-2.5 py-1 border border-zinc-100">
                            <MaterialCommunityIcons
                                name={isOnline ? "cloud-check" : "cloud-off-outline"}
                                size={12}
                                color={isOnline ? "#22c55e" : "#f59e0b"}
                            />
                            <Text className={`text-[10px] font-bold ${isOnline ? 'text-green-600' : 'text-amber-600'}`}>
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onBack}
                            className="h-8 w-8 items-center justify-center rounded-full bg-zinc-100"
                        >
                            <MaterialCommunityIcons name="close" size={20} color="#71717a" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}


            <ScrollView
                className="flex-1 bg-white"
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View className={`${width >= 768 && !isSidebar ? 'flex-row-reverse' : 'flex-col'}`}>
                    {/* Order Summary Section */}
                    <View className={`${width >= 768 && !isSidebar ? 'w-[450px] border-l border-zinc-100 bg-[#fdfdfd] p-6' : 'p-6 bg-zinc-50'}`}>
                        <Text className="text-[10px] font-black uppercase tracking-[2px] text-zinc-400 mb-4">Ringkasan Pesanan</Text>

                        <View className={`mb-6 rounded-[32px] bg-white p-6 ${isSidebar ? '' : 'shadow-xl shadow-zinc-200/50'} border border-zinc-100`}>
                            <View className="mb-6 flex-row items-center gap-3 border-b border-zinc-50 pb-5">
                                <View className="bg-primary-50 p-2.5 rounded-2xl" style={{ backgroundColor: (currentOutlet?.primaryColor || '#377f7e') + '15' }}>
                                    <MaterialCommunityIcons name="receipt-text-outline" size={24} color={currentOutlet?.primaryColor || '#377f7e'} />
                                </View>
                                <View>
                                    <Text className="text-xl font-black text-zinc-900 tracking-tight">Detail Pesanan</Text>
                                    <Text className="text-xs text-zinc-400 font-bold uppercase">{items.length} Items</Text>
                                </View>
                            </View>

                            <View className="gap-5">
                                {items.map((item) => (
                                    <View key={item.id} className="flex-row justify-between items-center">
                                        <View className="flex-1 mr-4">
                                            <Text className="text-base font-extrabold text-zinc-800 leading-5">{item.name}</Text>
                                            <Text className="text-xs text-zinc-400 font-bold mt-1">
                                                {item.quantity} units <Text className="text-zinc-300">•</Text> {formatCurrency(item.price)}
                                            </Text>
                                        </View>
                                        <Text className="text-base font-black text-zinc-900">
                                            {formatCurrency(item.price * item.quantity)}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <View className="mt-8 pt-6 border-t border-zinc-50">
                                <View className="flex-row justify-between items-end">
                                    <View>
                                        <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total yang harus dibayar</Text>
                                        <Text className="text-3xl font-black text-primary-600 tracking-tighter" style={{ color: currentOutlet?.primaryColor || '#0f766e' }}>
                                            {formatCurrency(getTotal())}
                                        </Text>
                                    </View>
                                    <View className="bg-primary-50 px-4 py-2 rounded-2xl">
                                        <Text className="text-xs font-black text-primary-700">PAID AT END</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Payment Methods Section */}
                    <View className={`${width >= 768 && !isSidebar ? 'flex-1' : 'w-full'} p-6 bg-white`}>
                        <View className="mb-8 flex-row items-center justify-between">
                            <View className="flex-1 mr-2">
                                <Text
                                    className="text-2xl font-black text-zinc-900 tracking-tight"
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    Metode Pembayaran
                                </Text>
                                <Text className="text-zinc-400 text-xs font-bold mt-0.5" numberOfLines={1}>Pilih cara pembayaran yang nyaman</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsSplitMode(!isSplitMode);
                                    if (!isSplitMode && appliedPayments.length === 0) {
                                        addPayment('cash');
                                    }
                                }}
                                className={`rounded-2xl px-5 py-3 border ${isSplitMode ? 'bg-secondary-500 border-secondary-600' : 'bg-secondary-50 border-secondary-100 shadow-sm'}`}
                            >
                                <View className="flex-row items-center gap-2">
                                    <MaterialCommunityIcons
                                        name={isSplitMode ? "call-split" : "plus-circle-outline"}
                                        size={18}
                                        color={isSplitMode ? "#302302" : "#377f7e"}
                                    />
                                    <Text className={`text-sm font-black ${isSplitMode ? 'text-secondary-950' : 'text-primary-700'}`}>
                                        {isSplitMode ? 'Split Aktif' : 'Split Bill'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {appliedPayments.length > 0 && (
                            <View className="mb-8 gap-4">
                                <Text className="text-[10px] font-black uppercase tracking-[2px] text-zinc-400 ml-1">Pembayaran yang Diterapkan</Text>
                                {appliedPayments.map((p, idx) => (
                                    <View key={idx} className="overflow-hidden rounded-[32px] bg-zinc-50 p-6 border border-zinc-100">
                                        <View className="flex-row items-center justify-between mb-4">
                                            <View className="flex-row items-center gap-3">
                                                <View className="h-4 w-4 rounded-full bg-secondary-500" />
                                                <Text className="text-sm font-black uppercase tracking-widest text-zinc-800">
                                                    {paymentMethods.find(m => m.key === p.paymentMethod)?.label || p.paymentMethod}
                                                </Text>
                                            </View>
                                            {isSplitMode && (
                                                <TouchableOpacity
                                                    onPress={() => removePayment(idx)}
                                                    className="h-10 w-10 items-center justify-center rounded-2xl bg-white border border-red-50"
                                                >
                                                    <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <View className="flex-row items-center gap-3">
                                            <View className="flex-1 flex-row items-center rounded-2xl bg-white px-5 py-4 border border-zinc-100">
                                                <Text className="text-lg font-black text-zinc-300 mr-3">Rp</Text>
                                                {isSplitMode ? (
                                                    <TextInput
                                                        className="flex-1 text-2xl font-black text-zinc-900 p-0"
                                                        keyboardType="numeric"
                                                        value={p.amount.toString()}
                                                        onChangeText={(text) => {
                                                            const raw = text.replace(/\D/g, "");
                                                            const val = parseInt(raw) || 0;
                                                            const news = [...appliedPayments];
                                                            news[idx].amount = val;
                                                            setAppliedPayments(news);
                                                        }}
                                                    />
                                                ) : (
                                                    <Text className="flex-1 text-2xl font-black text-zinc-900 leading-tight">
                                                        {p.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                                                    </Text>
                                                )}
                                            </View>
                                            {p.manualAccount && (
                                                <View className="mt-4 rounded-xl bg-primary-50/50 p-4 border border-primary-100/50">
                                                    <Text className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-1">Tujuan Transfer</Text>
                                                    <Text className="text-sm font-bold text-primary-700">{p.manualAccount.bankName} - {p.manualAccount.accountNumber}</Text>
                                                    <Text className="text-xs text-primary-600/70">{p.manualAccount.accountHolder}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}
                                {isSplitMode && (
                                    <View className={`rounded-[32px] p-6 items-center border-2 border-dashed ${getRemainingBalance() === 0
                                        ? 'bg-green-50/50 border-green-200'
                                        : getRemainingBalance() > 0
                                            ? 'bg-primary-50/50 border-primary-200'
                                            : 'bg-red-50/50 border-red-200'}`}>
                                        <Text className={`text-[10px] font-black uppercase tracking-widest mb-2 ${getRemainingBalance() === 0 ? 'text-green-600' : getRemainingBalance() > 0 ? 'text-primary-600' : 'text-red-600'}`}>
                                            {getRemainingBalance() === 0 ? 'Tagihan Telah Sesuai' : getRemainingBalance() > 0 ? 'Kekurangan Pembayaran' : 'Kelebihan Pembayaran'}
                                        </Text>
                                        <Text className={`text-3xl font-black ${getRemainingBalance() === 0 ? 'text-green-700' : getRemainingBalance() > 0 ? 'text-primary-800' : 'text-red-700'}`}>
                                            {formatCurrency(Math.abs(getRemainingBalance()))}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <View className="gap-4 mb-32">
                            <Text className="text-[10px] font-black uppercase tracking-[2px] text-zinc-400 ml-1">Semua Metode</Text>
                            <View className="flex-row flex-wrap justify-between">
                                {isFetchingPayments ? (
                                    <View className="w-full items-center py-4">
                                        <ActivityIndicator color={currentOutlet?.primaryColor || '#0f766e'} />
                                    </View>
                                ) : paymentMethods.map((method) => {
                                    const isActive = (isSplitMode ? appliedPayments.some(p => p.paymentMethod === method.key) : selectedMethodId === method.key);
                                    return (
                                        <TouchableOpacity
                                            key={method.key}
                                            onPress={() => {
                                                console.log('[Checkout] Method pressed:', method.key);
                                                addPayment(method.key);
                                            }}
                                            className={`w-[31.5%] mb-4 items-center rounded-[32px] border-2 p-5 ${isActive
                                                ? 'border-primary-600 bg-primary-50'
                                                : 'border-zinc-50 bg-[#fafafa]'
                                                }`}
                                            style={isActive ? {
                                                borderColor: currentOutlet?.primaryColor || '#0f766e',
                                                backgroundColor: (currentOutlet?.primaryColor || '#0f766e') + '15'
                                            } : {}}
                                        >
                                            <View
                                                className={`mb-3 h-14 w-14 items-center justify-center rounded-[20px] ${isActive ? 'bg-primary-600' : 'bg-white border border-zinc-100'}`}
                                                style={isActive ? { backgroundColor: currentOutlet?.primaryColor || '#0f766e' } : {}}
                                            >
                                                <MaterialCommunityIcons
                                                    name={method.icon as any}
                                                    size={28}
                                                    color={isActive ? 'white' : '#71717a'}
                                                />
                                            </View>
                                            <Text
                                                className={`text-sm font-black text-center ${isActive ? 'text-primary-700' : 'text-zinc-500'}`}
                                                style={isActive ? { color: currentOutlet?.primaryColor || '#0f766e' } : {}}
                                            >
                                                {(method.type === 'transfer' && !method.isManual && (!method.bankAccounts || method.bankAccounts.length === 0) && isActive) ? `VA ${selectedBank.toUpperCase()}` : method.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Bank Selection for Transfer (Stable Grid) */}
                            {(() => {
                                const methodObj = paymentMethods.find(m => m.key === selectedMethodId);
                                if (!methodObj || methodObj.type !== 'transfer') return null;

                                // Manual Bank Account selection (Prioritize if accounts exist)
                                if (methodObj.bankAccounts?.length > 0) {
                                    return (
                                        <View className="mt-8 p-6 rounded-[32px] bg-zinc-50 border border-zinc-100">
                                            <View className="mb-4">
                                                <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pilih Rekening Tujuan</Text>
                                            </View>
                                            <View className="gap-3">
                                                {methodObj.bankAccounts.map((acc: any, i: number) => {
                                                    const isSel = selectedManualAccount?.accountNumber === acc.accountNumber;
                                                    return (
                                                        <TouchableOpacity
                                                            key={i}
                                                            onPress={() => {
                                                                setSelectedManualAccount(acc);
                                                                // Update applied payments
                                                                if (isSplitMode) {
                                                                    const news = [...appliedPayments];
                                                                    const idx = news.findLastIndex(p => p.paymentMethod === selectedMethodId);
                                                                    if (idx !== -1) {
                                                                        news[idx].manualAccount = acc;
                                                                        setAppliedPayments(news);
                                                                    }
                                                                } else {
                                                                    const news = [...appliedPayments];
                                                                    if (news.length > 0) {
                                                                        news[0].manualAccount = acc;
                                                                        setAppliedPayments(news);
                                                                    }
                                                                }
                                                            }}
                                                            className={`rounded-2xl bg-white p-5 border-2 ${isSel ? 'border-primary-500 bg-primary-50/20' : 'border-zinc-100'}`}
                                                        >
                                                            <View className="flex-row items-center justify-between">
                                                                <View>
                                                                    <Text className="text-sm font-black text-zinc-800 uppercase tracking-tight">{acc.bankName}</Text>
                                                                    <Text className="text-xl font-black text-zinc-950 mt-1">{acc.accountNumber}</Text>
                                                                    <Text className="text-xs text-zinc-500 font-bold mt-1 opacity-60">{acc.accountHolder}</Text>
                                                                </View>
                                                                {isSel && (
                                                                    <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-600">
                                                                        <MaterialCommunityIcons name="check" size={18} color="white" />
                                                                    </View>
                                                                )}
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    );
                                }

                                // Integrated VA selection (Default for non-manual if no accounts)
                                if (!methodObj.isManual) {
                                    return (
                                        <View className="mt-8 p-6 rounded-[32px] bg-zinc-50 border border-zinc-100">
                                            <View className="mb-4">
                                                <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pilih Bank VA</Text>
                                            </View>
                                            <View className="flex-row flex-wrap">
                                                {(['bca', 'bni', 'bri', 'mandiri'] as const).map((bank) => (
                                                    <TouchableOpacity
                                                        key={bank}
                                                        onPress={() => {
                                                            console.log('[Checkout] VA Bank selected:', bank);
                                                            setSelectedBank(bank);
                                                        }}
                                                        className={`w-[48%] m-[1%] items-center justify-center rounded-2xl py-5 border-2 ${selectedBank === bank
                                                            ? 'border-secondary-500 bg-white'
                                                            : 'border-zinc-200 bg-white'
                                                            }`}
                                                    >
                                                        <Text className={`text-base font-black uppercase ${selectedBank === bank ? 'text-secondary-700' : 'text-zinc-400'}`}>
                                                            {bank}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                }

                                return null;
                            })()}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Final Actions */}
            <View className="bg-white px-8 py-8 border-t border-zinc-100 shadow-2xl">
                <TouchableOpacity
                    onPress={handleConfirmPayment}
                    disabled={isProcessing || (getRemainingBalance() > 0 && isSplitMode)}
                    className={`h-20 w-full flex-row items-center justify-center gap-4 rounded-[32px] shadow-xl ${isProcessing || (getRemainingBalance() > 0 && isSplitMode) ? 'bg-zinc-100' : 'bg-primary-600 active:scale-[0.98]'}`}
                    style={!(isProcessing || (getRemainingBalance() > 0 && isSplitMode)) ? {
                        backgroundColor: currentOutlet?.primaryColor || '#0f766e',
                        shadowColor: currentOutlet?.primaryColor || '#0f766e'
                    } : {}}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check-decagram" size={28} color="white" />
                            <Text className="text-xl font-black text-white">
                                {isSplitMode ? 'Selesaikan Split' : (() => {
                                    const method = paymentMethods.find(m => m.key === selectedMethodId);
                                    if (method?.type === 'transfer' && !method.isManual && (!method.bankAccounts || method.bankAccounts.length === 0)) {
                                        return `Konfirmasi VA ${selectedBank.toUpperCase()}`;
                                    }
                                    if (method?.type === 'transfer' && method.bankAccounts?.length > 0) {
                                        return `Konfirmasi Transfer ${selectedManualAccount?.bankName || ''}`;
                                    }
                                    return `Konfirmasi ${method?.label || ''}`;
                                })()}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Hold Order Modal */}
            < Modal
                visible={showHoldOrderModal}
                transparent
                animationType="slide"
            >
                <View className="flex-1 items-center justify-center bg-black/60 px-4">
                    <View className="w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-2xl">
                        <View
                            className="bg-primary-600 p-8 flex-row justify-between items-center"
                            style={{ backgroundColor: currentOutlet?.primaryColor || '#0f766e' }}
                        >
                            <View className="flex-1">
                                <Text className="text-2xl font-black text-white">Tahan Pesanan</Text>
                                <Text className="text-primary-100 text-sm font-semibold opacity-90 mt-1">Simpan untuk dilanjutkan nanti</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowHoldOrderModal(false)}
                                className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center"
                            >
                                <MaterialCommunityIcons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-8 max-h-[600px]">
                            {/* Order Summary Card */}
                            <View className="bg-primary-50 rounded-[32px] p-6 mb-6 border border-primary-100">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-[10px] text-primary-400 uppercase tracking-widest font-black">Total Tagihan</Text>
                                        <Text className="text-3xl font-black text-primary-700">
                                            {formatCurrency(getTotal())}
                                        </Text>
                                    </View>
                                    <View className="bg-primary-600 px-4 py-2 rounded-2xl shadow-sm">
                                        <Text className="text-sm font-black text-white">{items.length} Items</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Notes Input */}
                            <View className="mb-8">
                                <Text className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-3 ml-1">Catatan Pesanan</Text>
                                <TextInput
                                    value={holdOrderNotes}
                                    onChangeText={setHoldOrderNotes}
                                    placeholder="Contoh: Nama pelanggan, nomor meja..."
                                    multiline
                                    numberOfLines={4}
                                    className="bg-zinc-50 border border-zinc-100 rounded-[28px] px-6 py-5 text-zinc-900 text-base font-semibold"
                                    style={{ textAlignVertical: 'top', minHeight: 120 }}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={async () => {
                                    if (!currentOutlet?.id) return;
                                    setIsProcessingHold(true);
                                    const success = await holdOrder(currentOutlet.id, holdOrderNotes);
                                    setIsProcessingHold(false);
                                    if (success) {
                                        setShowHoldOrderModal(false);
                                        onBack(); // Go back to POS after holding
                                        Alert.alert('Berhasil', 'Pesanan ditahan.');
                                    } else {
                                        Alert.alert('Gagal', 'Gagal menahan pesanan.');
                                    }
                                }}
                                disabled={isProcessingHold}
                                className="w-full bg-secondary-500 py-6 rounded-[32px] flex-row items-center justify-center gap-3 active:bg-secondary-600 shadow-xl shadow-secondary-500/20"
                                style={{
                                    backgroundColor: currentOutlet?.secondaryColor || '#f59e0b',
                                    shadowColor: currentOutlet?.secondaryColor || '#f59e0b'
                                }}
                            >
                                {isProcessingHold ? (
                                    <ActivityIndicator size="small" color="#302302" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="pause-circle" size={28} color="#302302" />
                                        <Text className="text-secondary-950 text-xl font-black">Tahan Pesanan</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowHoldOrderModal(false)}
                                className="w-full mt-4 py-4 items-center"
                            >
                                <Text className="text-zinc-400 font-bold uppercase tracking-widest">Kembali</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal >
        </View >
    );
}

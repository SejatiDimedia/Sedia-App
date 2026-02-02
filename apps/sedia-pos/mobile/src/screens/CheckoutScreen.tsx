import '../../global.css';
import React from 'react';
import { Text, View, TouchableOpacity, Alert, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useCartStore } from '../store/cartStore';
import { db } from '../db/client';
import { useSync } from '../hooks/useSync';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useWindowDimensions } from 'react-native';

function formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

type PaymentMethod = 'cash' | 'qris' | 'transfer';

interface CheckoutScreenProps {
    onBack: () => void;
    onComplete: () => void;
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
                                        <Text className="text-zinc-500 capitalize text-xs">{p.paymentMethod}</Text>
                                        <Text className="font-medium text-zinc-900 text-xs">{formatCurrency(p.amount)}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View className="mb-2 flex-row justify-between">
                                <Text className="text-zinc-500">Metode</Text>
                                <Text className="font-medium text-zinc-900 capitalize">{transaction.paymentMethod}</Text>
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
                        className="w-full items-center justify-center rounded-2xl bg-secondary-500 py-4 active:opacity-90 shadow-lg shadow-secondary-500/20"
                    >
                        <Text className="text-base font-bold text-zinc-900">Kembali ke Menu</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// QRIS Modal Component
function QrisModal({ visible, onClose, qrString, amount, status }: {
    visible: boolean;
    onClose: () => void;
    qrString: string;
    amount: number;
    status: string;
}) {
    const { width } = useWindowDimensions();
    const qrSize = width * 0.7;

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
function TransferModal({ visible, onClose, vaNumber, bankName, amount, status }: {
    visible: boolean;
    onClose: () => void;
    vaNumber: string;
    bankName: string;
    amount: number;
    status: string;
}) {
    const handleCopy = async () => {
        try {
            // Use Clipboard from react-native
            const { Clipboard } = await import('react-native');
            Clipboard.setString(vaNumber);
            Alert.alert('Berhasil', 'Nomor VA disalin!');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-center bg-black/50 px-3">
                <View className="w-full rounded-3xl bg-white p-8 shadow-xl items-center">
                    <Text className="mb-2 text-2xl font-bold text-zinc-900">Virtual Account {bankName?.toUpperCase()}</Text>
                    <Text className="mb-8 text-base text-zinc-500">Lakukan transfer ke nomor berikut</Text>

                    <View className="w-full items-center justify-center rounded-2xl border border-zinc-200 p-6 bg-zinc-50 mb-6">
                        <Text className="text-base text-zinc-500 mb-3">Nomor VA {bankName?.toUpperCase()}</Text>
                        <View className="flex-row items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 w-full justify-between">
                            <Text
                                className="flex-1 text-xl font-bold text-primary-700 font-mono text-center"
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {vaNumber || '...'}
                            </Text>
                            <TouchableOpacity onPress={handleCopy} className="p-3 rounded-xl bg-primary-100 active:bg-primary-200">
                                <MaterialCommunityIcons name="content-copy" size={20} color="#377f7e" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-sm text-zinc-400 mt-4 text-center">Status otomatis terupdate setelah pembayaran</Text>
                    </View>

                    <Text className="mb-3 text-3xl font-bold text-zinc-900">{formatCurrency(amount)}</Text>

                    <View className="flex-row items-center gap-2 mb-8 rounded-full bg-zinc-100 px-4 py-2">
                        {status === 'pending' && <ActivityIndicator size="small" color="#f59e0b" />}
                        <Text className={`text-base font-medium ${status === 'settlement' ? 'text-green-600' : 'text-amber-600'}`}>
                            {status === 'settlement' ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran...'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={onClose}
                        className="w-full items-center justify-center rounded-2xl bg-zinc-200 py-4 active:opacity-90"
                    >
                        <Text className="text-lg font-bold text-zinc-700">Batalkan</Text>
                    </TouchableOpacity>
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

export default function CheckoutScreen({ onBack, onComplete }: CheckoutScreenProps) {
    const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('cash');
    const [appliedPayments, setAppliedPayments] = React.useState<any[]>([]);
    const [isSplitMode, setIsSplitMode] = React.useState(false);

    const addPayment = (method: PaymentMethod) => {
        const total = getTotal();
        const paid = appliedPayments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = total - paid;

        if (remaining <= 0 && isSplitMode) {
            Alert.alert('Info', 'Tagihan sudah terpenuhi');
            return;
        }

        const newPayment = {
            paymentMethod: method,
            amount: remaining > 0 ? remaining : total,
        };

        if (isSplitMode) {
            setAppliedPayments([...appliedPayments, newPayment]);
        } else {
            setAppliedPayments([newPayment]);
        }
        setPaymentMethod(method);
    };

    const removePayment = (index: number) => {
        const newPayments = [...appliedPayments];
        newPayments.splice(index, 1);
        setAppliedPayments(newPayments);
        if (newPayments.length === 0) {
            setPaymentMethod('cash');
        } else {
            setPaymentMethod(newPayments[newPayments.length - 1].paymentMethod);
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
    const { items, getTotal, clearCart, customer, holdOrder, markHeldOrderCompleted, resumedOrderId, clearResumedOrder } = useCartStore();
    const { isOnline } = useSync();
    const { activeShift } = useShiftStore();

    const [showHoldOrderModal, setShowHoldOrderModal] = React.useState(false);
    const [holdOrderNotes, setHoldOrderNotes] = React.useState('');
    const [isProcessingHold, setIsProcessingHold] = React.useState(false);

    const [showQris, setShowQris] = React.useState(false);
    const [qrisString, setQrisString] = React.useState('');
    const [paymentStatus, setPaymentStatus] = React.useState('pending');

    // Transfer/VA State
    const [showTransfer, setShowTransfer] = React.useState(false);
    const [vaNumber, setVaNumber] = React.useState('');
    const [selectedBank, setSelectedBank] = React.useState<'bca' | 'bni' | 'bri' | 'mandiri'>('bca');

    const { currentOutlet } = useOutletStore();

    // Polling Ref
    const pollingRef = React.useRef<NodeJS.Timeout | null>(null);

    const checkPaymentStatus = async (orderId: string) => {
        try {
            const { API_URL } = await import('../config/api');
            const response = await fetch(`${API_URL}/payment/midtrans/status/${orderId}`);
            const data = await response.json();

            if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
                setPaymentStatus('settlement');
                if (pollingRef.current) clearInterval(pollingRef.current);
                setShowQris(false);
                setShowTransfer(false);
                const pMethod = showQris ? 'midtrans_qris' : `midtrans_va_${selectedBank}`;
                saveTransactionWithStatus(orderId, 'paid', pMethod);
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        const currentTotal = getTotal();
        const transactionId = `txn-${Date.now()}`;

        // Determain active payment method and amount
        let activePaymentMethod = paymentMethod;
        let activeAmount = currentTotal;

        if (isSplitMode && appliedPayments.length > 0) {
            // In split mode, check if there's any pending electronic payment
            // We prioritize QRIS or Transfer to show their modal
            const electronicPayment = appliedPayments.find(p => p.paymentMethod === 'qris' || p.paymentMethod === 'transfer');

            if (electronicPayment) {
                activePaymentMethod = electronicPayment.paymentMethod as PaymentMethod;
                activeAmount = electronicPayment.amount;
            } else {
                // All cash or others, just take the first one or default
                activePaymentMethod = 'cash'; // Default to cash if only cash split
            }
        } else {
            // Non-split mode, use selected method and full total
            activeAmount = currentTotal;
        }

        // QRIS Flow
        if (activePaymentMethod === 'qris' && isOnline) {
            try {
                const { API_URL } = await import('../config/api');
                // Call Charge API
                const response = await fetch(`${API_URL}/payment/midtrans/charge`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: transactionId,
                        amount: activeAmount,
                        // paymentType defaults to 'qris' on backend
                    })
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.error || 'Failed to generate QRIS');

                // Get QR String
                const qrCode = data.qr_string || (data.actions && data.actions.find((a: any) => a.name === 'generate-qr-code')?.url);

                if (qrCode) {
                    setQrisString(qrCode);
                    setShowQris(true);
                    setPaymentStatus('pending');

                    // Start Polling
                    pollingRef.current = setInterval(() => {
                        checkPaymentStatus(transactionId);
                    }, 3000);
                } else {
                    throw new Error('QR Code not found in response');
                }

                setIsProcessing(false);
                return; // Stop here, wait for payment
            } catch (error: any) {
                console.error(error);
                Alert.alert('Error', error.message || 'Unknown Error'); // Debug
                setErrorMessage(error.message || 'Gagal membuat transaksi QRIS');
                setShowError(true);
                setIsProcessing(false);
                return;
            }
        }

        // Transfer/VA Flow
        if (activePaymentMethod === 'transfer' && isOnline) {
            try {
                const { API_URL } = await import('../config/api');
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

                const va = data.va_numbers?.[0]?.va_number || data.permata_va_number;

                if (va) {
                    setVaNumber(va);
                    setShowTransfer(true);
                    setPaymentStatus('pending');

                    // Start Polling
                    pollingRef.current = setInterval(() => {
                        checkPaymentStatus(transactionId);
                    }, 3000);
                } else {
                    throw new Error('VA Number not found');
                }

                setIsProcessing(false);
                return;
            } catch (error: any) {
                console.error(error);
                setErrorMessage(error.message || 'Gagal membuat transaksi VA');
                setShowError(true);
                setIsProcessing(false);
                return;
            }
        }

        // Offline / Cash Flow
        const pMethod = isSplitMode ? 'Split Payment' : activePaymentMethod;
        await saveTransactionWithStatus(transactionId, 'paid', pMethod);
        setIsProcessing(false);
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
                productName: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
            })),
            payments: appliedPayments.map(p => ({
                paymentMethod: p.paymentMethod,
                amount: p.amount
            }))
        };

        try {
            if (isOnline) {
                const { API_URL } = await import('../config/api');
                const response = await fetch(`${API_URL}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(transactionPayload),
                });
                // ... handle response
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed');
            } else {
                // Offline logic - store everything in transactionPayload
                const transaction = {
                    ...transactionPayload,
                    id: transactionId,
                    syncStatus: 'pending',
                    createdAt: new Date(),
                } as any;
                await db.transactions.insert(transaction);
            }

            // If this was a resumed held order, mark it as completed
            if (resumedOrderId) {
                console.log('[Checkout] Marking held order as completed:', resumedOrderId);
                await markHeldOrderCompleted(resumedOrderId);
                clearResumedOrder();
            }

            setCompletedTransaction({ ...transactionPayload, createdAt: new Date().toISOString() });
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

    const paymentMethods: { key: PaymentMethod; label: string; icon: string; desc: string }[] = [
        { key: 'cash', label: 'Tunai', icon: 'cash', desc: 'Bayar di kasir' },
        { key: 'qris', label: 'QRIS', icon: 'qrcode-scan', desc: 'Scan QR Code' },
        { key: 'transfer', label: 'Transfer', icon: 'bank', desc: 'Bank Transfer' },
    ];

    return (
        <View className="flex-1 bg-zinc-50 ">
            <SuccessModal
                visible={showSuccess}
                onClose={handleSuccessClose}
                transaction={completedTransaction}
                isOnline={isOnline}
            />
            <ErrorModal
                visible={showError}
                onClose={() => setShowError(false)}
                message={errorMessage}
            />
            <QrisModal
                visible={showQris}
                onClose={() => setShowQris(false)}
                qrString={qrisString}
                amount={appliedPayments.find(p => p.paymentMethod === 'qris')?.amount || getTotal()}
                status={paymentStatus}
            />
            <TransferModal
                visible={showTransfer}
                onClose={() => setShowTransfer(false)}
                vaNumber={vaNumber}
                bankName={selectedBank}
                amount={appliedPayments.find(p => p.paymentMethod === 'transfer')?.amount || getTotal()}
                status={paymentStatus}
            />

            {/* Header */}
            <View className="flex-row items-center bg-white px-4 pb-4 pt-14 shadow-sm ">
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

            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                {/* Order Summary Card */}
                <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm  border border-zinc-100 ">
                    <View className="mb-4 flex-row items-center gap-2 border-b border-zinc-100 pb-4 ">
                        <MaterialCommunityIcons name="receipt-text-outline" size={22} color="#377f7e" />
                        <Text className="text-lg font-bold text-zinc-900 ">Ringkasan Pesanan</Text>
                    </View>

                    {items.map((item) => (
                        <View key={item.id} className="mb-3 flex-row justify-between">
                            <View className="flex-1">
                                <Text className="font-medium text-zinc-700 ">{item.name}</Text>
                                <Text className="text-xs text-zinc-400">{item.quantity} x {formatCurrency(item.price)}</Text>
                            </View>
                            <Text className="font-semibold text-zinc-900 ">
                                {formatCurrency(item.price * item.quantity)}
                            </Text>
                        </View>
                    ))}

                    <View className="mt-4 flex-row justify-between rounded-xl bg-zinc-50 p-4 ">
                        <Text className="text-lg font-bold text-zinc-900 ">Total Tagihan</Text>
                        <Text className="text-lg font-bold text-primary-600 ">
                            {formatCurrency(getTotal())}
                        </Text>
                    </View>
                </View>

                <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-zinc-900">Metode Pembayaran</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setIsSplitMode(!isSplitMode);
                            if (!isSplitMode && appliedPayments.length === 0) {
                                addPayment('cash');
                            }
                        }}
                        className="rounded-full bg-secondary-100 px-3 py-1"
                    >
                        <Text className="text-xs font-bold text-secondary-800">
                            {isSplitMode ? 'Split: ON' : 'Split Pembayaran?'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {appliedPayments.length > 0 && (
                    <View className="mb-4 gap-3">
                        <View className="flex-row items-center justify-between px-1">
                            <Text className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Rincian Pembayaran</Text>
                        </View>
                        {appliedPayments.map((p, idx) => (
                            <View key={idx} className="overflow-hidden rounded-2xl bg-white p-4 border border-zinc-100 shadow-sm">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-row items-center gap-2">
                                        <View className="h-2 w-2 rounded-full bg-secondary-400" />
                                        <Text className="text-xs font-bold uppercase tracking-tight text-zinc-600">{p.paymentMethod}</Text>
                                    </View>
                                    {isSplitMode && (
                                        <TouchableOpacity
                                            onPress={() => removePayment(idx)}
                                            className="h-8 w-8 items-center justify-center rounded-full bg-red-50"
                                        >
                                            <MaterialCommunityIcons name="close" size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <View className="flex-1 flex-row items-center rounded-xl bg-zinc-50 px-3 py-2 border border-zinc-100">
                                        <Text className="text-xs font-bold text-zinc-400 mr-2">Rp</Text>
                                        {isSplitMode ? (
                                            <TextInput
                                                className="flex-1 text-base font-bold text-zinc-900 p-0"
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
                                            <Text className="flex-1 text-base font-bold text-zinc-900">
                                                {p.amount.toLocaleString('id-ID')}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}
                        {isSplitMode && (
                            <View className={`rounded-2xl p-4 items-center border border-dashed ${getRemainingBalance() === 0
                                ? 'bg-green-50 border-green-200'
                                : getRemainingBalance() > 0
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-red-50 border-red-200'}`}>
                                <Text className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${getRemainingBalance() === 0 ? 'text-green-600' : getRemainingBalance() > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {getRemainingBalance() === 0 ? 'Tagihan Terbayar' : getRemainingBalance() > 0 ? 'Sisa Tagihan' : 'Kelebihan Bayar'}
                                </Text>
                                <Text className={`text-xl font-bold ${getRemainingBalance() === 0 ? 'text-green-700' : getRemainingBalance() > 0 ? 'text-amber-700' : 'text-red-700'}`}>
                                    {formatCurrency(Math.abs(getRemainingBalance()))}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View className="gap-3 mb-24">
                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method.key}
                            onPress={() => addPayment(method.key)}
                            className={`flex-row items-center rounded-2xl border p-4 transition-all ${(isSplitMode ? appliedPayments.some(p => p.paymentMethod === method.key) : paymentMethod === method.key)
                                ? 'border-secondary-500 bg-secondary-50 '
                                : 'border-zinc-100 bg-white  '
                                }`}
                        >
                            <View className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${(isSplitMode ? appliedPayments.some(p => p.paymentMethod === method.key) : paymentMethod === method.key) ? 'bg-secondary-200 ' : 'bg-zinc-100 '
                                }`}>
                                <MaterialCommunityIcons
                                    name={method.icon as any}
                                    size={24}
                                    color={(isSplitMode ? appliedPayments.some(p => p.paymentMethod === method.key) : paymentMethod === method.key) ? '#854d0e' : '#71717a'}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className={`font-bold ${(isSplitMode ? appliedPayments.some(p => p.paymentMethod === method.key) : paymentMethod === method.key) ? 'text-zinc-900' : 'text-zinc-600'
                                    }`}>
                                    {method.label}
                                </Text>
                                <Text className="text-xs text-zinc-400">{method.desc}</Text>
                            </View>
                            {(isSplitMode ? appliedPayments.some(p => p.paymentMethod === method.key) : paymentMethod === method.key) && (
                                <MaterialCommunityIcons name="check-circle" size={24} color="#f5c23c" />
                            )}
                        </TouchableOpacity>
                    ))}

                    {/* Bank Selection for Transfer */}
                    {paymentMethod === 'transfer' && (
                        <View className="mt-4 rounded-2xl bg-white p-4 border border-zinc-100">
                            <Text className="mb-3 font-bold text-zinc-700">Pilih Bank</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {(['bca', 'bni', 'bri', 'mandiri'] as const).map((bank) => (
                                    <TouchableOpacity
                                        key={bank}
                                        onPress={() => setSelectedBank(bank)}
                                        className={`flex-1 min-w-[80px] items-center justify-center rounded-xl py-3 px-4 border ${selectedBank === bank
                                            ? 'border-secondary-500 bg-secondary-50'
                                            : 'border-zinc-200 bg-zinc-50'
                                            }`}
                                    >
                                        <Text className={`font-bold uppercase ${selectedBank === bank ? 'text-secondary-700' : 'text-zinc-600'}`}>
                                            {bank}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="bg-white px-6 py-6 border-t border-zinc-100 shadow-2xl">
                <TouchableOpacity
                    onPress={handleConfirmPayment}
                    disabled={isProcessing || getRemainingBalance() > 0 && isSplitMode}
                    className={`h-16 w-full flex-row items-center justify-center gap-3 rounded-2xl shadow-lg ${isProcessing || (getRemainingBalance() > 0 && isSplitMode) ? 'bg-zinc-200' : 'bg-primary-600 active:scale-[0.98]'}`}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check-circle" size={24} color="white" />
                            <Text className="text-lg font-bold text-white">
                                {isSplitMode ? 'Selesaikan Split' : `Bayar ${formatCurrency(getTotal())}`}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Hold Order Modal */}
            <Modal
                visible={showHoldOrderModal}
                transparent
                animationType="fade"
            >
                <View className="flex-1 items-center justify-center bg-black/60 px-4">
                    <View className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
                        <View className="bg-gradient-to-r from-primary-600 to-primary-500 p-6 flex-row justify-between items-center">
                            <View className="flex-1">
                                <Text className="text-2xl font-bold text-white">Tahan Pesanan</Text>
                                <Text className="text-primary-100 text-sm opacity-90 mt-1">Simpan untuk dilanjutkan nanti</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowHoldOrderModal(false)}
                                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                            >
                                <MaterialCommunityIcons name="close" size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-6 max-h-[600px]">
                            {/* Order Summary Card */}
                            <View className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-5 mb-4 border border-primary-100">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View>
                                        <Text className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Item</Text>
                                        <Text className="text-2xl font-black text-primary-700">{items.length}</Text>
                                    </View>
                                    <View className="bg-secondary-500 px-4 py-2 rounded-xl shadow-sm">
                                        <Text className="text-xl font-black text-secondary-950">
                                            {formatCurrency(getTotal())}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Notes Input */}
                            <View className="mb-6">
                                <Text className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Catatan (Opsional)</Text>
                                <View className="relative">
                                    <TextInput
                                        value={holdOrderNotes}
                                        onChangeText={setHoldOrderNotes}
                                        placeholder="Contoh: Nama meja, request khusus, dll..."
                                        multiline
                                        numberOfLines={4}
                                        className="bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 text-zinc-900 text-sm"
                                        style={{ textAlignVertical: 'top', minHeight: 100 }}
                                    />
                                </View>
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
                                className="w-full bg-secondary-500 py-4 rounded-2xl flex-row items-center justify-center gap-3 active:bg-secondary-600 shadow-lg shadow-secondary-500/20"
                            >
                                {isProcessingHold ? (
                                    <ActivityIndicator size="small" color="#302302" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="pause-circle" size={24} color="#302302" />
                                        <Text className="text-secondary-950 text-lg font-bold">Simpan & Tahan Pesanan</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowHoldOrderModal(false)}
                                className="w-full mt-3 py-3 items-center"
                            >
                                <Text className="text-zinc-400 font-bold">Batal</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

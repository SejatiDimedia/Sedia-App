"use client";

import { useState, useEffect } from "react";
import {
    CreditCard,
    Plus,
    Trash2,
    Check,
    X,
    Banknote,
    QrCode,
    ArrowRightLeft,
    Wallet,
    Smartphone,
    MoreVertical,
    Save,
    Store,
    Pencil
} from "lucide-react";
import { useOutlet } from "@/providers/outlet-provider";
import { toast } from "react-hot-toast";

interface PaymentMethod {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    bankName?: string | null;
    accountNumber?: string | null;
    accountHolder?: string | null;
    qrisData?: string | null;
    qrisImageUrl?: string | null;
    bankAccounts?: { bankName: string; accountNumber: string; accountHolder: string }[] | null;
    isManual?: boolean;
}

const PAYMENT_TYPES = [
    { value: "cash", label: "Tunai", icon: Banknote },
    { value: "qris", label: "QRIS", icon: QrCode },
    { value: "transfer", label: "Transfer Bank", icon: ArrowRightLeft },
    { value: "ewallet", label: "e-Wallet", icon: Smartphone },
    { value: "card", label: "Kartu Kredit/Debit", icon: CreditCard },
];

export default function PaymentSettings() {
    const { activeOutlet, outlets } = useOutlet();
    const [selectedOutletId, setSelectedOutletId] = useState(activeOutlet?.id || "");
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [newMethod, setNewMethod] = useState({
        name: "",
        type: "cash",
        bankName: "",
        accountNumber: "",
        accountHolder: "",
        qrisData: "",
        qrisImageUrl: "",
        bankAccounts: [] as { bankName: string; accountNumber: string; accountHolder: string }[],
        isManual: false
    });

    const fetchMethods = async () => {
        if (!selectedOutletId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/payment-methods?outletId=${selectedOutletId}`);
            if (res.ok) {
                const data = await res.json();
                setMethods(data);
            }
        } catch (error) {
            console.error("Failed to fetch payment methods", error);
            toast.error("Gagal memuat metode pembayaran");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeOutlet?.id && !selectedOutletId) {
            setSelectedOutletId(activeOutlet.id);
        }
    }, [activeOutlet?.id]);

    useEffect(() => {
        fetchMethods();
    }, [selectedOutletId]);

    const handleSaveMethod = async () => {
        if (!newMethod.name) return toast.error("Nama metode harus diisi");
        if (!selectedOutletId) return toast.error("Outlet belum dipilih");
        setIsSaving(true);
        try {
            const url = editingMethod ? `/api/payment-methods/${editingMethod.id}` : "/api/payment-methods";
            const method = editingMethod ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outletId: selectedOutletId,
                    ...newMethod,
                    isActive: editingMethod ? editingMethod.isActive : true
                }),
            });

            if (res.ok) {
                toast.success(editingMethod ? "Metode pembayaran diperbarui" : "Metode pembayaran ditambahkan");
                setShowAddModal(false);
                setEditingMethod(null);
                setNewMethod({
                    name: "",
                    type: "cash",
                    bankName: "",
                    accountNumber: "",
                    accountHolder: "",
                    qrisData: "",
                    qrisImageUrl: "",
                    bankAccounts: [],
                    isManual: false
                });
                fetchMethods();
            } else {
                toast.error("Gagal menyimpan metode");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (method: PaymentMethod) => {
        try {
            const res = await fetch(`/api/payment-methods/${method.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...method,
                    isActive: !method.isActive,
                }),
            });

            if (res.ok) {
                setMethods(methods.map(m => m.id === method.id ? { ...m, isActive: !m.isActive } : m));
                toast.success(`Metode ${!method.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
            }
        } catch (error) {
            toast.error("Gagal mengubah status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus metode pembayaran ini?")) return;
        try {
            const res = await fetch(`/api/payment-methods/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setMethods(methods.filter(m => m.id !== id));
                toast.success("Metode dihapus");
            }
        } catch (error) {
            toast.error("Gagal menghapus");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-zinc-500">Memuat metode pembayaran...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-zinc-900">Metode Pembayaran</h3>
                    <p className="text-sm text-zinc-500">Atur cara pelanggan membayar di toko Anda</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Metode
                </button>
            </div>

            {/* Outlet Selector */}
            <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pilih Outlet</label>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-200">
                        <Store className="h-5 w-5 text-zinc-400" />
                    </div>
                    <select
                        value={selectedOutletId}
                        onChange={(e) => setSelectedOutletId(e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                    >
                        {outlets.map((outlet) => (
                            <option key={outlet.id} value={outlet.id}>
                                {outlet.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid gap-4">
                {methods.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 p-12 text-center">
                        <CreditCard className="mx-auto h-12 w-12 text-zinc-300" />
                        <p className="mt-4 text-sm text-zinc-500">Belum ada metode pembayaran kustom.</p>
                        <p className="text-xs text-zinc-400">Sistem akan menggunakan metode default (Tunai, QRIS, Transfer).</p>
                    </div>
                ) : (
                    methods.map((method) => {
                        const TypeIcon = PAYMENT_TYPES.find(t => t.value === method.type)?.icon || CreditCard;
                        return (
                            <div key={method.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-primary-200 hover:shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400">
                                        <TypeIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900">{method.name}</p>
                                        <p className="text-xs text-zinc-500 uppercase font-medium tracking-wider">
                                            {PAYMENT_TYPES.find(t => t.value === method.type)?.label}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingMethod(method);
                                            setNewMethod({
                                                name: method.name,
                                                type: method.type,
                                                bankName: method.bankName || "",
                                                accountNumber: method.accountNumber || "",
                                                accountHolder: method.accountHolder || "",
                                                qrisData: method.qrisData || "",
                                                qrisImageUrl: method.qrisImageUrl || "",
                                                bankAccounts: method.bankAccounts || [],
                                                isManual: method.isManual || false
                                            });
                                            setShowAddModal(true);
                                        }}
                                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-primary-600 transition-colors"
                                    >
                                        <Pencil className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(method)}
                                        className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${method.isActive ? 'bg-primary-500' : 'bg-zinc-200'}`}
                                    >
                                        <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${method.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(method.id)}
                                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-zinc-900">{editingMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Baru'}</h3>
                                {newMethod.type !== 'cash' && (
                                    <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Manual</span>
                                        <button
                                            onClick={() => setNewMethod({ ...newMethod, isManual: !newMethod.isManual })}
                                            className={`flex h-4 w-8 items-center rounded-full p-0.5 transition-colors ${newMethod.isManual ? 'bg-primary-500' : 'bg-zinc-300'}`}
                                        >
                                            <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${newMethod.isManual ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => { setShowAddModal(false); setEditingMethod(null); }} className="rounded-full p-1 hover:bg-zinc-100">
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2 pb-2">

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Nama Metode</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: QRIS Statis, Transfer BCA"
                                    value={newMethod.name}
                                    onChange={e => setNewMethod({ ...newMethod, name: e.target.value })}
                                    className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Tipe Pembayaran</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PAYMENT_TYPES.map(type => (
                                        <button
                                            key={type.value}
                                            onClick={() => setNewMethod({ ...newMethod, type: type.value })}
                                            className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${newMethod.type === type.value ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-zinc-200 hover:border-zinc-300'}`}
                                        >
                                            <type.icon className={`h-4 w-4 ${newMethod.type === type.value ? 'text-primary-600' : 'text-zinc-400'}`} />
                                            <span className={`text-xs font-bold ${newMethod.type === type.value ? 'text-primary-700' : 'text-zinc-600'}`}>{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Conditional Fields for Transfer */}
                            {newMethod.type === 'transfer' && (
                                <div className="space-y-4 rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-2">
                                            <ArrowRightLeft className="h-3 w-3" />
                                            Daftar Rekening Bank
                                        </h4>
                                        <button
                                            onClick={() => {
                                                const accounts = [...(newMethod.bankAccounts || [])];
                                                accounts.push({ bankName: "", accountNumber: "", accountHolder: "" });
                                                setNewMethod({ ...newMethod, bankAccounts: accounts });
                                            }}
                                            className="text-[10px] font-bold bg-primary-100 text-primary-600 px-2 py-1 rounded hover:bg-primary-200 transition-colors flex items-center gap-1"
                                        >
                                            <Plus className="h-3 w-3" /> Tambah Bank
                                        </button>
                                    </div>

                                    {(newMethod.bankAccounts || []).length === 0 ? (
                                        <div className="text-center py-4 bg-white rounded-lg border border-dashed border-zinc-200">
                                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Belum ada rekening ditambahkan</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {(newMethod.bankAccounts || []).map((acc, idx) => (
                                                <div key={idx} className="p-3 bg-white rounded-lg border border-zinc-200 relative group">
                                                    <button
                                                        onClick={() => {
                                                            const accounts = (newMethod.bankAccounts || []).filter((_, i) => i !== idx);
                                                            setNewMethod({ ...newMethod, bankAccounts: accounts });
                                                        }}
                                                        className="absolute top-2 right-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="col-span-2">
                                                            <label className="mb-0.5 block text-[10px] font-medium text-zinc-400 uppercase">Nama Bank</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Contoh: BCA, Mandiri"
                                                                value={acc.bankName}
                                                                onChange={e => {
                                                                    const accounts = [...(newMethod.bankAccounts || [])];
                                                                    accounts[idx].bankName = e.target.value;
                                                                    setNewMethod({ ...newMethod, bankAccounts: accounts });
                                                                }}
                                                                className="w-full rounded-md border border-zinc-100 px-2 py-1.5 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-0.5 block text-[10px] font-medium text-zinc-400 uppercase">No. Rekening</label>
                                                            <input
                                                                type="text"
                                                                placeholder="123456789"
                                                                value={acc.accountNumber}
                                                                onChange={e => {
                                                                    const accounts = [...(newMethod.bankAccounts || [])];
                                                                    accounts[idx].accountNumber = e.target.value;
                                                                    setNewMethod({ ...newMethod, bankAccounts: accounts });
                                                                }}
                                                                className="w-full rounded-md border border-zinc-100 px-2 py-1.5 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-0.5 block text-[10px] font-medium text-zinc-400 uppercase">Atas Nama</label>
                                                            <input
                                                                type="text"
                                                                placeholder="John Doe"
                                                                value={acc.accountHolder}
                                                                onChange={e => {
                                                                    const accounts = [...(newMethod.bankAccounts || [])];
                                                                    accounts[idx].accountHolder = e.target.value;
                                                                    setNewMethod({ ...newMethod, bankAccounts: accounts });
                                                                }}
                                                                className="w-full rounded-md border border-zinc-100 px-2 py-1.5 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Conditional Fields for QRIS */}
                            {newMethod.type === 'qris' && (
                                <div className="space-y-4 rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                                    <h4 className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-2">
                                        <QrCode className="h-3 w-3" />
                                        Detail QRIS
                                    </h4>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-500">Data QRIS (String/Payload)</label>
                                        <textarea
                                            placeholder="Masukkan payload QRIS atau URL Midtrans"
                                            value={newMethod.qrisData}
                                            onChange={e => setNewMethod({ ...newMethod, qrisData: e.target.value })}
                                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white min-h-[60px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-500">URL Gambar QRIS (Upload atau Link)</label>
                                        <input
                                            type="text"
                                            placeholder="https://example.com/qris.png"
                                            value={newMethod.qrisImageUrl}
                                            onChange={e => setNewMethod({ ...newMethod, qrisImageUrl: e.target.value })}
                                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => { setShowAddModal(false); setEditingMethod(null); }}
                                className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveMethod}
                                disabled={isSaving}
                                className="flex-1 rounded-xl bg-primary-500 py-3 text-sm font-bold text-white shadow-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Menyimpan..." : (editingMethod ? "Update Metode" : "Simpan Metode")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


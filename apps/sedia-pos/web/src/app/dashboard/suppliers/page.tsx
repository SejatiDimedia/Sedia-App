"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Truck,
    Pencil,
    Trash2,
    X,
    MapPin,
    Phone,
    Mail,
    Package
} from "lucide-react";
import { getOutlets } from "@/actions/outlets";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/actions/suppliers";
import ConfirmationModal from "@/components/confirmation-modal";

interface Supplier {
    id: string;
    outletId: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
}

interface Outlet {
    id: string;
    name: string;
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formContact, setFormContact] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formAddress, setFormAddress] = useState("");
    const [formNotes, setFormNotes] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: "primary" | "danger" | "warning";
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

    // Fetch outlets on mount
    useEffect(() => {
        const loadOutlets = async () => {
            try {
                const data = await getOutlets();
                setOutlets(data);
                if (data.length > 0) {
                    setSelectedOutletId(data[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch outlets:", error);
            }
        };
        loadOutlets();
    }, []);

    // Fetch suppliers when outlet changes
    useEffect(() => {
        const loadData = async () => {
            if (!selectedOutletId) return;
            setIsLoading(true);
            try {
                const res = await getSuppliers(selectedOutletId);
                if (res.data) {
                    setSuppliers(res.data as unknown as Supplier[]);
                }
            } catch (error) {
                console.error("Failed to fetch suppliers:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [selectedOutletId]);

    const showConfirm = (config: Omit<typeof confirmState, "isOpen">) => {
        setConfirmState({ ...config, isOpen: true });
    };

    const handleConfirm = () => {
        confirmState.onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormName(supplier.name);
            setFormContact(supplier.contactPerson || "");
            setFormEmail(supplier.email || "");
            setFormPhone(supplier.phone || "");
            setFormAddress(supplier.address || "");
            setFormNotes(supplier.notes || "");
        } else {
            setEditingSupplier(null);
            setFormName("");
            setFormContact("");
            setFormEmail("");
            setFormPhone("");
            setFormAddress("");
            setFormNotes("");
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSupplier(null);
        setFormName("");
        setFormContact("");
        setFormEmail("");
        setFormPhone("");
        setFormAddress("");
        setFormNotes("");
    };

    const handleSave = async () => {
        if (!formName.trim() || !selectedOutletId) return;

        setIsSaving(true);
        try {
            const supplierData = {
                outletId: selectedOutletId,
                name: formName,
                contactPerson: formContact || undefined,
                email: formEmail || undefined,
                phone: formPhone || undefined,
                address: formAddress || undefined,
                notes: formNotes || undefined,
            };

            if (editingSupplier) {
                const res = await updateSupplier(editingSupplier.id, supplierData);
                if (res.success) {
                    const updatedData = await getSuppliers(selectedOutletId);
                    if (updatedData.data) setSuppliers(updatedData.data as unknown as Supplier[]);
                    handleCloseModal();
                } else {
                    alert("Gagal mengupdate supplier");
                }
            } else {
                const res = await createSupplier(supplierData);
                if (res.success) {
                    const updatedData = await getSuppliers(selectedOutletId);
                    if (updatedData.data) setSuppliers(updatedData.data as unknown as Supplier[]);
                    handleCloseModal();
                } else {
                    alert("Gagal menambahkan supplier");
                }
            }
        } catch (error) {
            console.error("Failed to save supplier:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm({
            title: "Hapus Supplier",
            message: "Apakah Anda yakin ingin menghapus supplier ini?",
            variant: "danger",
            onConfirm: async () => {
                try {
                    const res = await deleteSupplier(id);
                    if (res.success) {
                        const updatedData = await getSuppliers(selectedOutletId);
                        if (updatedData.data) setSuppliers(updatedData.data as unknown as Supplier[]);
                    } else {
                        alert("Gagal menghapus supplier");
                    }
                } catch (error) {
                    console.error("Failed to delete supplier:", error);
                }
            }
        });
    };

    const filteredSuppliers = suppliers.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Supplier
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Kelola data supplier dan pemasok barang
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    disabled={!selectedOutletId}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Supplier
                </button>
            </div>

            {/* Outlet Selector */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none"
                    disabled={outlets.length === 0}
                >
                    {outlets.length === 0 && <option value="">Tidak ada outlet</option>}
                    {outlets.map((outlet) => (
                        <option key={outlet.id} value={outlet.id}>
                            {outlet.name}
                        </option>
                    ))}
                </select>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Cari supplier..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
            </div>

            {/* Suppliers List */}
            {outlets.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
                    <Truck className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                    <p className="text-zinc-500">Anda belum memiliki Outlet.</p>
                </div>
            ) : !selectedOutletId ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
                    <Truck className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                    <p className="text-zinc-500">Pilih outlet untuk melihat supplier</p>
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                </div>
            ) : filteredSuppliers.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
                    <Truck className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                    <p className="text-zinc-500">Belum ada supplier di outlet ini</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 text-sm font-medium text-primary-600 hover:underline"
                    >
                        Tambah supplier pertama
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSuppliers.map((supplier) => (
                        <div key={supplier.id} className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                        <Truck className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900">{supplier.name}</h3>
                                        <p className="text-xs text-zinc-500">{supplier.contactPerson || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleOpenModal(supplier)}
                                        className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(supplier.id)}
                                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-zinc-600">
                                {supplier.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-zinc-400" />
                                        <span>{supplier.phone}</span>
                                    </div>
                                )}
                                {supplier.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-zinc-400" />
                                        <span>{supplier.email}</span>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />
                                        <span className="line-clamp-2">{supplier.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                            <h2 className="text-lg font-bold text-zinc-900">
                                {editingSupplier ? "Edit Supplier" : "Tambah Supplier Baru"}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">Nama Supplier *</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Contoh: PT. Sedia Abadi"
                                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-zinc-700">Kontak Person</label>
                                    <input
                                        type="text"
                                        value={formContact}
                                        onChange={(e) => setFormContact(e.target.value)}
                                        placeholder="Nama PIC"
                                        className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-zinc-700">No. Telepon</label>
                                    <input
                                        type="tel"
                                        value={formPhone}
                                        onChange={(e) => setFormPhone(e.target.value)}
                                        placeholder="0812..."
                                        className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
                                <input
                                    type="email"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    placeholder="email@supplier.com"
                                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">Alamat</label>
                                <textarea
                                    value={formAddress}
                                    onChange={(e) => setFormAddress(e.target.value)}
                                    placeholder="Alamat lengkap supplier"
                                    rows={3}
                                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">Catatan</label>
                                <textarea
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    placeholder="Catatan tambahan..."
                                    rows={2}
                                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 px-6 py-4 bg-zinc-50 rounded-b-2xl">
                            <button
                                onClick={handleCloseModal}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !formName.trim()}
                                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {isSaving ? "Menyimpan..." : "Simpan Supplier"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                isLoading={isSaving}
            />
        </div>
    );
}

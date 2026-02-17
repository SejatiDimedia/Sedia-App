"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Store,
    MapPin,
    Phone,
    Pencil,
    Trash2,
    X,
    Clock,
} from "lucide-react";
import Image from "next/image";
import ConfirmationModal from "@/components/confirmation-modal";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { toast } from "react-hot-toast";

interface Outlet {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    openTime: string | null;
    closeTime: string | null;
    greeting: string | null;
    isCatalogVisible: boolean;
    logoUrl: string | null;
    createdAt: string;
}

export default function OutletsPage() {
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
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

    // Form state
    const [formName, setFormName] = useState("");
    const [formLogo, setFormLogo] = useState("");
    const [formAddress, setFormAddress] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formGreeting, setFormGreeting] = useState("");
    const [formOpenTime, setFormOpenTime] = useState("");
    const [formCloseTime, setFormCloseTime] = useState("");
    const [formIsCatalogVisible, setFormIsCatalogVisible] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch outlets on mount
    useEffect(() => {
        fetchOutlets();
    }, []);

    const fetchOutlets = async () => {
        try {
            const res = await fetch("/api/outlets");
            if (res.ok) {
                const data = await res.json();
                setOutlets(data);
            }
        } catch (error) {
            console.error("Failed to fetch outlets:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const showConfirm = (config: Omit<typeof confirmState, "isOpen">) => {
        setConfirmState({ ...config, isOpen: true });
    };

    const handleConfirm = () => {
        confirmState.onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    const handleOpenModal = (outlet?: Outlet) => {
        if (outlet) {
            setEditingOutlet(outlet);
            setFormName(outlet.name);
            setFormAddress(outlet.address || "");
            setFormPhone(outlet.phone || "");
            setFormGreeting(outlet.greeting || "");
            setFormOpenTime(outlet.openTime || "");
            setFormCloseTime(outlet.closeTime || "");
            setFormGreeting(outlet.greeting || "");
            setFormIsCatalogVisible(outlet.isCatalogVisible ?? true); // Default true if undefined
            setFormLogo(outlet.logoUrl || "");
        } else {
            setEditingOutlet(null);
            setFormName("");
            setFormAddress("");
            setFormPhone("");
            setFormOpenTime("");
            setFormCloseTime("");
            setFormGreeting("");
            setFormIsCatalogVisible(true);
            setFormLogo("");
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOutlet(null);
        setFormName("");
        setFormAddress("");
        setFormPhone("");
        setFormGreeting("");
        setFormOpenTime("");
        setFormCloseTime("");
        setFormIsCatalogVisible(true);
        setFormLogo("");
    };

    const handleSave = async () => {
        if (!formName.trim()) return;

        setIsSaving(true);
        try {
            if (editingOutlet) {
                // Update
                const res = await fetch(`/api/outlets/${editingOutlet.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formName,
                        address: formAddress,
                        phone: formPhone,
                        openTime: formOpenTime || null,
                        closeTime: formCloseTime || null,
                        greeting: formGreeting || null,
                        isCatalogVisible: formIsCatalogVisible,
                        logoUrl: formLogo || null,
                    }),
                });
                if (res.ok) {
                    fetchOutlets();
                    handleCloseModal();
                }
            } else {
                // Create
                const res = await fetch("/api/outlets", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formName,
                        address: formAddress,
                        phone: formPhone,
                        openTime: formOpenTime || null,
                        closeTime: formCloseTime || null,
                        greeting: formGreeting || null,
                        isCatalogVisible: formIsCatalogVisible,
                        logoUrl: formLogo || null,
                    }),
                });
                if (res.ok) {
                    fetchOutlets();
                    handleCloseModal();
                }
            }
        } catch (error) {
            console.error("Failed to save outlet:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm({
            title: "Hapus Outlet",
            message: "Apakah Anda yakin ingin menghapus outlet ini? Semua data terkait outlet ini (Produk, Karyawan, Transaksi) mungkin akan terpengaruh.",
            variant: "danger",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/outlets/${id}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("Outlet berhasil dihapus");
                        fetchOutlets();
                    } else {
                        toast.error("Gagal menghapus outlet");
                    }
                } catch (error) {
                    console.error("Failed to delete outlet:", error);
                    toast.error("Terjadi kesalahan sistem");
                }
            }
        });
    };

    const filteredOutlets = outlets.filter((outlet) =>
        outlet.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Outlet
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Kelola cabang toko Anda
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Outlet
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                    type="text"
                    placeholder="Cari outlet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
            </div>

            {/* Outlets Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                </div>
            ) : filteredOutlets.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
                    <Store className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                    <p className="text-zinc-500">Belum ada outlet</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 text-sm font-medium text-primary-600 hover:underline"
                    >
                        Tambah outlet pertama
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredOutlets.map((outlet) => (
                        <div
                            key={outlet.id}
                            className="rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 overflow-hidden">
                                    {outlet.logoUrl ? (
                                        <Image
                                            src={outlet.logoUrl}
                                            alt={outlet.name}
                                            fill
                                            className="object-cover"
                                            sizes="48px"
                                        />
                                    ) : (
                                        <Store className="h-6 w-6 text-primary-600" />
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleOpenModal(outlet)}
                                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(outlet.id)}
                                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-zinc-900">
                                {outlet.name}
                            </h3>
                            {outlet.address && (
                                <div className="mb-1 flex items-center gap-2 text-sm text-zinc-500">
                                    <MapPin className="h-4 w-4" />
                                    <span>{outlet.address}</span>
                                </div>
                            )}
                            {outlet.phone && (
                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                    <Phone className="h-4 w-4" />
                                    <span>{outlet.phone}</span>
                                </div>
                            )}
                            {(outlet.openTime || outlet.closeTime) && (
                                <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                                    <Clock className="h-4 w-4" />
                                    <span>{outlet.openTime || "--:--"} - {outlet.closeTime || "--:--"}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900">
                                {editingOutlet ? "Edit Outlet" : "Tambah Outlet"}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-5">
                                {/* Branding Section */}
                                <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4">
                                    <h3 className="mb-3 text-sm font-medium text-zinc-900">Branding & Identitas</h3>
                                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                                        <div className="w-40 flex-shrink-0">
                                            <ImageUpload
                                                value={formLogo}
                                                onChange={setFormLogo}
                                                label="Logo"
                                            />
                                        </div>
                                        <div className="flex-1 text-sm text-zinc-500">
                                            <p className="mb-1 font-medium text-zinc-700">Logo Toko</p>
                                            <p>Upload logo toko Anda untuk ditampilkan di halaman katalog publik.</p>
                                            <p className="mt-1 text-xs text-zinc-400">Format: .jpg, .png (Max 2MB)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                            Nama Outlet *
                                        </label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            placeholder="Contoh: Cabang Utama"
                                            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                            Alamat
                                        </label>
                                        <input
                                            type="text"
                                            value={formAddress}
                                            onChange={(e) => setFormAddress(e.target.value)}
                                            placeholder="Contoh: Jl. Raya No. 123"
                                            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                            No. Telepon
                                        </label>
                                        <input
                                            type="text"
                                            value={formPhone}
                                            onChange={(e) => setFormPhone(e.target.value)}
                                            placeholder="Contoh: 0812-3456-7890"
                                            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                            Pesan Sambutan (Greeting)
                                        </label>
                                        <textarea
                                            value={formGreeting}
                                            onChange={(e) => setFormGreeting(e.target.value)}
                                            placeholder="Selamat datang di toko kami! Silahkan pesan menu favoritmu."
                                            rows={3}
                                            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                                        />
                                        <p className="mt-1 text-xs text-zinc-500">
                                            Pesan ini akan muncul saat pelanggan membuka katalog toko Anda. Kosongkan jika tidak ingin menampilkannya.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                                Jam Buka
                                            </label>
                                            <input
                                                type="time"
                                                value={formOpenTime}
                                                onChange={(e) => setFormOpenTime(e.target.value)}
                                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                                Jam Tutup
                                            </label>
                                            <input
                                                type="time"
                                                value={formCloseTime}
                                                onChange={(e) => setFormCloseTime(e.target.value)}
                                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Catalog Visibility Toggle */}
                                    <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
                                        <div>
                                            <h4 className="text-sm font-medium text-zinc-900">Tampilkan Katalog Publik</h4>
                                            <p className="text-xs text-zinc-500">
                                                Izinkan pelanggan melihat produk outlet ini secara online.
                                            </p>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={formIsCatalogVisible}
                                                onChange={(e) => setFormIsCatalogVisible(e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-secondary-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary-500/20"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={handleCloseModal}
                                        className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || !formName.trim()}
                                        className="flex-1 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600 disabled:opacity-50"
                                    >
                                        {isSaving ? "Menyimpan..." : "Simpan"}
                                    </button>
                                </div>
                            </div>
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

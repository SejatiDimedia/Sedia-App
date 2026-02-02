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
} from "lucide-react";

interface Outlet {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    createdAt: string;
}

export default function OutletsPage() {
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formAddress, setFormAddress] = useState("");
    const [formPhone, setFormPhone] = useState("");
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

    const handleOpenModal = (outlet?: Outlet) => {
        if (outlet) {
            setEditingOutlet(outlet);
            setFormName(outlet.name);
            setFormAddress(outlet.address || "");
            setFormPhone(outlet.phone || "");
        } else {
            setEditingOutlet(null);
            setFormName("");
            setFormAddress("");
            setFormPhone("");
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOutlet(null);
        setFormName("");
        setFormAddress("");
        setFormPhone("");
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
        if (!confirm("Yakin ingin menghapus outlet ini?")) return;

        try {
            const res = await fetch(`/api/outlets/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchOutlets();
            }
        } catch (error) {
            console.error("Failed to delete outlet:", error);
        }
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
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                                    <Store className="h-6 w-6 text-primary-600" />
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
            )}
        </div>
    );
}

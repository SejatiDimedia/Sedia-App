"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Search,
    Plus,
    Pencil,
    Trash2,
    X,
    Phone,
    Mail,
    Star,
    Coins,
} from "lucide-react";

interface Customer {
    id: string;
    outletId: string;
    name: string;
    phone: string | null;
    email: string | null;
    points: number;
    tierId: string | null;
    totalSpent: string;
    createdAt: string;
}

interface MemberTier {
    id: string;
    name: string;
    discountPercent: string;
    minPoints: number;
    color: string;
}

interface Outlet {
    id: string;
    name: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [memberTiers, setMemberTiers] = useState<MemberTier[]>([]);

    // Form state
    const [formName, setFormName] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchOutlets();
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [selectedOutletId, searchQuery]);

    const fetchOutlets = async () => {
        try {
            const res = await fetch("/api/outlets");
            if (res.ok) {
                const data = await res.json();
                setOutlets(data);
                if (data.length > 0) {
                    setSelectedOutletId(data[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch outlets:", error);
        }
    };

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedOutletId) params.set("outletId", selectedOutletId);
            if (searchQuery) params.set("search", searchQuery);

            const res = await fetch(`/api/customers?${params}`);
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            }

            // Also fetch tiers for the outlet
            if (selectedOutletId) {
                const tiersRes = await fetch(`/api/loyalty/tiers?outletId=${selectedOutletId}`);
                if (tiersRes.ok) {
                    const tiersData = await tiersRes.json();
                    setMemberTiers(tiersData);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormName(customer.name);
            setFormPhone(customer.phone || "");
            setFormEmail(customer.email || "");
        } else {
            setEditingCustomer(null);
            setFormName("");
            setFormPhone("");
            setFormEmail("");
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
    };

    const handleSave = async () => {
        if (!formName.trim() || !selectedOutletId) {
            alert("Nama member dan outlet harus diisi!");
            return;
        }

        setIsSaving(true);
        try {
            let response;
            if (editingCustomer) {
                response = await fetch(`/api/customers/${editingCustomer.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formName,
                        phone: formPhone,
                        email: formEmail,
                    }),
                });
            } else {
                response = await fetch("/api/customers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        outletId: selectedOutletId,
                        name: formName,
                        phone: formPhone,
                        email: formEmail,
                    }),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                alert(`Gagal menyimpan member: ${errorData.error || response.statusText}`);
                return;
            }

            fetchCustomers();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save customer:", error);
            alert("Terjadi kesalahan saat menyimpan member. Coba lagi.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus member ini?")) return;

        try {
            await fetch(`/api/customers/${id}`, { method: "DELETE" });
            fetchCustomers();
        } catch (error) {
            console.error("Failed to delete customer:", error);
        }
    };

    const formatCurrency = (value: string | number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(parseFloat(String(value)) || 0);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Pelanggan / Member
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Kelola database pelanggan dan poin loyalitas
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href="/dashboard/settings/loyalty"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
                    >
                        <Star className="h-4 w-4" />
                        Loyalty Settings
                    </a>
                    <button
                        onClick={() => handleOpenModal()}
                        disabled={!selectedOutletId}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600 disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Member
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none"
                >
                    <option value="">Semua Outlet</option>
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
                        placeholder="Cari nama atau no. telepon..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
            </div>

            {/* Customers Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                </div>
            ) : customers.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                    <p className="text-zinc-500">Belum ada member</p>
                    <button
                        onClick={() => handleOpenModal()}
                        disabled={!selectedOutletId}
                        className="mt-4 text-sm font-medium text-primary-600 hover:underline"
                    >
                        Tambah member pertama
                    </button>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Member
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 sm:table-cell">
                                    Kontak
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Poin
                                </th>
                                <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 md:table-cell">
                                    Total Belanja
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {customers.map((customer) => (
                                <tr
                                    key={customer.id}
                                    className="transition-colors hover:bg-zinc-50"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                                                <Users className="h-5 w-5 text-primary-600" />
                                            </div>
                                            <span className="font-medium text-zinc-900">
                                                {customer.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 sm:table-cell">
                                        <div className="space-y-1">
                                            {customer.phone && (
                                                <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    {customer.phone}
                                                </div>
                                            )}
                                            {customer.email && (
                                                <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    {customer.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-0.5 text-sm font-medium text-secondary-700">
                                                <Star className="h-3.5 w-3.5" />
                                                {customer.points} Poin
                                            </span>
                                            {customer.tierId && (
                                                <span
                                                    className="inline-flex w-fit items-center rounded px-2 py-0.5 text-xs font-bold uppercase"
                                                    style={{
                                                        backgroundColor: `${memberTiers.find(t => t.id === customer.tierId)?.color}20`,
                                                        color: memberTiers.find(t => t.id === customer.tierId)?.color || '#71717a'
                                                    }}
                                                >
                                                    {memberTiers.find(t => t.id === customer.tierId)?.name || 'Member'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 text-right font-medium text-zinc-900 md:table-cell">
                                        {formatCurrency(customer.totalSpent)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleOpenModal(customer)}
                                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900">
                                {editingCustomer ? "Edit Member" : "Tambah Member"}
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
                                    Nama Member *
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        No. Telepon
                                    </div>
                                </label>
                                <input
                                    type="tel"
                                    value={formPhone}
                                    onChange={(e) => setFormPhone(e.target.value)}
                                    placeholder="08123456789"
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </div>
                                </label>
                                <input
                                    type="email"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    placeholder="budi@email.com"
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

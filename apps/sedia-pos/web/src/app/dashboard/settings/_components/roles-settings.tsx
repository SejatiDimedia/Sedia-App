"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X, Shield } from "lucide-react";
import { getRoles, createRole, updateRole, deleteRole, type RoleInput } from "@/actions/roles";
import ConfirmationModal from "@/components/confirmation-modal";
import { toast } from "react-hot-toast";

// Define Permission Constants
// Define Permission Constants
const PERMISSIONS = [
    { id: "access_pos", label: "Akses POS (Kasir)" },
    { id: "manage_products", label: "Kelola Produk" },
    { id: "manage_inventory", label: "Kelola Inventaris (Stok)" },
    { id: "manage_stock_opname", label: "Kelola Stock Opname" },
    { id: "manage_suppliers", label: "Kelola Supplier" },
    { id: "manage_purchase_orders", label: "Kelola Purchase Order" },
    { id: "manage_customers", label: "Kelola Pelanggan" },
    { id: "manage_employees", label: "Kelola Karyawan" },
    { id: "view_reports", label: "Lihat Laporan" },
    { id: "manage_settings", label: "Pengaturan Toko" },
    { id: "manage_tax", label: "Kelola Pajak & Biaya" },
    { id: "manage_outlets", label: "Kelola Outlet" },
    // Granular Settings Permissions
    { id: "manage_store", label: "Kelola Info Toko" },
    { id: "manage_roles", label: "Kelola Role & Akses" },
    { id: "manage_loyalty", label: "Kelola Loyalty Program" },
    { id: "manage_backup", label: "Kelola Backup Data" },
    { id: "manage_expenses", label: "Kelola Pengeluaran" },
];



export default function RolesSettings() {
    const [roles, setRoles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);

    // Form State
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formPermissions, setFormPermissions] = useState<string[]>([]);
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

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        setIsLoading(true);
        try {
            // Fetch roles (assuming we show system roles + outlet roles)
            // For now, we might need an outletId context or just fetch all accessible roles
            const data = await getRoles();
            setRoles(data);
        } catch (error) {
            console.error("Failed to load roles", error);
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

    const handleOpenModal = (role?: any) => {
        if (role) {
            setEditingRole(role);
            setFormName(role.name);
            setFormDesc(role.description || "");
            try {
                setFormPermissions(JSON.parse(role.permissions));
            } catch {
                setFormPermissions([]);
            }
        } else {
            setEditingRole(null);
            setFormName("");
            setFormDesc("");
            setFormPermissions([]);
        }
        setShowModal(true);
    };

    const handleTogglePermission = (id: string) => {
        setFormPermissions(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!formName.trim()) return;
        setIsSaving(true);
        try {
            const payload: RoleInput = {
                name: formName,
                description: formDesc,
                permissions: formPermissions,
                // outletId: "..." // We need to inject current outletId if we want to scoping roles per outlet
                // For simplified "Sedia POS", maybe roles are global per Owner Account (all outlets share roles)?
                // Let's assume global for now or we need to get outletId from context.
            };

            if (editingRole) {
                await updateRole(editingRole.id, payload);
            } else {
                await createRole(payload);
            }
            await loadRoles();
            setShowModal(false);
            toast.success("Role berhasil disimpan");
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Gagal menyimpan role");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm({
            title: "Hapus Role",
            message: "Apakah Anda yakin ingin menghapus role ini? Karyawan yang menggunakan role ini perlu disesuaikan kembali.",
            variant: "danger",
            onConfirm: async () => {
                try {
                    const res = await deleteRole(id);
                    if (res.success) {
                        toast.success("Role berhasil dihapus");
                        await loadRoles();
                    } else {
                        toast.error(res.error || "Gagal menghapus role");
                    }
                } catch (error) {
                    console.error("Delete failed", error);
                    toast.error("Terjadi kesalahan sistem");
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-zinc-900">Management Role & Akses</h3>
                    <p className="text-sm text-zinc-500">Buat role custom untuk karyawan Anda</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary-500 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-secondary-600"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Role
                </button>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Role Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Akses / Permission</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {roles.map((role) => {
                                let perms: string[] = [];
                                try { perms = JSON.parse(role.permissions); } catch { }

                                return (
                                    <tr key={role.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-zinc-900">{role.name}</span>
                                                <span className="text-xs text-zinc-500">{role.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-md">
                                                {perms.slice(0, 3).map(p => (
                                                    <span key={p} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800">
                                                        {PERMISSIONS.find(perm => perm.id === p)?.label || p}
                                                    </span>
                                                ))}
                                                {perms.length > 3 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-500">
                                                        +{perms.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(role)}
                                                    className="text-zinc-400 hover:text-zinc-600"
                                                    title="Edit Role"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>

                                                {role.isSystem ? (
                                                    <button
                                                        disabled
                                                        className="text-zinc-200 cursor-not-allowed"
                                                        title="System role cannot be deleted"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDelete(role.id)}
                                                        className="text-red-400 hover:text-red-600"
                                                        title="Delete Role"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900">
                                {editingRole ? "Edit Role" : "Buat Role Baru"}
                            </h2>
                            <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-zinc-400" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">Nama Role</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 px-3 py-2"
                                    placeholder="Contoh: Senior Cashier"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">Deskripsi</label>
                                <input
                                    type="text"
                                    value={formDesc}
                                    onChange={e => setFormDesc(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 px-3 py-2"
                                    placeholder="Deskripsi singkat role ini"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-700">Hak Akses</label>
                                <div className="space-y-2 border rounded-lg p-3">
                                    {PERMISSIONS.map(perm => {
                                        const isChecked = formPermissions.includes(perm.id);
                                        return (
                                            <label key={perm.id} className="flex items-center gap-3 p-2 hover:bg-zinc-50 rounded cursor-pointer">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? "bg-primary-500 border-primary-500" : "border-zinc-300"}`}>
                                                    {isChecked && <Check className="h-3.5 w-3.5 text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={isChecked}
                                                    onChange={() => handleTogglePermission(perm.id)}
                                                />
                                                <span className="text-sm text-zinc-700">{perm.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium">Batal</button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !formName}
                                className="flex-1 rounded-lg bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                            >
                                {isSaving ? "Menyimpan..." : "Simpan Role"}
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

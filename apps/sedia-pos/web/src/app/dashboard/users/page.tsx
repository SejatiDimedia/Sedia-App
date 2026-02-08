"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    User,
    Pencil,
    Trash2,
    X,
    Shield,
    ShieldCheck,
    Mail,
    KeyRound,
    Crown,
    AlertTriangle,
    Store,
    Briefcase,
} from "lucide-react";
import {
    getUsers,
    createUser,
    updateUserRole,
    updateUser,
    deleteUser,
    getRoles,
    getOutlets,
    type UserWithPermission,
    type Role,
    type Outlet
} from "@/actions/users";
import ConfirmationModal from "@/components/confirmation-modal";

export default function UsersPage() {
    const [users, setUsers] = useState<UserWithPermission[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserWithPermission | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formPassword, setFormPassword] = useState("");
    const [formRole, setFormRole] = useState<"admin" | "user">("user");
    const [formEmployeeRole, setFormEmployeeRole] = useState("");
    const [formOutlet, setFormOutlet] = useState("");
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

    // Fetch users, roles, and outlets on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [usersRes, rolesRes, outletsRes] = await Promise.all([
                getUsers(),
                getRoles(),
                getOutlets()
            ]);

            if (usersRes.error) setError(usersRes.error);
            else if (usersRes.data) setUsers(usersRes.data);

            if (rolesRes.data) setRoles(rolesRes.data);
            if (outletsRes.data) setOutlets(outletsRes.data);

        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to refresh only users list
    const loadUsers = async () => {
        try {
            const result = await getUsers();
            if (result.data) setUsers(result.data);
        } catch (err) {
            console.error("Failed to refresh users:", err);
        }
    };

    const showConfirm = (config: Omit<typeof confirmState, "isOpen">) => {
        setConfirmState({ ...config, isOpen: true });
    };

    const handleConfirm = () => {
        confirmState.onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    const handleOpenModal = (user?: UserWithPermission) => {
        if (user) {
            setEditingUser(user);
            setFormName(user.name);
            setFormEmail(user.email);
            setFormPassword("");
            setFormRole(user.role as "admin" | "user");
            setFormEmployeeRole(user.employeeRoleId || "");
            setFormOutlet(user.outletId || "");
        } else {
            setEditingUser(null);
            setFormName("");
            setFormEmail("");
            setFormPassword("");
            setFormRole("user");
            setFormEmployeeRole("");
            setFormOutlet("");
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormName("");
        setFormEmail("");
        setFormPassword("");
        setFormRole("user");
        setFormEmployeeRole("");
        setFormOutlet("");
    };

    const handleSave = async () => {
        if (!formName.trim() || !formEmail.trim()) return;
        if (!editingUser && !formPassword.trim()) {
            alert("Password wajib diisi untuk user baru");
            return;
        }

        setIsSaving(true);
        try {
            if (editingUser) {
                // Update existing user
                const updates: { name?: string; password?: string; employeeRoleId?: string; outletId?: string } = {};
                if (formName !== editingUser.name) updates.name = formName;
                if (formPassword) updates.password = formPassword;

                // Only update role/outlet for non-admin users or if we strictly want to
                if (formRole === "user") {
                    if (formEmployeeRole !== editingUser.employeeRoleId) updates.employeeRoleId = formEmployeeRole;
                    if (formOutlet !== editingUser.outletId) updates.outletId = formOutlet;
                }

                if (Object.keys(updates).length > 0) {
                    const res = await updateUser(editingUser.id, updates);
                    if (res.error) {
                        alert(res.error);
                        setIsSaving(false);
                        return;
                    }
                }

                // Update role if changed
                if (formRole !== editingUser.role) {
                    const res = await updateUserRole(editingUser.id, formRole);
                    if (res.error) {
                        alert(res.error);
                        setIsSaving(false);
                        return;
                    }
                }

                await loadUsers();
                handleCloseModal();
            } else {
                // Create new user
                const res = await createUser({
                    name: formName,
                    email: formEmail,
                    password: formPassword,
                    role: formRole,
                    employeeRoleId: formRole === "user" ? formEmployeeRole : undefined,
                    outletId: formRole === "user" ? formOutlet : undefined,
                });

                if (res.error) {
                    alert(res.error);
                    setIsSaving(false);
                    return;
                }

                await loadUsers();
                handleCloseModal();
            }
        } catch (error) {
            console.error("Failed to save user:", error);
            alert("Terjadi kesalahan");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (user: UserWithPermission) => {
        showConfirm({
            title: "Hapus User",
            message: `Apakah Anda yakin ingin menghapus user "${user.name}"? Semua data terkait akan dihapus secara permanen.`,
            variant: "danger",
            onConfirm: async () => {
                try {
                    const res = await deleteUser(user.id);
                    if (res.error) {
                        alert(res.error);
                    } else {
                        await loadUsers();
                    }
                } catch (error) {
                    console.error("Failed to delete user:", error);
                }
            }
        });
    };

    const filteredUsers = users.filter((u) => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const adminCount = users.filter(u => u.role === "admin").length;
    const userCount = users.filter(u => u.role === "user").length;

    if (error === "Forbidden: Admin access required") {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertTriangle className="h-16 w-16 text-red-400 mb-4" />
                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Akses Ditolak</h1>
                <p className="text-zinc-500">Anda tidak memiliki akses ke halaman ini.</p>
                <p className="text-sm text-zinc-400 mt-1">Hanya Admin yang dapat mengelola user.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Manajemen User
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Kelola akun pengguna dan hak akses
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600"
                >
                    <Plus className="h-4 w-4" />
                    Tambah User
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-zinc-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-zinc-900">{users.length}</p>
                            <p className="text-xs text-zinc-500">Total User</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Crown className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-zinc-900">{adminCount}</p>
                            <p className="text-xs text-zinc-500">Admin</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-zinc-900">{userCount}</p>
                            <p className="text-xs text-zinc-500">User Biasa</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Cari user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none"
                >
                    <option value="all">Semua Role</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>
            </div>

            {/* Users List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                </div>
            ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 py-12 text-center">
                    <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-400" />
                    <p className="text-red-600">{error}</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
                    <User className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                    <p className="text-zinc-500">Tidak ada user ditemukan</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    User
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Role
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Bergabung
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {filteredUsers.map((u) => (
                                <tr
                                    key={u.id}
                                    className="transition-colors hover:bg-zinc-50"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${u.role === "admin" ? "bg-purple-100" : "bg-primary-100"}`}>
                                                {u.role === "admin" ? (
                                                    <Crown className="h-5 w-5 text-purple-600" />
                                                ) : (
                                                    <User className="h-5 w-5 text-primary-600" />
                                                )}
                                            </div>
                                            <span className="font-medium text-zinc-900">
                                                {u.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-zinc-600">{u.email}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === "admin"
                                                ? "bg-purple-100 text-purple-700"
                                                : "bg-blue-100 text-blue-700"
                                                }`}
                                        >
                                            {u.role === "admin" ? (
                                                <ShieldCheck className="h-3 w-3" />
                                            ) : (
                                                <Shield className="h-3 w-3" />
                                            )}
                                            {u.role === "admin" ? "Admin" : "User"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-sm text-zinc-500">
                                            {new Date(u.createdAt).toLocaleDateString("id-ID")}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleOpenModal(u)}
                                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u)}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-950/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-primary-100/50">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">
                                    {editingUser ? "Edit User" : "Tambah User Baru"}
                                </h3>
                                <p className="text-sm text-zinc-500">
                                    {editingUser ? "Perbarui informasi user" : "Buat akun user baru"}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 uppercase">
                                    Nama
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="Nama lengkap"
                                        className="w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 uppercase">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <input
                                        type="email"
                                        value={formEmail}
                                        onChange={(e) => setFormEmail(e.target.value)}
                                        placeholder="email@contoh.com"
                                        disabled={!!editingUser}
                                        className="w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-zinc-100 disabled:text-zinc-500"
                                    />
                                </div>
                                {editingUser && (
                                    <p className="text-xs text-zinc-400 mt-1">Email tidak dapat diubah</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 uppercase">
                                    Password {editingUser && <span className="text-zinc-400 font-normal">(kosongkan jika tidak ingin mengubah)</span>}
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <input
                                        type="password"
                                        value={formPassword}
                                        onChange={(e) => setFormPassword(e.target.value)}
                                        placeholder={editingUser ? "••••••••" : "Minimal 8 karakter"}
                                        className="w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-zinc-700 uppercase">
                                    Role
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormRole("user")}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${formRole === "user"
                                            ? "bg-blue-50 border-blue-500 text-blue-700"
                                            : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                            }`}
                                    >
                                        <Shield className="h-5 w-5" />
                                        <div className="text-left">
                                            <p className="font-medium">User</p>
                                            <p className="text-xs opacity-70">Akses terbatas</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormRole("admin")}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${formRole === "admin"
                                            ? "bg-purple-50 border-purple-500 text-purple-700"
                                            : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                            }`}
                                    >
                                        <Crown className="h-5 w-5" />
                                        <div className="text-left">
                                            <p className="font-medium">Admin</p>
                                            <p className="text-xs opacity-70">Akses penuh</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Additional fields for non-admin users */}
                            {formRole === "user" && (
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-zinc-700 uppercase">
                                            Posisi / Jabatan
                                        </label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                            <select
                                                value={formEmployeeRole}
                                                onChange={(e) => setFormEmployeeRole(e.target.value)}
                                                className="w-full appearance-none rounded-lg border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                            >
                                                <option value="">Pilih Posisi</option>
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-zinc-700 uppercase">
                                            Outlet
                                        </label>
                                        <div className="relative">
                                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                            <select
                                                value={formOutlet}
                                                onChange={(e) => setFormOutlet(e.target.value)}
                                                className="w-full appearance-none rounded-lg border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                            >
                                                <option value="">Pilih Outlet</option>
                                                {outlets.map((outlet) => (
                                                    <option key={outlet.id} value={outlet.id}>
                                                        {outlet.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 border-t border-zinc-200 bg-zinc-50 rounded-b-2xl">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-700 border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !formName.trim() || !formEmail.trim() || (!editingUser && !formPassword.trim())}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {isSaving ? "Menyimpan..." : (editingUser ? "Simpan Perubahan" : "Tambah User")}
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

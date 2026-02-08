"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    User,
    Pencil,
    Trash2,
    X,
    KeyRound,
    Shield,
    ShieldCheck,
} from "lucide-react";
import { getOutlets } from "@/actions/outlets";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, type EmployeeInput } from "@/actions/employees";
import { getRoles } from "@/actions/roles";
import ConfirmationModal from "@/components/confirmation-modal";

// Define correct types corresponding to DB schema return
interface Employee {
    id: string;
    outletId: string;
    name: string;
    role: "manager" | "cashier" | string;
    roleId?: string | null;
    roleData?: { name: string; permissions: string } | null; // Joined role data
    isActive: boolean;
    pinCode: string | null;
    createdAt: Date;
}

interface Outlet {
    id: string;
    name: string;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [availableRoles, setAvailableRoles] = useState<any[]>([]);

    // Form state
    const [formName, setFormName] = useState("");
    const [formRole, setFormRole] = useState("cashier"); // Keep for backward compatibility or simple UI
    const [formRoleId, setFormRoleId] = useState<string>(""); // For dynamic role
    const [formPin, setFormPin] = useState("");
    // Auth fields
    const [formEmail, setFormEmail] = useState("");
    const [formPassword, setFormPassword] = useState("");
    const [formIsActive, setFormIsActive] = useState(true);
    // Multi-outlet selection
    const [formOutletIds, setFormOutletIds] = useState<string[]>([]);
    const [formPrimaryOutletId, setFormPrimaryOutletId] = useState<string>("");

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "outlets" | "security">("general");
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

                // Load roles
                const rolesData = await getRoles();
                setAvailableRoles(rolesData);
            } catch (error) {
                console.error("Failed to fetch outlets/roles:", error);
            }
        };
        loadOutlets();
    }, []);

    // Fetch employees and roles when outlet changes
    useEffect(() => {
        const loadData = async () => {
            if (!selectedOutletId) return;
            setIsLoading(true);
            try {
                const [empData, rolesData] = await Promise.all([
                    getEmployees(selectedOutletId),
                    getRoles(selectedOutletId)
                ]);
                setEmployees(empData as unknown as Employee[]);
                setAvailableRoles(rolesData);
            } catch (error) {
                console.error("Failed to fetch employees/roles:", error);
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

    const handleOpenModal = (employee?: Employee) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormName(employee.name);
            setFormRole(employee.role);
            setFormRoleId(employee.roleId || "");
            setFormPin(employee.pinCode || "");
            setFormEmail("");
            setFormPassword("");
            setFormIsActive(employee.isActive);
            // Get outlet assignments from employeeOutlets
            const empOutlets = (employee as any).employeeOutlets || [];
            const outletIds = empOutlets.length > 0
                ? empOutlets.map((eo: any) => eo.outletId || eo.outlet?.id).filter(Boolean)
                : [employee.outletId].filter(Boolean);
            setFormOutletIds(outletIds);
            const primary = empOutlets.find((eo: any) => eo.isPrimary);
            setFormPrimaryOutletId(primary?.outletId || primary?.outlet?.id || outletIds[0] || "");
        } else {
            setEditingEmployee(null);
            setFormName("");
            setFormRole("cashier");
            setFormRoleId("");
            setFormPin("");
            setFormEmail("");
            setFormPassword("");
            setFormIsActive(true);
            // Default to current selected outlet
            setFormOutletIds(selectedOutletId ? [selectedOutletId] : []);
            setFormPrimaryOutletId(selectedOutletId || "");
        }
        setShowModal(true);
        setActiveTab("general");
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingEmployee(null);
        setFormName("");
        setFormRole("cashier");
        setFormRoleId("");
        setFormPin("");
        setFormEmail("");
        setFormPassword("");
        setFormIsActive(true);
        setFormOutletIds([]);
        setFormPrimaryOutletId("");
    };

    const handleSave = async () => {
        if (!formName.trim()) return;
        if (formOutletIds.length === 0) {
            alert("Pilih minimal satu outlet untuk karyawan ini.");
            return;
        }

        setIsSaving(true);
        try {
            const employeeData: EmployeeInput = {
                outletIds: formOutletIds,
                primaryOutletId: formPrimaryOutletId || formOutletIds[0],
                name: formName,
                role: formRole as "manager" | "cashier",
                roleId: formRoleId || undefined,
                pinCode: formPin || null,
                email: formEmail || undefined,
                password: formPassword || undefined,
                isActive: formIsActive,
            };

            if (editingEmployee) {
                const res = await updateEmployee(editingEmployee.id, employeeData);
                if (res.success) {
                    // Refresh local state or refetch
                    const updatedData = await getEmployees(selectedOutletId);
                    setEmployees(updatedData as unknown as Employee[]);
                    handleCloseModal();
                } else {
                    alert("Gagal mengupdate karyawan" + (res.error ? ": " + res.error : ""));
                }
            } else {
                const res = await createEmployee(employeeData);
                if (res.success) {
                    // Refresh
                    const updatedData = await getEmployees(selectedOutletId);
                    setEmployees(updatedData as unknown as Employee[]);
                    handleCloseModal();
                } else {
                    alert("Gagal menambahkan karyawan" + (res.error ? ": " + res.error : ""));
                }
            }
        } catch (error) {
            console.error("Failed to save employee:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm({
            title: "Hapus Karyawan",
            message: "Apakah Anda yakin ingin menghapus karyawan ini? Data karyawan akan dihapus secara permanen.",
            variant: "danger",
            onConfirm: async () => {
                try {
                    const res = await deleteEmployee(id);
                    if (res.success) {
                        const updatedData = await getEmployees(selectedOutletId);
                        setEmployees(updatedData as unknown as Employee[]);
                    } else {
                        alert("Gagal menghapus karyawan");
                    }
                } catch (error) {
                    console.error("Failed to delete employee:", error);
                }
            }
        });
    };

    const filteredEmployees = employees.filter((emp) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "manager":
                return <ShieldCheck className="h-4 w-4" />;
            default:
                return <Shield className="h-4 w-4" />;
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case "manager":
                return "bg-purple-100 text-purple-700";
            default:
                return "bg-blue-100 text-blue-700";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Karyawan
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Kelola karyawan dan akses PIN per outlet
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    disabled={!selectedOutletId}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Karyawan
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
                        placeholder="Cari karyawan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
            </div>

            {/* Employees List */}
            {outlets.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
                    <User className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                    <p className="text-zinc-500">Anda belum memiliki Outlet.</p>
                    <p className="text-sm text-zinc-400">Silakan buat outlet terlebih dahulu di menu Outlet.</p>
                </div>
            ) : !selectedOutletId ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
                    <User className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                    <p className="text-zinc-500">Pilih outlet untuk melihat karyawan</p>
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
                    <User className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                    <p className="text-zinc-500">Belum ada karyawan di outlet ini</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 text-sm font-medium text-primary-600 hover:underline"
                    >
                        Tambah karyawan pertama
                    </button>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Nama
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Role
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {filteredEmployees.map((employee) => (
                                <tr
                                    key={employee.id}
                                    className="transition-colors hover:bg-zinc-50"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                                                <User className="h-5 w-5 text-primary-600" />
                                            </div>
                                            <span className="font-medium text-zinc-900">
                                                {employee.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                // If dynamic role exists, use generic badge or check permissions?
                                                // For now, simple logic
                                                "bg-zinc-100 text-zinc-700"
                                                }`}
                                        >
                                            <Shield className="h-3 w-3" />
                                            {/* Access roleData object from schema renamed relation */}
                                            {employee.roleData?.name || employee.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${employee.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {employee.isActive ? "Aktif" : "Nonaktif"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleOpenModal(employee)}
                                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(employee.id)}
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

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-950/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-4xl h-[600px] rounded-[32px] bg-white shadow-2xl border border-primary-100/50 flex overflow-hidden ring-1 ring-primary-500/10">
                        {/* Sidebar */}
                        <div className="w-64 bg-primary-50/30 border-r border-primary-50 p-6 flex flex-col justify-between">
                            <div>
                                <div className="mb-8 pl-2">
                                    <h2 className="text-sm font-black text-primary-950 uppercase tracking-widest mb-1">Pengaturan</h2>
                                    <p className="text-[10px] text-primary-600 font-bold">Kelola data & akses staf</p>
                                </div>

                                <div className="space-y-1.5">
                                    {[
                                        { id: "general", label: "Profil Umum", icon: User },
                                        { id: "outlets", label: "Akses Outlet", icon: Shield },
                                        { id: "security", label: "Dashboard & PIN", icon: KeyRound },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[20px] text-sm font-black transition-all ${activeTab === tab.id
                                                    ? "bg-white text-primary-600 shadow-sm ring-1 ring-primary-100/50"
                                                    : "text-primary-400 hover:text-primary-600 hover:bg-white/50"
                                                }`}
                                        >
                                            <tab.icon className="h-4 w-4" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleCloseModal}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-primary-400 hover:bg-red-50 hover:text-red-500 transition-all group"
                            >
                                <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
                                Tutup
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col bg-white">
                            <div className="p-8 border-b border-primary-50/50 flex items-center justify-between bg-white">
                                <div>
                                    <h3 className="text-xl font-black text-primary-950 tracking-tight">
                                        {editingEmployee ? "Edit Informasi Staf" : "Tambah Staf Baru"}
                                    </h3>
                                    <p className="text-xs text-primary-500 font-medium mt-1">
                                        Lengkapi data berikut untuk melanjutkan proses simpan
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-full border border-primary-100">
                                    <div className={`h-2 w-2 rounded-full ${formIsActive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">
                                        {formIsActive ? 'Status: Aktif' : 'Status: Nonaktif'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {activeTab === "general" && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="mb-2 block text-[10px] font-black text-primary-900 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="h-1 w-1 rounded-full bg-primary-500" />
                                                    Nama Lengkap Staf
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formName}
                                                    onChange={(e) => setFormName(e.target.value)}
                                                    placeholder="Masukkan nama sesuai ID..."
                                                    className="w-full rounded-2xl border border-primary-100 bg-primary-50/20 px-5 py-4 text-sm text-primary-950 placeholder:text-primary-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-bold"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-3 block text-[10px] font-black text-primary-900 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="h-1 w-1 rounded-full bg-primary-500" />
                                                    Role / Jabatan Pekerjaan
                                                </label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {(availableRoles.length > 0 ? availableRoles : [{ id: "cashier", name: "Kasir" }, { id: "manager", name: "Manager" }]).map((role: any) => {
                                                        const isSelected = formRoleId === role.id || (availableRoles.length === 0 && formRole === role.id);
                                                        return (
                                                            <button
                                                                key={role.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (availableRoles.length > 0) {
                                                                        setFormRoleId(role.id);
                                                                        setFormRole(role.name);
                                                                    } else {
                                                                        setFormRole(role.id);
                                                                        setFormRoleId("");
                                                                    }
                                                                }}
                                                                className={`group relative flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all ${isSelected
                                                                        ? "bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-500/20"
                                                                        : "bg-white border-primary-50 text-primary-400 hover:border-primary-300 hover:text-primary-600"
                                                                    }`}
                                                            >
                                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-white/50 bg-white' : 'border-primary-100 bg-primary-50 group-hover:bg-primary-100'}`}>
                                                                    {isSelected && <div className="h-2 w-2 rounded-full bg-primary-600" />}
                                                                </div>
                                                                <span className="text-sm font-black uppercase tracking-wide">{role.name}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {editingEmployee && (
                                                <div className="pt-8 border-t border-primary-50">
                                                    <div className="flex items-center justify-between bg-primary-50/30 p-5 rounded-2xl border border-primary-50">
                                                        <div>
                                                            <h4 className="text-xs font-black text-primary-950 uppercase tracking-widest">Aksesibilitas User</h4>
                                                            <p className="text-[10px] text-primary-500 font-bold mt-1">Aktifkan untuk memberikan akses ke aplikasi</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setFormIsActive(!formIsActive)}
                                                            className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-300 ${formIsActive ? "bg-primary-600 shadow-lg shadow-primary-500/30" : "bg-primary-200"}`}
                                                        >
                                                            <span className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formIsActive ? "translate-x-8" : "translate-x-1"}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "outlets" && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="bg-primary-50/20 p-8 rounded-[32px] border border-primary-50">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="h-12 w-12 rounded-[20px] bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                                    <Shield className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-primary-950 uppercase tracking-wide">Alokasi Wilayah Cabang</h4>
                                                    <p className="text-[10px] text-primary-500 font-bold">Staf dapat login di cabang yang terdaftar di bawah ini</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {outlets.map((outlet) => {
                                                    const isChecked = formOutletIds.includes(outlet.id);
                                                    const isPrimary = formPrimaryOutletId === outlet.id;
                                                    return (
                                                        <label
                                                            key={outlet.id}
                                                            className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${isChecked
                                                                    ? "bg-white border-primary-600 shadow-md ring-1 ring-primary-50"
                                                                    : "bg-white border-primary-50 hover:border-primary-200"
                                                                }`}
                                                        >
                                                            <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-primary-600 border-primary-600 scale-110' : 'bg-primary-50 border-primary-100 group-hover:bg-primary-100'}`}>
                                                                {isChecked && <Plus className="h-4 w-4 text-white rotate-45" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setFormOutletIds([...formOutletIds, outlet.id]);
                                                                        if (formOutletIds.length === 0) setFormPrimaryOutletId(outlet.id);
                                                                    } else {
                                                                        const newIds = formOutletIds.filter(id => id !== outlet.id);
                                                                        setFormOutletIds(newIds);
                                                                        if (formPrimaryOutletId === outlet.id && newIds.length > 0) setFormPrimaryOutletId(newIds[0]);
                                                                    }
                                                                }}
                                                            />
                                                            <div className="flex-1">
                                                                <span className={`text-sm font-black ${isChecked ? "text-primary-950" : "text-primary-400 group-hover:text-primary-600"}`}>{outlet.name}</span>
                                                                {isPrimary && (
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <div className="h-1 w-1 rounded-full bg-secondary-500" />
                                                                        <span className="text-[8px] font-black text-secondary-500 uppercase tracking-widest">Primary Outlet</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {isChecked && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setFormPrimaryOutletId(outlet.id);
                                                                    }}
                                                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPrimary
                                                                            ? "bg-secondary-500 text-primary-950 shadow-lg shadow-secondary-500/20"
                                                                            : "bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white"
                                                                        }`}
                                                                >
                                                                    {isPrimary ? "UTAMA" : "SET UTAMA"}
                                                                </button>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "security" && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        {/* Dashboard Access */}
                                        <div className="bg-white p-8 rounded-[32px] border-2 border-secondary-100 shadow-xl shadow-secondary-500/5 space-y-8 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4">
                                                <ShieldCheck className="h-24 w-24 text-secondary-500/5 -mr-8 -mt-8" />
                                            </div>

                                            <div className="flex items-center gap-4 relative">
                                                <div className="h-12 w-12 rounded-[20px] bg-secondary-500 flex items-center justify-center shadow-lg shadow-secondary-500/20">
                                                    <User className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-primary-950 uppercase tracking-wide">Kredensial Dashboard</h4>
                                                    <p className="text-[10px] text-primary-500 font-bold">Email & Password untuk masuk ke Web POS</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 relative">
                                                <div className="col-span-2 md:col-span-1">
                                                    <label className="mb-2 block text-[10px] font-black text-secondary-900 uppercase tracking-widest">E-mail Address</label>
                                                    <input
                                                        type="email"
                                                        value={formEmail}
                                                        onChange={(e) => setFormEmail(e.target.value)}
                                                        placeholder="contoh@sedia.pos"
                                                        className="w-full rounded-2xl border border-secondary-100 bg-secondary-50/30 px-5 py-4 text-sm text-primary-950 focus:border-secondary-500 focus:outline-none focus:ring-4 focus:ring-secondary-500/10 transition-all font-bold"
                                                    />
                                                </div>
                                                <div className="col-span-2 md:col-span-1">
                                                    <label className="mb-2 block text-[10px] font-black text-secondary-900 uppercase tracking-widest">User Password</label>
                                                    <input
                                                        type="password"
                                                        value={formPassword}
                                                        onChange={(e) => setFormPassword(e.target.value)}
                                                        placeholder="••••••••"
                                                        className="w-full rounded-2xl border border-secondary-100 bg-secondary-50/30 px-5 py-4 text-sm text-primary-950 focus:border-secondary-500 focus:outline-none focus:ring-4 focus:ring-secondary-500/10 transition-all font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* PIN Access */}
                                        <div className="bg-primary-950 p-8 rounded-[32px] shadow-2xl space-y-8 relative overflow-hidden">
                                            <div className="absolute bottom-0 right-0 p-4 opacity-10">
                                                <KeyRound className="h-32 w-32 text-white" />
                                            </div>

                                            <div className="flex items-center gap-4 relative">
                                                <div className="h-12 w-12 rounded-[20px] bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                                    <KeyRound className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-white uppercase tracking-wide">PIN Aplikasi Kasir</h4>
                                                    <p className="text-[10px] text-primary-300 font-bold italic">Wajib: 4-6 digit angka untuk verifikasi cepat</p>
                                                </div>
                                            </div>

                                            <div className="flex justify-center relative py-4">
                                                <input
                                                    type="password"
                                                    value={formPin}
                                                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    placeholder="0000"
                                                    maxLength={6}
                                                    className="w-full max-w-[280px] text-center text-4xl tracking-[0.8em] rounded-[24px] border-2 border-primary-800 bg-primary-900/50 py-6 text-secondary-500 focus:border-secondary-500 focus:outline-none transition-all font-black placeholder:text-primary-800"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer */}
                            <div className="p-8 border-t border-primary-50 bg-primary-50/20 flex gap-4 backdrop-blur-sm">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-8 py-4 rounded-2xl text-xs font-black text-primary-600 uppercase tracking-widest border-2 border-primary-100 bg-white hover:bg-primary-50 hover:border-primary-200 transition-all active:scale-95"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !formName.trim()}
                                    className="flex-1 px-8 py-4 rounded-2xl text-xs font-black text-primary-950 uppercase tracking-widest bg-secondary-500 hover:bg-secondary-600 shadow-xl shadow-secondary-500/30 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                                >
                                    {isSaving ? "Sinkronisasi Data..." : (editingEmployee ? "Simpan Perubahan Staf" : "Konfirmasi & Daftarkan Staf")}
                                </button>
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

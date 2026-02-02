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

    // Fetch employees when outlet changes
    useEffect(() => {
        const loadEmployees = async () => {
            if (!selectedOutletId) return;
            setIsLoading(true);
            try {
                const data = await getEmployees(selectedOutletId);
                // Convert dates if needed, but Server Actions usually return JSON-serializable
                // Drizzle returns Date objects, Next.js Actions serialize them. 
                // We'll cast to Employee[]
                setEmployees(data as unknown as Employee[]);
            } catch (error) {
                console.error("Failed to fetch employees:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadEmployees();
    }, [selectedOutletId]);

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
        if (!confirm("Yakin ingin menghapus karyawan ini?")) return;

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
                                            {/* Access role object from 'with: { role: true }' mapped as 'roleData'? 
                                                Actually getEmployees returns { ...employee, role: { ... } }
                                                But we need to verify how Drizzle returns 'role' property vs our 'role' string column.
                                                Drizzle usually overwrites or nests.
                                                In our schema 'employees' has 'role' column. Relation is 'role'.
                                                Drizzle query result will have 'role' property as the Relation object, masking the column?
                                                Or 'role' column value?
                                                Actually, if property name collides, Drizzle might behave differently.
                                                Let's assume 'role' property is the OBJECT if using `with: { role: true }`.
                                                Wait, if I have `role` column and `role` relation, Drizzle might complain or shadow.
                                                I named relation `role` in schema? No, I named it `role` in `employeesRelations`.
                                                Ideally I should rename relation to `roleData`.
                                                Let's assume for now we use `employee.role` as the object if populated, checks validity.
                                            */}
                                            {(employee as any).role?.name || employee.role}
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900">
                                {editingEmployee ? "Edit Karyawan" : "Tambah Karyawan"}
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
                                    Nama Karyawan *
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Contoh: Ahmad Kasir"
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>

                            {/* Outlet Assignment */}
                            <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 space-y-3">
                                <h3 className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-blue-600" />
                                    Assign ke Outlet *
                                </h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {outlets.map((outlet) => (
                                        <label key={outlet.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formOutletIds.includes(outlet.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormOutletIds([...formOutletIds, outlet.id]);
                                                        if (formOutletIds.length === 0) {
                                                            setFormPrimaryOutletId(outlet.id);
                                                        }
                                                    } else {
                                                        const newIds = formOutletIds.filter(id => id !== outlet.id);
                                                        setFormOutletIds(newIds);
                                                        if (formPrimaryOutletId === outlet.id && newIds.length > 0) {
                                                            setFormPrimaryOutletId(newIds[0]);
                                                        }
                                                    }
                                                }}
                                                className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-zinc-700 flex-1">{outlet.name}</span>
                                            {formOutletIds.includes(outlet.id) && formOutletIds.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setFormPrimaryOutletId(outlet.id);
                                                    }}
                                                    className={`text-xs px-2 py-0.5 rounded ${formPrimaryOutletId === outlet.id
                                                            ? "bg-primary-500 text-white"
                                                            : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                                                        }`}
                                                >
                                                    {formPrimaryOutletId === outlet.id ? "Utama" : "Set Utama"}
                                                </button>
                                            )}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-500">
                                    Pilih satu atau lebih outlet untuk karyawan ini.
                                </p>
                            </div>

                            {/* Auth Fields - Show for ALL (Create & Edit) now */}
                            <div className="rounded-lg bg-zinc-50 p-4 border border-zinc-100 space-y-4">
                                <h3 className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-secondary-600" />
                                    Akses Login {editingEmployee && "(Opsional)"}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                            Email Login
                                        </label>
                                        <input
                                            type="email"
                                            value={formEmail}
                                            onChange={(e) => setFormEmail(e.target.value)}
                                            placeholder={editingEmployee ? "Masukan email baru untuk mengubah" : "email@karyawan.com"}
                                            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                            Password Login
                                        </label>
                                        <input
                                            type="password"
                                            value={formPassword}
                                            onChange={(e) => setFormPassword(e.target.value)}
                                            placeholder={editingEmployee ? "Kosongkan jika tidak ingin mengubah password" : "******"}
                                            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        />
                                        {editingEmployee && (
                                            <p className="mt-1 text-xs text-zinc-500 italic">
                                                *Note: Biarkan kosong jika tidak ingin mereset password user ini.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                    Role / Jabatan
                                </label>
                                {availableRoles.length > 0 ? (
                                    <select
                                        value={formRoleId}
                                        onChange={(e) => setFormRoleId(e.target.value)}
                                        className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none"
                                    >
                                        <option value="">Pilih Role...</option>
                                        {availableRoles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        value={formRole}
                                        onChange={(e) => setFormRole(e.target.value)}
                                        className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none"
                                    >
                                        <option value="cashier">Kasir</option>
                                        <option value="manager">Manager</option>
                                    </select>
                                )}
                                <p className="mt-1 text-xs text-zinc-500">
                                    Kelola role custom di menu Pengaturan
                                </p>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                    <div className="flex items-center gap-2">
                                        <KeyRound className="h-4 w-4" />
                                        PIN (4-6 digit)
                                    </div>
                                </label>
                                <input
                                    type="password"
                                    value={formPin}
                                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder={editingEmployee ? "Kosongkan jika tidak diubah" : "Contoh: 1234"}
                                    maxLength={6}
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                                <p className="mt-1 text-xs text-zinc-500">
                                    PIN digunakan untuk login cekat di aplikasi kasir
                                </p>
                            </div>

                            {/* Status Toggle (Only for Edit) */}
                            {editingEmployee && (
                                <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-zinc-900">Status Karyawan</h4>
                                        <p className="text-xs text-zinc-500">Nonaktifkan untuk mencegah login</p>
                                    </div>
                                    <button
                                        onClick={() => setFormIsActive(!formIsActive)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${formIsActive ? "bg-green-500" : "bg-zinc-200"
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formIsActive ? "translate-x-6" : "translate-x-1"
                                                }`}
                                        />
                                    </button>
                                </div>
                            )}
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

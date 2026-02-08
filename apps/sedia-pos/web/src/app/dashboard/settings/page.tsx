"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Settings,
    Store,
    Palette,
    Bell,
    Shield,
    CreditCard,
    Printer,
    ChevronRight,
    Users,
    Star,
    Database,
    User,
    Lock,
    Eye,
    EyeOff,
    Save,
    Mail,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

import RolesSettings from "./_components/roles-settings";
import PaymentSettings from "./_components/payment-settings";
import BackupRestoreSettings from "./_components/backup-restore-settings";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useEffect } from "react";
import { useOutlet } from "@/providers/outlet-provider";

const settingsSections = [
    {
        id: "account",
        icon: Shield,
        title: "Akun Saya",
        description: "Email, password, dan profil",
    },
    {
        id: "store",
        icon: Store,
        title: "Informasi Toko",
        description: "Nama toko, alamat, dan kontak",
    },
    {
        id: "theme",
        icon: Palette,
        title: "Tampilan & Tema",
        description: "Warna, mode gelap, dan bahasa",
    },
    {
        id: "notifications",
        icon: Bell,
        title: "Notifikasi",
        description: "Pengaturan alert dan reminder",
    },
    {
        id: "security",
        icon: Shield,
        title: "Keamanan",
        description: "Password, 2FA, dan akses",
    },
    {
        id: "roles",
        icon: Users,
        title: "Role & Akses",
        description: "Kelola hak akses karyawan",
    },
    {
        id: "loyalty",
        icon: Star,
        title: "Program Loyalitas",
        description: "Tier member, poin & diskon",
        href: "/dashboard/settings/loyalty",
    },
    {
        id: "payment",
        icon: CreditCard,
        title: "Metode Pembayaran",
        description: "QRIS, Bank, dan e-Wallet",
    },
    {
        id: "printer",
        icon: Printer,
        title: "Printer & Struk",
        description: "Koneksi printer thermal",
    },
    {
        id: "backup",
        icon: Database,
        title: "Backup & Pemulihan",
        description: "Ekspor, impor, dan cloud backup",
    },
];


export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState("account");
    const [permissions, setPermissions] = useState<string[]>([]);
    const [role, setRole] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setPermissions(data.user.permissions || []);
                        setRole((data.user.role || "").toLowerCase());
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const filteredSections = settingsSections.filter(section => {
        // 1. Admin/Owner/Manager sees everything
        if (role === "admin" || role === "owner" || role === "manager") return true;

        // 2. Public Sections (Visual, Notifications, Security, Printer)
        const publicSections = ["theme", "notifications", "security", "printer"];
        if (publicSections.includes(section.id)) return true;

        // 3. Permission Checks
        const permissionMap: Record<string, string> = {
            "store": "manage_store",
            "roles": "manage_roles",
            "loyalty": "manage_loyalty",
            "backup": "manage_backup",
        };

        const requiredPerm = permissionMap[section.id];
        if (requiredPerm) {
            return permissions.includes(requiredPerm);
        }

        return false;
    });

    // Reset active section if it disappears
    useEffect(() => {
        if (!isLoading && filteredSections.length > 0) {
            const currentExists = filteredSections.find(s => s.id === activeSection);
            if (!currentExists) {
                setActiveSection(filteredSections[0].id);
            }
        }
    }, [filteredSections, isLoading, activeSection]);

    if (isLoading) {
        return <div className="p-8 text-center text-zinc-500">Memuat pengaturan...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">
                    Pengaturan
                </h1>
                <p className="text-sm text-zinc-500">
                    Kelola preferensi dan konfigurasi toko
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Settings Navigation */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-zinc-200 bg-white">
                        {filteredSections.map((section) => {
                            const isLink = 'href' in section && (section as any).href;
                            const itemClass = `flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-3 text-left transition-colors last:border-0 ${activeSection === section.id ? "bg-primary-50" : "hover:bg-zinc-50"}`;

                            const content = (
                                <>
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${activeSection === section.id ? "bg-primary-500 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                                        <section.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${activeSection === section.id ? "text-primary-600" : "text-zinc-900"}`}>
                                            {section.title}
                                        </p>
                                        <p className="text-xs text-zinc-500">{section.description}</p>
                                    </div>
                                    <ChevronRight className={`h-4 w-4 ${activeSection === section.id ? "text-primary-500" : "text-zinc-300"}`} />
                                </>
                            );

                            if (isLink) {
                                return (
                                    <Link key={section.id} href={(section as any).href} className={itemClass}>
                                        {content}
                                    </Link>
                                );
                            }

                            return (
                                <button key={section.id} onClick={() => setActiveSection(section.id)} className={itemClass}>
                                    {content}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-zinc-200 bg-white p-6">
                        {activeSection === "account" && <AccountSettings />}
                        {activeSection === "store" && <StoreSettings />}
                        {activeSection === "theme" && <ThemeSettings />}
                        {activeSection === "roles" && <RolesSettings />}
                        {activeSection === "payment" && <PaymentSettings />}
                        {activeSection === "backup" && <BackupRestoreSettings />}
                        {activeSection !== "account" && activeSection !== "store" && activeSection !== "theme" && activeSection !== "roles" && activeSection !== "payment" && activeSection !== "backup" && (
                            <div className="flex h-64 items-center justify-center">
                                <div className="text-center">
                                    <Settings className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                                    <p className="text-sm text-zinc-500">
                                        Fitur ini akan segera tersedia
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AccountSettings() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Profile form
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Load current user data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setName(data.user.name || "");
                        setEmail(data.user.email || "");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/settings/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
                toast.success("Profil berhasil diperbarui!");
            } else {
                setMessage({ type: "error", text: data.error || "Gagal memperbarui profil" });
            }
        } catch {
            setMessage({ type: "error", text: "Terjadi kesalahan" });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Password baru tidak cocok" });
            setLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setMessage({ type: "error", text: "Password minimal 8 karakter" });
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/settings/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: "Password berhasil diperbarui!" });
                toast.success("Password berhasil diperbarui!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: "error", text: data.error || "Gagal memperbarui password" });
            }
        } catch {
            setMessage({ type: "error", text: "Terjadi kesalahan" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-zinc-900">Akun Saya</h3>
                <p className="text-sm text-zinc-500">Kelola informasi profil dan keamanan akun Anda</p>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === "success"
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                    {message.type === "success" ? (
                        <CheckCircle className="h-5 w-5 shrink-0" />
                    ) : (
                        <AlertCircle className="h-5 w-5 shrink-0" />
                    )}
                    <span className="text-sm">{message.text}</span>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Profile Section */}
                <div className="space-y-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-zinc-600" />
                        <h4 className="font-medium text-zinc-900">Profil</h4>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                placeholder="Masukkan nama lengkap"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                                <Mail className="h-4 w-4 inline mr-1" />
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                placeholder="email@perusahaan.com"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-500 transition-colors disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            Simpan Profil
                        </button>
                    </form>
                </div>

                {/* Password Section */}
                <div className="space-y-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="h-5 w-5 text-zinc-600" />
                        <h4 className="font-medium text-zinc-900">Keamanan</h4>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                                Password Saat Ini
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 pr-10 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                                Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 pr-10 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                    placeholder="Minimal 8 karakter"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                                Konfirmasi Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 pr-10 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                    placeholder="Ulangi password baru"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-2.5 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <Lock className="h-4 w-4" />
                            Ubah Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function StoreSettings() {

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-zinc-900">
                Informasi Toko
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                        Nama Toko
                    </label>
                    <input
                        type="text"
                        defaultValue="Toko Saya"
                        className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                        Alamat
                    </label>
                    <textarea
                        rows={3}
                        placeholder="Alamat lengkap toko"
                        className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                        Nomor Telepon
                    </label>
                    <input
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
                <button className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600">
                    Simpan Perubahan
                </button>
            </div>
        </div>
    );
}

function ThemeSettings() {
    const router = useRouter();
    const { activeOutlet, updateOutlet } = useOutlet();
    // Default to existing or fallback
    const [primary, setPrimary] = useState(activeOutlet?.primaryColor || "#2e6a69");
    const [secondary, setSecondary] = useState(activeOutlet?.secondaryColor || "#f2b30c");
    const [isSaving, setIsSaving] = useState(false);

    // Update local state when outlet changes
    useEffect(() => {
        if (activeOutlet) {
            setPrimary(activeOutlet.primaryColor || "#2e6a69");
            setSecondary(activeOutlet.secondaryColor || "#f2b30c");
        }
    }, [activeOutlet]);

    const presets = [
        { name: "Sedia Classic", primary: "#2e6a69", secondary: "#f2b30c" },
        { name: "Ocean Blue", primary: "#0f172a", secondary: "#38bdf8" },
        { name: "Midnight Purple", primary: "#581c87", secondary: "#d8b4fe" },
        { name: "Forest Green", primary: "#14532d", secondary: "#4ade80" },
        { name: "Crimson Red", primary: "#991b1b", secondary: "#fca5a5" },
        { name: "Charcoal Gold", primary: "#18181b", secondary: "#fbbf24" },
    ];

    const handleSave = async () => {
        if (!activeOutlet?.id) {
            toast.error("Outlet tidak ditemukan. Silakan refresh halaman.");
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch(`/api/outlets/${activeOutlet.id}/branding`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ primaryColor: primary, secondaryColor: secondary }),
            });

            if (res.ok) {
                updateOutlet(activeOutlet.id, { primaryColor: primary, secondaryColor: secondary });
                toast.success("Tema berhasil diperbarui! 🎨");
                router.refresh();
            } else {
                toast.error("Gagal memperbarui tema");
            }
        } catch (error) {
            console.error("Theme Update Error:", error);
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h3 className="text-xl font-black text-zinc-900">Tampilan & Branding</h3>
                <p className="text-sm text-zinc-500 mt-1">Sesuaikan identitas visual aplikasi POS Anda agar terlihat profesional.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column: Controls */}
                <div className="space-y-8">
                    {/* Presets */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-zinc-700">Pilih Preset Tema</label>
                        <div className="grid grid-cols-3 gap-3">
                            {presets.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => {
                                        setPrimary(preset.primary);
                                        setSecondary(preset.secondary);
                                    }}
                                    className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all hover:border-zinc-300 hover:shadow-md ${primary === preset.primary && secondary === preset.secondary
                                        ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                                        : "border-zinc-200 bg-white"
                                        }`}
                                >
                                    <div className="flex -space-x-2">
                                        <div className="h-6 w-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.primary }} />
                                        <div className="h-6 w-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.secondary }} />
                                    </div>
                                    <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-900">
                                        {preset.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="border-dashed border-zinc-200" />

                    {/* Custom Colors */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-700 flex justify-between">
                                <span>Warna Utama (Primary)</span>
                                <span className="text-xs font-normal text-zinc-400 font-mono">{primary}</span>
                            </label>
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-white shadow-sm">
                                <input
                                    type="color"
                                    value={primary}
                                    onChange={(e) => setPrimary(e.target.value)}
                                    className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0 shadow-sm"
                                />
                                <div className="flex-1 space-y-1">
                                    <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                                        <div className="h-full transition-all duration-300" style={{ width: '70%', backgroundColor: primary }} />
                                    </div>
                                    <p className="text-[10px] text-zinc-400">Dominan di Sidebar, Header, dan Tombol.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-700 flex justify-between">
                                <span>Warna Aksen (Secondary)</span>
                                <span className="text-xs font-normal text-zinc-400 font-mono">{secondary}</span>
                            </label>
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-white shadow-sm">
                                <input
                                    type="color"
                                    value={secondary}
                                    onChange={(e) => setSecondary(e.target.value)}
                                    className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0 shadow-sm"
                                />
                                <div className="flex-1 space-y-1">
                                    <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                                        <div className="h-full transition-all duration-300" style={{ width: '40%', backgroundColor: secondary }} />
                                    </div>
                                    <p className="text-[10px] text-zinc-400">Untuk Notifikasi, Badge, dan Highlight.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{ backgroundColor: primary }}
                            className="w-full rounded-xl py-3.5 text-sm font-black text-white shadow-xl hover:brightness-110 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <span className="loading loading-spinner loading-xs border-2 border-white/30 border-t-white"></span>
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan Tema Baru"
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Column: Live Simulator */}
                <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-2xl">
                    <div className="absolute top-4 right-4 z-10 rounded-full bg-black/80 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                        LIVE PREVIEW
                    </div>

                    {/* Simulated Mobile Interface for "WOW" factor */}
                    <div className="p-6 h-full flex flex-col justify-center items-center scale-95 origin-top">
                        <div className="w-[280px] h-[580px] rounded-[3rem] border-8 border-zinc-900 bg-white shadow-2xl overflow-hidden relative flex flex-col">
                            {/* Phone Frame Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-xl z-20"></div>

                            {/* App Header */}
                            <div className="h-16 flex items-center justify-between px-4 pt-4 shadow-sm z-10" style={{ backgroundColor: 'white' }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-90" style={{ backgroundColor: primary }}>
                                    <div className="w-4 h-4 bg-white/20 rounded-sm"></div>
                                </div>
                                <div className="font-bold text-sm text-zinc-800">Sedia POS</div>
                                <div className="w-8 h-8 rounded-full bg-zinc-100"></div>
                            </div>

                            {/* App Drawer Simulated Open State */}
                            <div className="flex-1 flex pointer-events-none relative">
                                {/* Sidebar Area */}
                                <div className="w-[75%] h-full pt-4 px-4 flex flex-col gap-4 shadow-xl z-10" style={{ backgroundColor: 'white' }}>
                                    {/* User Info */}
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: secondary }}>
                                            K
                                        </div>
                                        <div className="space-y-1">
                                            <div className="w-16 h-2 bg-zinc-200 rounded-full"></div>
                                            <div className="w-10 h-1.5 bg-zinc-100 rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="space-y-1">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className={`h-10 rounded-lg flex items-center px-3 gap-3 ${i === 1 ? 'shadow-sm' : ''}`}
                                                style={{
                                                    backgroundColor: i === 1 ? `${primary}15` : 'transparent',
                                                    color: i === 1 ? primary : '#a1a1aa'
                                                }}
                                            >
                                                <div className="w-5 h-5 rounded-md" style={{ backgroundColor: i === 1 ? primary : '#e4e4e7' }}></div>
                                                <div className="w-20 h-2 rounded-full" style={{ backgroundColor: i === 1 ? `${primary}40` : '#f4f4f5' }}></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Outlet Switcher Highlight */}
                                    <div className="mt-auto mb-6 p-3 rounded-xl border border-dashed flex items-center gap-3" style={{ borderColor: secondary }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${secondary}20` }}>
                                            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: secondary }}></div>
                                        </div>
                                        <div className="w-12 h-2 rounded-full bg-zinc-100"></div>
                                    </div>
                                </div>

                                {/* Blurred Backdrop */}
                                <div className="absolute inset-0 bg-black/20 z-0"></div>
                            </div>
                        </div>
                        <p className="mt-4 text-xs font-medium text-zinc-400 text-center">
                            *Tampilan pada aplikasi mobile
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

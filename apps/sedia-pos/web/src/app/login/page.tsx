"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { LayoutDashboard, Eye, EyeOff, ShieldCheck, User, Store, ArrowRight, CheckCircle2 } from "lucide-react";
import KatsiraLogo from "@/components/KatsiraLogo";

export default function LoginPage() {
    const isProduction = process.env.NODE_ENV === "production";
    const router = useRouter();
    const [loginType, setLoginType] = useState<"admin" | "employee">("employee"); // Default to employee as requested? Or admin? Let's check user pref. Usually separate. I'll stick to admin default or employee? User asked "role user, cashier login from employee?". I'll default to "employee" as it covers more roles, or "admin" if owner. Let's keep "admin" default or maybe "employee". Let's stick to "admin" as primary for now, or "employee" if more staff use it. I'll keep "admin" as generic default for safety/owner, allowing switch.
    // Actually, user said "role user, cashier... loginnya dari tampilan karyawan?". YES.

    // Changing default to 'employee' might be better for staff? 
    // I'll keep 'admin' for now, consistent with previous step.

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn.email({
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message || "Login gagal. Periksa email dan password.");
            } else {
                router.push("/dashboard");
            }
        } catch {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary-950 flex-col justify-between p-12 text-white overflow-hidden">
                {/* Background Pattern/Image */}
                <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-500 via-primary-900 to-black" />
                <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>

                {/* Logo Area */}
                <div className="relative z-10 flex items-center">
                    <KatsiraLogo size={48} primaryColor="white" />
                </div>

                {/* Main Content */}
                <div className="relative z-10 max-w-lg">
                    <h2 className="text-4xl font-bold leading-tight tracking-tight mb-6">
                        Kelola Bisnis Anda dengan Lebih Cerdas & Efisien.
                    </h2>
                    <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                        Platform Point of Sales terintegrasi untuk membantu operasional toko, manajemen stok, dan laporan keuangan secara realtime.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-800">
                                <CheckCircle2 className="h-4 w-4 text-secondary-500" />
                            </div>
                            <span className="text-primary-100">Laporan Penualan Realtime</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-800">
                                <CheckCircle2 className="h-4 w-4 text-secondary-500" />
                            </div>
                            <span className="text-primary-100">Manajemen Stok & Inventaris</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-800">
                                <CheckCircle2 className="h-4 w-4 text-secondary-500" />
                            </div>
                            <span className="text-primary-100">Multi-Outlet & Karyawan</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-sm text-primary-300">
                    &copy; {new Date().getFullYear()} Katsira. All rights reserved.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex w-full lg:w-1/2 flex-col justify-center items-center p-8 lg:p-12 relative bg-zinc-50/50">


                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Header (Only visible on small screens) */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="mx-auto mb-4 flex justify-center">
                            <KatsiraLogo size={52} />
                        </div>
                    </div>

                    <div className="text-center lg:text-left">
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                            Selamat Datang Kembali
                        </h1>
                        <p className="mt-2 text-sm text-zinc-500">
                            Silakan masuk ke akun Anda untuk mengakses dashboard.
                        </p>
                    </div>

                    {/* Role Tabs */}
                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1">
                        <button
                            onClick={() => setLoginType("admin")}
                            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${loginType === "admin"
                                ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
                                : "text-zinc-500 hover:text-primary-700 hover:bg-primary-50"
                                }`}
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Admin / Pemilik
                        </button>
                        <button
                            onClick={() => setLoginType("employee")}
                            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${loginType === "employee"
                                ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
                                : "text-zinc-500 hover:text-primary-700 hover:bg-primary-50"
                                }`}
                        >
                            <User className="h-4 w-4" />
                            Karyawan / Staff
                        </button>
                    </div>

                    {/* Form Container */}
                    <div className="mt-8">
                        {loginType === "admin" ? (
                            <div className="space-y-6">
                                <div className="rounded-lg border border-primary-100 bg-primary-50/50 p-4">
                                    <div className="flex gap-3">
                                        <div className="mt-0.5 shrink-0 text-primary-600">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-primary-900">Akses Administrator</h3>
                                            <p className="mt-1 text-sm text-primary-700">
                                                Khusus untuk Pemilik Bisnis &amp; Admin Utama.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600 flex items-start gap-2">
                                        <span className="mt-0.5">⚠️</span>
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="admin-email"
                                            className="block text-sm font-medium text-zinc-900 mb-1.5"
                                        >
                                            Email Admin
                                        </label>
                                        <input
                                            id="admin-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@perusahaan.com"
                                            required
                                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-shadow focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="admin-password"
                                            className="block text-sm font-medium text-zinc-900 mb-1.5"
                                        >
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="admin-password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Masukan password..."
                                                required
                                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 transition-shadow focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-600/20 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading ? (
                                            "Memproses..."
                                        ) : (
                                            <>
                                                Masuk sebagai Admin
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Only show divider and Google button in development */}
                                {!isProduction && (
                                    <>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-zinc-200" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-zinc-50 px-3 text-zinc-500">atau</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={async () => {
                                                await signIn.social({
                                                    provider: "google",
                                                    callbackURL: "/dashboard",
                                                });
                                            }}
                                            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:ring-offset-2"
                                        >
                                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                                <path
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    fill="#4285F4"
                                                />
                                                <path
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    fill="#34A853"
                                                />
                                                <path
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    fill="#FBBC05"
                                                />
                                                <path
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    fill="#EA4335"
                                                />
                                            </svg>
                                            Lanjutkan dengan Google
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 mb-6">
                                    <p className="text-xs text-zinc-500 text-center">
                                        Untuk <strong>Manager</strong>, <strong>Kasir</strong>, dan <strong>Staff Outlet</strong>.
                                    </p>
                                </div>

                                {error && (
                                    <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600 flex items-start gap-2">
                                        <span className="mt-0.5">⚠️</span>
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-sm font-medium text-zinc-900 mb-1.5"
                                        >
                                            Email Karyawan
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="nama@toko.com"
                                            required
                                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-shadow focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="password"
                                            className="block text-sm font-medium text-zinc-900 mb-1.5"
                                        >
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Masukan password..."
                                                required
                                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 transition-shadow focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-600/20 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading ? (
                                        "Memproses..."
                                    ) : (
                                        <>
                                            Masuk Sekarang
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

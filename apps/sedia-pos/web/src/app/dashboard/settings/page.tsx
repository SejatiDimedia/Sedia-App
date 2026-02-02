"use client";

import { useState } from "react";
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
    Percent,
} from "lucide-react";
import RolesSettings from "./_components/roles-settings";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useEffect } from "react";

const settingsSections = [
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
];

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState("store");

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
                        {settingsSections.map((section) => {
                            const isLink = 'href' in section && section.href;
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
                        {activeSection === "store" && <StoreSettings />}
                        {activeSection === "theme" && <ThemeSettings />}
                        {activeSection === "roles" && <RolesSettings />}
                        {activeSection !== "store" && activeSection !== "theme" && activeSection !== "roles" && (
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
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-zinc-900">
                Tampilan & Tema
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                        Warna Utama (Primary)
                    </label>
                    <div className="flex gap-3">
                        {["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"].map(
                            (color) => (
                                <button
                                    key={color}
                                    className={`h-10 w-10 rounded-lg border-2 transition-all ${color === "#0ea5e9"
                                        ? "border-zinc-900"
                                        : "border-transparent hover:scale-110"
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            )
                        )}
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                        Warna yang dipilih akan diterapkan ke seluruh aplikasi
                    </p>
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                        Mode Tampilan
                    </label>
                    <div className="flex gap-3">
                        <button className="flex-1 rounded-lg border-2 border-primary-500 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-600">
                            Terang
                        </button>
                        <button className="flex-1 rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                            Gelap
                        </button>
                        <button className="flex-1 rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                            Otomatis
                        </button>
                    </div>
                </div>
                <button className="rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600">
                    Simpan Perubahan
                </button>
            </div>
        </div>
    );
}

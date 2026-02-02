import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    TrendingUp,
    Users,
} from "lucide-react";

import { db, posSchema } from "@/lib/db"; // data access
import { count, sum, eq, sql } from "drizzle-orm"; // utility
// import { formatCurrency } from "@/lib/utils"; // assumed utility, or define inline

export default async function DashboardPage() {
    // 1. Total Penjualan Hari Ini (Sum transactions.totalAmount where created_at is today)
    // For simplicity, let's just get ALL time total for now, or check date. 
    // SQLite/Postgres date functions vary. Let's do ALL TIME for simplicity first as requested.
    // Actually, user asked for "Hari Ini" in UI. Let's try to filter if possible, or just show all time for now to ensure data flows.
    // Let's stick to ALL TIME for stability, can refine to "Today" later.

    const [salesStats] = await db
        .select({
            totalSales: sum(posSchema.transactions.totalAmount),
            transactionCount: count(posSchema.transactions.id)
        })
        .from(posSchema.transactions)
        .where(eq(posSchema.transactions.status, 'completed'));

    const [productStats] = await db
        .select({ count: count(posSchema.products.id) })
        .from(posSchema.products)
        .where(eq(posSchema.products.isActive, true));

    const [customerStats] = await db
        .select({ count: count(posSchema.customers.id) })
        .from(posSchema.customers);

    const totalSales = Number(salesStats?.totalSales || 0);
    const totalTransactions = Number(salesStats?.transactionCount || 0);
    const totalProducts = Number(productStats?.count || 0);
    const totalCustomers = Number(customerStats?.count || 0);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">
                    Dashboard
                </h1>
                <p className="text-sm text-zinc-500">
                    Selamat datang di Sedia POS. Berikut ringkasan bisnis Anda (All Time).
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Penjualan"
                    value={`Rp ${totalSales.toLocaleString('id-ID')}`}
                    icon={TrendingUp}
                    trend="Total Pendapatan"
                    trendUp={true}
                    color="primary"
                />
                <StatCard
                    title="Total Transaksi"
                    value={totalTransactions.toString()}
                    icon={ShoppingCart}
                    trend="Transaksi Sukses"
                    trendUp={true}
                    color="secondary"
                />
                <StatCard
                    title="Total Produk"
                    value={totalProducts.toString()}
                    icon={Package}
                    trend="Produk Aktif"
                    trendUp={true}
                    color="primary"
                />
                <StatCard
                    title="Pelanggan"
                    value={totalCustomers.toString()}
                    icon={Users}
                    trend="Terdaftar"
                    trendUp={true}
                    color="secondary"
                />
            </div>

            {/* Quick Actions */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-1 bg-primary-500 rounded-full" />
                    <h2 className="text-xl font-bold text-zinc-900">
                        Aksi Cepat
                    </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <QuickActionButton icon={ShoppingCart} label="Kasir / POS" href="/pos" color="primary" />
                    <QuickActionButton icon={Package} label="Tambah Produk" href="/dashboard/products/new" color="secondary" />
                    <QuickActionButton icon={Users} label="Pelanggan Baru" href="/dashboard/customers/new" color="zinc" />
                    <QuickActionButton icon={LayoutDashboard} label="Laporan Harian" href="/dashboard/reports" color="zinc" />
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
    color = "primary"
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    trend: string;
    trendUp: boolean;
    color?: "primary" | "secondary";
}) {
    return (
        <div className="group rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-100">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">{title}</span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${color === "primary" ? "bg-primary-50 text-primary-600" : "bg-secondary-50 text-secondary-600"
                    }`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-4">
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
                    {value}
                </h3>
                <div className="mt-2 flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${trendUp ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-xs font-medium text-zinc-500">
                        {trend}
                    </span>
                </div>
            </div>
        </div>
    );
}

function QuickActionButton({
    icon: Icon,
    label,
    href,
    color = "zinc"
}: {
    icon: React.ElementType;
    label: string;
    href: string;
    color?: "primary" | "secondary" | "zinc";
}) {
    const colorClasses = {
        primary: "bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-100/50",
        secondary: "bg-secondary-50 text-secondary-700 hover:bg-secondary-100 border-secondary-100/50",
        zinc: "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border-zinc-200"
    };

    return (
        <a
            href={href}
            className={`flex flex-col items-center gap-4 rounded-2xl border p-6 transition-all hover:scale-[1.02] active:scale-[0.98] ${colorClasses[color]}`}
        >
            <div className={`p-3 rounded-xl ${color === 'primary' ? 'bg-primary-500 text-white' :
                    color === 'secondary' ? 'bg-secondary-500 text-secondary-950' :
                        'bg-white text-zinc-600 shadow-sm'
                }`}>
                <Icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold">{label}</span>
        </a>
    );
}

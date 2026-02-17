import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    TrendingUp,
    Users,
    ArrowRight,
    AlertTriangle,
    Clock
} from "lucide-react";

import { db, posSchema } from "@/lib/db"; // data access
import { inArray, count, sum, eq, and, desc, asc, lte } from "drizzle-orm"; // utility
import { getOutlets } from "@/actions/outlets";
import { DashboardFilter } from "@/components/dashboard-filter";
import { resolveR2UrlServer } from "@/lib/storage";
import { ProductThumbnail } from "@/components/dashboard/ProductThumbnail";
import Link from "next/link";

interface DashboardProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
    const [outlets, params] = await Promise.all([
        getOutlets(),
        searchParams
    ]);

    const allowedOutletIds = outlets.map(o => o.id);

    // Determine which outlets to query
    const selectedOutletId = typeof params.outletId === 'string' ? params.outletId : undefined;
    let targetOutletIds = allowedOutletIds;

    // If a specific outlet is selected AND the user has access to it
    if (selectedOutletId && allowedOutletIds.includes(selectedOutletId)) {
        targetOutletIds = [selectedOutletId];
    }

    let salesStats, productStats, customerStats;
    let recentTransactions: any[] = [];
    let lowStockProducts: any[] = [];

    if (targetOutletIds.length > 0) {
        [salesStats] = await db
            .select({
                totalSales: sum(posSchema.transactions.totalAmount),
                transactionCount: count(posSchema.transactions.id)
            })
            .from(posSchema.transactions)
            .where(
                and(
                    eq(posSchema.transactions.status, 'completed'),
                    inArray(posSchema.transactions.outletId, targetOutletIds)
                )
            );

        [productStats] = await db
            .select({ count: count(posSchema.products.id) })
            .from(posSchema.products)
            .where(
                and(
                    eq(posSchema.products.isActive, true),
                    inArray(posSchema.products.outletId, targetOutletIds)
                )
            );

        [customerStats] = await db
            .select({ count: count(posSchema.customers.id) })
            .from(posSchema.customers)
            .where(inArray(posSchema.customers.outletId, targetOutletIds));

        // Fetch Recent Transactions
        recentTransactions = await db.query.transactions.findMany({
            where: and(
                eq(posSchema.transactions.status, 'completed'),
                inArray(posSchema.transactions.outletId, targetOutletIds)
            ),
            orderBy: [desc(posSchema.transactions.createdAt)],
            limit: 5,
            with: {
                outlet: true
            }
        });

        // Fetch Low Stock Products
        lowStockProducts = await db.query.products.findMany({
            where: and(
                eq(posSchema.products.isActive, true),
                eq(posSchema.products.trackStock, true),
                lte(posSchema.products.stock, 5),
                inArray(posSchema.products.outletId, targetOutletIds)
            ),
            orderBy: [asc(posSchema.products.stock)],
            limit: 5,
            with: {
                outlet: true
            }
        });
    }

    // Resolve image URLs for low stock products
    const resolvedLowStockProducts = await Promise.all(
        lowStockProducts.map(async (p: any) => ({
            ...p,
            imageUrl: await resolveR2UrlServer(p.imageUrl),
        }))
    );

    const totalSales = Number(salesStats?.totalSales || 0);
    const totalTransactions = Number(salesStats?.transactionCount || 0);
    const totalProducts = Number(productStats?.count || 0);
    const totalCustomers = Number(customerStats?.count || 0);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Dashboard
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Selamat datang di Katsira. Kelola Mudah, Rezeki Melimpah.
                    </p>
                </div>
                <DashboardFilter outlets={outlets} />
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Penjualan"
                    value={`Rp ${totalSales.toLocaleString('id-ID')}`}
                    icon={TrendingUp}
                    trend={selectedOutletId ? "Outlet Terpilih" : "Semua Outlet"}
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

            {/* Detailed Info Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Transactions */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">Transaksi Terakhir</h3>
                                <p className="text-xs text-zinc-500">5 penjualan terbaru</p>
                            </div>
                        </div>
                        <Link href="/dashboard/transactions" className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">Belum ada transaksi</div>
                        ) : (
                            recentTransactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 text-xs font-bold">
                                            {tx.paymentMethod === 'cash' ? '💵' : '💳'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-zinc-900 text-sm">{tx.invoiceNumber}</div>
                                            <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                <span>{new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span>•</span>
                                                <span>{tx.outlet?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-primary-600 text-sm">
                                            +Rp {Number(tx.totalAmount).toLocaleString('id-ID')}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 capitalize">{tx.paymentStatus}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">Stok Menipis</h3>
                                <p className="text-xs text-zinc-500">Perlu restock segera (≤ 5)</p>
                            </div>
                        </div>
                        <Link href="/dashboard/inventory" className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {resolvedLowStockProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                                <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-2">
                                    <Package className="h-6 w-6" />
                                </div>
                                <p className="text-sm">Stok aman terkendali!</p>
                            </div>
                        ) : (
                            resolvedLowStockProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-red-50/50 transition-colors border border-transparent hover:border-red-100">
                                    <div className="flex items-center gap-3">
                                        <ProductThumbnail src={product.imageUrl} alt={product.name} />
                                        <div>
                                            <div className="font-bold text-zinc-900 text-sm line-clamp-1">{product.name}</div>
                                            <div className="text-[10px] text-zinc-500">
                                                {product.outlet?.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="font-bold text-red-600 text-sm">
                                                Sisa {product.stock}
                                            </div>
                                            <div className="text-[10px] text-zinc-400">
                                                Unit
                                            </div>
                                        </div>
                                        <Link
                                            href={`/dashboard/products/${product.id}/edit`}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm"
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
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

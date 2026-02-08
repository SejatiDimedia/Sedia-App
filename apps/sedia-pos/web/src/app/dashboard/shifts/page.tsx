"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useOutlet } from "@/providers/outlet-provider";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CalendarIcon, UserIcon, ArrowUpDown, X, Receipt, Package, ChartBar, ChevronRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Shift {
    id: string;
    status: "open" | "closed";
    startTime: string;
    endTime: string | null;
    startingCash: string;
    endingCash: string | null;
    difference: string | null;
    employee: {
        name: string;
    } | null;
}

interface Transaction {
    id: string;
    createdAt: string;
    totalAmount: string;
    paymentMethod: string;
    invoiceNumber: string | null;
}

interface ProductSale {
    productName: string;
    variantName: string | null;
    totalQuantity: number;
    unitPrice: number;
    totalRevenue: number;
}

interface ShiftDetail extends Shift {
    employeeName: string | null;
    summary: {
        cashSales: number;
        nonCashSales: number;
        totalSales: number;
        transactionCount: number;
        expectedCash: number;
    };
    transactions: Transaction[];
    productSales: ProductSale[];
}

export default function ShiftsPage() {
    const { activeOutlet } = useOutlet();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
    const [shiftDetail, setShiftDetail] = useState<ShiftDetail | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    useEffect(() => {
        const fetchShifts = async () => {
            if (!activeOutlet?.id) return;
            try {
                const res = await fetch(`/api/shifts?outletId=${activeOutlet.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const formatted = data.map((item: any) => ({
                        ...item.shift,
                        employee: item.employee
                    }));
                    setShifts(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch shifts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (activeOutlet?.id) {
            fetchShifts();
        }
    }, [activeOutlet?.id]);

    // Fetch shift detail when selected
    useEffect(() => {
        const fetchShiftDetail = async () => {
            if (!selectedShiftId) return;
            setIsDetailLoading(true);
            try {
                const res = await fetch(`/api/shifts/${selectedShiftId}`);
                if (res.ok) {
                    const data = await res.json();
                    setShiftDetail(data);
                }
            } catch (error) {
                console.error("Failed to fetch shift detail:", error);
            } finally {
                setIsDetailLoading(false);
            }
        };

        fetchShiftDetail();
    }, [selectedShiftId]);

    // Calculate summary stats
    const totalShifts = shifts.length;
    const activeShifts = shifts.filter(s => s.status === 'open').length;
    const totalDifference = shifts.reduce((acc, curr) => acc + (Number(curr.difference) || 0), 0);

    const getTypeInfo = (type: string, quantity: number) => {
        if (type === 'sale' || type === 'out') return { label: 'Keluar', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' };
        if (type === 'in' || type === 'purchase') return { label: 'Masuk', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' };
        return { label: 'Adjustment', color: quantity >= 0 ? 'text-emerald-600' : 'text-rose-600', bg: quantity >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100' };
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900">Laporan Shift</h1>
                    <p className="text-zinc-500 mt-1 text-lg">
                        Riwayat buka-tutup kasir dan rekonsiliasi keuangan.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-zinc-100 bg-white/50 backdrop-blur-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100">
                            <CalendarIcon className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">Total Shift</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-zinc-900">{totalShifts}</h3>
                                {activeShifts > 0 && (
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                        {activeShifts} Aktif
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-zinc-100 bg-white/50 backdrop-blur-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${totalDifference >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                            <ArrowUpDown className={`h-6 w-6 ${totalDifference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">Akumulasi Selisih</p>
                            <h3 className={`text-2xl font-black ${totalDifference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {totalDifference > 0 ? "+" : ""}
                                {formatCurrency(totalDifference)}
                            </h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-zinc-100 bg-white/50 backdrop-blur-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
                            <UserIcon className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">Karyawan Bertugas</p>
                            <div className="flex -space-x-3 mt-1.5 ml-1">
                                {[...new Set(shifts.map(s => s.employee?.name).filter(Boolean))].slice(0, 5).map((name, i) => (
                                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600 shadow-sm" title={name || ""}>
                                        {name?.charAt(0)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Table */}
            <Card className="border-zinc-200/60 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.04)] overflow-hidden rounded-2xl bg-white">
                <Table>
                    <TableHeader className="bg-zinc-50/80 border-b border-zinc-100">
                        <TableRow className="hover:bg-transparent border-zinc-100">
                            <TableHead className="w-[200px] font-bold text-zinc-500 text-xs uppercase tracking-wider pl-6 py-5">Waktu Shift</TableHead>
                            <TableHead className="font-bold text-zinc-500 text-xs uppercase tracking-wider py-5">Karyawan</TableHead>
                            <TableHead className="font-bold text-zinc-500 text-xs uppercase tracking-wider py-5">Status</TableHead>
                            <TableHead className="text-right font-bold text-zinc-500 text-xs uppercase tracking-wider py-5">Modal Awal</TableHead>
                            <TableHead className="text-right font-bold text-zinc-500 text-xs uppercase tracking-wider py-5">Setoran Akhir</TableHead>
                            <TableHead className="text-right font-bold text-zinc-500 text-xs uppercase tracking-wider py-5">Selisih</TableHead>
                            <TableHead className="w-[80px] text-right font-bold text-zinc-500 text-xs uppercase tracking-wider pr-6 py-5"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-60 text-center">
                                    <div className="flex flex-col justify-center items-center gap-4">
                                        <div className="loading loading-spinner loading-lg text-teal-600"></div>
                                        <span className="text-zinc-400 font-medium animate-pulse">Sedang memuat data...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : shifts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-96 text-center text-muted-foreground bg-zinc-50/30">
                                    <div className="flex flex-col items-center justify-center space-y-4 shadow-sm p-12 rounded-3xl bg-white border border-zinc-100 max-w-md mx-auto my-10">
                                        <div className="h-20 w-20 rounded-3xl bg-teal-50 flex items-center justify-center mb-2">
                                            <CalendarIcon className="h-10 w-10 text-teal-600" />
                                        </div>
                                        <h3 className="text-xl font-black text-zinc-900">Belum ada riwayat shift</h3>
                                        <p className="text-sm text-zinc-500 text-center leading-relaxed">
                                            Data laporan shift akan muncul di sini secara otomatis setelah kasir melakukan <span className="font-bold text-zinc-700">Close Shift</span> dari aplikasi POS.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            shifts.map((shift) => (
                                <TableRow
                                    key={shift.id}
                                    className="hover:bg-teal-50/30 transition-all duration-200 border-zinc-100 group cursor-pointer"
                                    onClick={() => setSelectedShiftId(shift.id)}
                                >
                                    <TableCell className="align-top py-5 pl-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-zinc-900 text-[15px]">
                                                {format(new Date(shift.startTime), "dd MMMM yyyy", { locale: id })}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                                                <div className="h-1.5 w-1.5 rounded-full bg-teal-400"></div>
                                                {format(new Date(shift.startTime), "HH:mm", { locale: id })}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 border border-zinc-200 flex items-center justify-center shadow-sm">
                                                <span className="text-xs font-black text-zinc-600">{shift.employee?.name?.charAt(0) || "?"}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-700">
                                                    {shift.employee?.name || "Unknown"}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Kasir</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top py-5">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border shadow-sm ${shift.status === "open"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                            : "bg-zinc-100 text-zinc-500 border-zinc-200"
                                            }`}>
                                            {shift.status === "open" ? (
                                                <>
                                                    <span className="relative flex h-2 w-2 mr-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    AKTIF
                                                </>
                                            ) : (
                                                "SELESAI"
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right align-top py-5 font-bold text-zinc-600">
                                        {formatCurrency(Number(shift.startingCash))}
                                    </TableCell>
                                    <TableCell className="text-right align-top py-5 font-black text-zinc-800 text-[15px]">
                                        {shift.endingCash ? formatCurrency(Number(shift.endingCash)) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right align-top py-5">
                                        {shift.difference ? (
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm ${Number(shift.difference) < 0
                                                ? "bg-rose-50 text-rose-600 border-rose-100"
                                                : Number(shift.difference) > 0
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    : "bg-zinc-50 text-zinc-500 border-zinc-100"
                                                }`}>
                                                {Number(shift.difference) > 0 ? "+" : ""}
                                                {formatCurrency(Number(shift.difference))}
                                            </span>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right align-top py-5 pr-6">
                                        <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-teal-500 transition-colors" />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Shift Detail Modal */}
            <Dialog open={!!selectedShiftId} onOpenChange={(open: boolean) => !open && setSelectedShiftId(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Detail Shift</DialogTitle>
                    </DialogHeader>

                    {isDetailLoading ? (
                        <div className="flex-1 flex items-center justify-center py-20">
                            <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : shiftDetail ? (
                        <Tabs defaultValue="summary" className="flex-1 overflow-hidden flex flex-col">
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                <TabsTrigger value="summary" className="flex items-center gap-2">
                                    <ChartBar className="h-4 w-4" />
                                    Ringkasan
                                </TabsTrigger>
                                <TabsTrigger value="transactions" className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4" />
                                    Transaksi
                                </TabsTrigger>
                                <TabsTrigger value="stock" className="flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Penjualan Stok
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="summary" className="flex-1 overflow-auto space-y-4">
                                <Card className="p-4 border-zinc-100">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-3">Informasi Shift</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Kasir</span>
                                            <span className="font-bold text-zinc-900">{shiftDetail.employeeName || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Mulai</span>
                                            <span className="font-bold text-zinc-900">{format(new Date(shiftDetail.startTime), "dd MMM yyyy HH:mm", { locale: id })}</span>
                                        </div>
                                        {shiftDetail.endTime && (
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Selesai</span>
                                                <span className="font-bold text-zinc-900">{format(new Date(shiftDetail.endTime), "dd MMM yyyy HH:mm", { locale: id })}</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                <Card className="p-4 border-zinc-100">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-3">Ringkasan Penjualan</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Total Transaksi</span>
                                            <span className="font-bold text-zinc-900">{shiftDetail.summary.transactionCount} transaksi</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Penjualan Cash</span>
                                            <span className="font-bold text-zinc-900">{formatCurrency(shiftDetail.summary.cashSales)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Penjualan Non-Cash</span>
                                            <span className="font-bold text-zinc-900">{formatCurrency(shiftDetail.summary.nonCashSales)}</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2 mt-2">
                                            <span className="font-bold text-zinc-900">Total Penjualan</span>
                                            <span className="font-black text-lg text-teal-600">{formatCurrency(shiftDetail.summary.totalSales)}</span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4 border-zinc-100">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-3">Rekonsiliasi Kas</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Modal Awal</span>
                                            <span className="font-bold text-zinc-900">{formatCurrency(Number(shiftDetail.startingCash))}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">+ Penjualan Cash</span>
                                            <span className="font-bold text-emerald-600">+{formatCurrency(shiftDetail.summary.cashSales)}</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2 mt-2">
                                            <span className="font-bold text-zinc-900">Kas Diharapkan</span>
                                            <span className="font-bold text-zinc-900">{formatCurrency(shiftDetail.summary.expectedCash)}</span>
                                        </div>
                                        {shiftDetail.endingCash && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Kas Aktual</span>
                                                    <span className="font-bold text-zinc-900">{formatCurrency(Number(shiftDetail.endingCash))}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Selisih</span>
                                                    <span className={`font-bold ${Number(shiftDetail.difference) < 0 ? 'text-rose-600' : Number(shiftDetail.difference) > 0 ? 'text-emerald-600' : 'text-zinc-700'}`}>
                                                        {Number(shiftDetail.difference) > 0 ? '+' : ''}{formatCurrency(Number(shiftDetail.difference))}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="transactions" className="flex-1 overflow-hidden">
                                <ScrollArea className="h-[400px]">
                                    {shiftDetail.transactions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                                            <Receipt className="h-12 w-12 mb-3 opacity-50" />
                                            <p className="font-medium">Tidak ada transaksi</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 pr-4">
                                            {shiftDetail.transactions.map((tx) => (
                                                <Card key={tx.id} className="p-4 border-zinc-100 hover:border-teal-200 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="text-xs text-zinc-400 font-mono">{tx.invoiceNumber || tx.id.slice(0, 8)}</p>
                                                            <p className="text-sm font-bold text-zinc-900">{format(new Date(tx.createdAt), "HH:mm", { locale: id })}</p>
                                                        </div>
                                                        <Badge variant={tx.paymentMethod?.toLowerCase() === 'cash' ? 'default' : 'secondary'} className={tx.paymentMethod?.toLowerCase() === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}>
                                                            {tx.paymentMethod || 'Cash'}
                                                        </Badge>
                                                    </div>
                                                    <p className="font-black text-lg text-teal-600">{formatCurrency(Number(tx.totalAmount))}</p>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="stock" className="flex-1 overflow-hidden">
                                <ScrollArea className="h-[400px]">
                                    {(!shiftDetail.productSales || shiftDetail.productSales.length === 0) ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                                            <Package className="h-12 w-12 mb-3 opacity-50" />
                                            <p className="font-medium">Tidak ada penjualan produk</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 pr-4">
                                            <p className="text-xs text-zinc-500 mb-4 px-1">Ringkasan produk terjual selama shift ini:</p>
                                            {shiftDetail.productSales.map((sale, idx) => (
                                                <Card key={idx} className="p-4 border-zinc-100 hover:border-teal-200 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-zinc-900">
                                                                {sale.productName}
                                                                {sale.variantName && (
                                                                    <span className="font-normal text-xs text-zinc-500 ml-1">({sale.variantName})</span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-zinc-500 mt-1">
                                                                @ {formatCurrency(sale.unitPrice)} × {sale.totalQuantity}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge className="bg-rose-50 text-rose-600 border-rose-100 border mb-1">
                                                                -{sale.totalQuantity} terjual
                                                            </Badge>
                                                            <p className="text-sm font-bold text-teal-600">
                                                                {formatCurrency(sale.totalRevenue)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}


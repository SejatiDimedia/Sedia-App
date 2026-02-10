import { db, posSchema } from "@/lib/db";
import { OutletCard } from "@/components/catalog/OutletCard";
import { Store } from "lucide-react";
import { eq } from "drizzle-orm";

async function getOutlets() {
    return await db.select().from(posSchema.outlets).where(eq(posSchema.outlets.isCatalogVisible, true)).orderBy(posSchema.outlets.name);
}

// Revalidate every minute
export const revalidate = 60;

export default async function OutletSelectionPage() {
    const outlets = await getOutlets();

    return (
        <div className="py-16 px-4 max-w-5xl mx-auto">
            <div className="mb-16 text-center space-y-4">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
                    <div className="absolute inset-0 bg-primary-500/10 rounded-[2rem] rotate-6 transition-transform duration-500 group-hover:rotate-12"></div>
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-primary-600 text-white shadow-xl shadow-primary-500/20">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl font-brand font-black text-zinc-900 tracking-tight">Katalog Outlet</h1>
                <p className="text-zinc-500 max-w-sm mx-auto text-lg leading-relaxed">
                    Temukan menu terbaik dari cabang terdekat kami
                </p>
            </div>

            {outlets.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm">
                    <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Store className="w-10 h-10 text-zinc-200" />
                    </div>
                    <p className="text-zinc-400 font-medium text-lg">Belum ada cabang yang tersedia saat ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {outlets.map((outlet) => (
                        <OutletCard
                            key={outlet.id}
                            id={outlet.id}
                            name={outlet.name}
                            address={outlet.address}
                            phone={outlet.phone}
                            primaryColor={outlet.primaryColor}
                            openTime={outlet.openTime}
                            closeTime={outlet.closeTime}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

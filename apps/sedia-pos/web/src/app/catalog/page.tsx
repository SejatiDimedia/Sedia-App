import { db, posSchema } from "@/lib/db";
import { OutletCard } from "@/components/catalog/OutletCard";
import { Store } from "lucide-react";

async function getOutlets() {
    return await db.select().from(posSchema.outlets).orderBy(posSchema.outlets.name);
}

// Revalidate every minute
export const revalidate = 60;

export default async function OutletSelectionPage() {
    const outlets = await getOutlets();

    return (
        <div className="py-8 px-4">
            <div className="mb-8 text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-teal-50 text-teal-600 mb-2">
                    <Store className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold font-outfit text-zinc-900">Pilih Cabang</h1>
                <p className="text-zinc-500 max-w-[280px] mx-auto text-sm">
                    Silakan pilih cabang terdekat untuk melihat menu yang tersedia
                </p>
            </div>

            {outlets.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                    <p className="text-zinc-400 font-medium">Belum ada cabang tersedia</p>
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";

// PATCH /api/categories/[id] - Update a category
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    try {
        if (!name) {
            return NextResponse.json(
                { error: "Nama kategori wajib diisi" },
                { status: 400 }
            );
        }

        // Perform Update
        const updated = await db
            .update(posSchema.categories)
            .set({
                name,
                updatedAt: new Date(),
            })
            .where(eq(posSchema.categories.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json(
                { error: "Kategori tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json(updated[0]);
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json(
            { error: "Gagal memperbarui kategori" },
            { status: 500 }
        );
    }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if products exist for this category?
        // Ideally yes, but for now simple delete.

        const deleted = await db
            .delete(posSchema.categories)
            .where(eq(posSchema.categories.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json(
                { error: "Kategori tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: "Kategori berhasil dihapus" });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json(
            { error: "Gagal menghapus kategori" },
            { status: 500 }
        );
    }
}

// OPTIONS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}

"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    LayoutDashboard,
    Pencil,
    Trash2,
    Loader2,
    X,
    Save
} from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmationModal from "@/components/confirmation-modal";
import {
    getMasterCategories,
    createMasterCategory,
    updateMasterCategory,
    deleteMasterCategory,
    Category
} from "./actions";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: "primary" | "danger" | "warning";
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        const res = await getMasterCategories();
        if (res.data) {
            setCategories(res.data);
        }
        setIsLoading(false);
    };

    const showConfirm = (config: Omit<typeof confirmState, "isOpen">) => {
        setConfirmState({ ...config, isOpen: true });
    };

    const handleConfirm = () => {
        confirmState.onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name });
        } else {
            setEditingCategory(null);
            setFormData({ name: "" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setIsSubmitting(true);
        try {
            if (editingCategory) {
                const res = await updateMasterCategory(editingCategory.id, formData.name);
                if (res.data) {
                    toast.success("Kategori diperbarui");
                    loadCategories();
                    handleCloseModal();
                } else {
                    toast.error(res.error || "Gagal memperbarui kategori");
                }
            } else {
                const res = await createMasterCategory(formData.name);
                if (res.data) {
                    toast.success("Kategori dibuat");
                    loadCategories();
                    handleCloseModal();
                } else {
                    toast.error(res.error || "Gagal membuat kategori");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm({
            title: "Hapus Kategori",
            message: "Apakah Anda yakin ingin menghapus kategori ini? Produk dengan kategori ini akan kehilangan kategorinya.",
            variant: "danger",
            onConfirm: async () => {
                setIsSubmitting(true);
                try {
                    const res = await deleteMasterCategory(id);
                    if (res.success) {
                        toast.success("Kategori dihapus");
                        setCategories(prev => prev.filter(c => c.id !== id));
                    } else {
                        toast.error(res.error || "Gagal menghapus kategori");
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Terjadi kesalahan saat menghapus");
                } finally {
                    setIsSubmitting(false);
                }
            }
        });
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Kategori Produk
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Kelola kategori produk master untuk semua outlet
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Kategori
                </button>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                    type="text"
                    placeholder="Cari kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
            </div>

            {/* List */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {isLoading ? (
                    <div className="col-span-full py-12 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-secondary-500" />
                        <p className="mt-2 text-sm text-zinc-500">Memuat kategori...</p>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
                        <LayoutDashboard className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                        <p className="text-sm text-zinc-500">Belum ada kategori</p>
                    </div>
                ) : (
                    filteredCategories.map((cat) => (
                        <div
                            key={cat.id}
                            className="group relative flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-secondary-200 hover:shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
                                    <LayoutDashboard className="h-5 w-5" />
                                </div>
                                <span className="font-medium text-zinc-900">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                    onClick={() => handleOpenModal(cat)}
                                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(cat.id)}
                                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
                        onClick={handleCloseModal}
                    />
                    <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-200 rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-zinc-900">
                                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                    Nama Kategori
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    placeholder="Contoh: Makanan, Minuman, Coffee"
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {editingCategory ? "Simpan Perubahan" : "Simpan Kategori"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                isLoading={isSubmitting}
            />
        </div>
    );
}

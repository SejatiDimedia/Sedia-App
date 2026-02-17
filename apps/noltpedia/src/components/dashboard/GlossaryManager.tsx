import React, { useState, useEffect } from "react";
import { MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";
import { useToast } from "../ui/NeoToast";
import { useConfirm } from "../ui/NeoConfirm";

interface GlossaryTerm {
    id: string;
    term: string;
    definition: string;
    relatedArticleId: string | null;
}

export default function GlossaryManager() {
    const [terms, setTerms] = useState<GlossaryTerm[]>([]);
    const [loading, setLoading] = useState(true);
    const [term, setTerm] = useState("");
    const [definition, setDefinition] = useState("");
    const [relatedArticleId, setRelatedArticleId] = useState("");
    const [editId, setEditId] = useState<string | null>(null);

    const { showToast } = useToast();
    const { confirm } = useConfirm();

    useEffect(() => {
        fetchTerms();
    }, []);

    const fetchTerms = async () => {
        const res = await fetch("/api/glossary");
        const data = await res.json();
        setTerms(data);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!term || !definition) return;

        const res = await fetch("/api/glossary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ term, definition, relatedArticleId }),
        });

        if (res.ok) {
            setTerm("");
            setDefinition("");
            setRelatedArticleId("");
            fetchTerms();
            showToast("Istilah berhasil didaftarkan", "success");
        } else {
            showToast("Gagal membuat istilah", "error");
        }
    };

    const handleUpdate = async (item: GlossaryTerm) => {
        const res = await fetch(`/api/glossary/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
        });

        if (res.ok) {
            setEditId(null);
            fetchTerms();
            showToast("Istilah berhasil diperbarui", "success");
        } else {
            showToast("Gagal memperbarui istilah", "error");
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: "Hapus Istilah",
            message: "Apakah Anda yakin ingin menghapus istilah ini dari glosarium?",
            variant: "danger"
        });
        if (!confirmed) return;

        const res = await fetch(`/api/glossary/${id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            fetchTerms();
            showToast("Istilah berhasil dihapus", "success");
        } else {
            showToast("Gagal menghapus istilah", "error");
        }
    };

    return (
        <div className="space-y-8 font-mono">
            {/* Create Form */}
            <div className="neo-card p-6 bg-white border-4 border-black">
                <h3 className="text-xl font-black mb-4 uppercase font-sans">Tambah Istilah Teknis</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase block mb-1">Istilah</label>
                            <input
                                className="neo-input w-full"
                                value={term}
                                onChange={e => setTerm(e.target.value)}
                                required
                                placeholder="Misal: Closure"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase block mb-1">Slug Artikel Terkait (Opsional)</label>
                            <input
                                className="neo-input w-full"
                                value={relatedArticleId}
                                onChange={e => setRelatedArticleId(e.target.value)}
                                placeholder="article-slug"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase block mb-1">Definisi</label>
                        <textarea
                            className="neo-input w-full min-h-[100px]"
                            value={definition}
                            onChange={e => setDefinition(e.target.value)}
                            required
                            placeholder="Berikan definisi ringkas berdasarkan logika..."
                        />
                    </div>
                    <button type="submit" className="neo-btn bg-black text-white w-full uppercase font-black">
                        + Daftarkan Istilah
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="neo-card p-0 bg-white overflow-hidden border-4 border-black">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black text-white font-sans">
                        <tr>
                            <th className="p-4 border-b-2 border-black font-bold uppercase text-xs">Istilah</th>
                            <th className="p-4 border-b-2 border-black font-bold uppercase text-xs">Definisi</th>
                            <th className="p-4 border-b-2 border-black font-bold uppercase text-xs w-24">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center animate-pulse uppercase font-black">Memindai Database...</td></tr>
                        ) : terms.map(item => (
                            <tr key={item.id} className="border-b-2 border-black hover:bg-zinc-50 group">
                                <td className="p-4 align-top">
                                    {editId === item.id ? (
                                        <input
                                            className="border-2 border-black p-1 w-full font-bold uppercase"
                                            value={item.term}
                                            onChange={e => setTerms(terms.map((t: GlossaryTerm) => t.id === item.id ? { ...t, term: e.target.value } : t))}
                                        />
                                    ) : (
                                        <span className="font-black uppercase text-blue-600">{item.term}</span>
                                    )}
                                </td>
                                <td className="p-4 align-top">
                                    {editId === item.id ? (
                                        <textarea
                                            className="border-2 border-black p-1 w-full min-h-[80px]"
                                            value={item.definition}
                                            onChange={e => setTerms(terms.map((t: GlossaryTerm) => t.id === item.id ? { ...t, definition: e.target.value } : t))}
                                        />
                                    ) : (
                                        <p className="opacity-70 leading-relaxed">{item.definition}</p>
                                    )}
                                </td>
                                <td className="p-4 align-top">
                                    <div className="flex flex-col gap-2">
                                        {editId === item.id ? (
                                            <>
                                                <button onClick={() => handleUpdate(item)} className="bg-green-500 text-white p-2 border-2 border-black neo-shadow-sm hover:translate-y-0.5 transition-all">
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={() => setEditId(null)} className="bg-zinc-200 p-2 border-2 border-black neo-shadow-sm hover:translate-y-0.5 transition-all">
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setEditId(item.id)} className="bg-blue-400 text-white p-2 border-2 border-black neo-shadow-sm hover:translate-y-0.5 transition-all">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="bg-red-400 text-white p-2 border-2 border-black neo-shadow-sm hover:translate-y-0.5 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && terms.length === 0 && (
                            <tr><td colSpan={3} className="p-12 text-center opacity-30 font-black uppercase">Tidak ada istilah terdaftar di arsip.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

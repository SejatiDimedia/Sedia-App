import React, { useState, useEffect } from "react";
import { MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";

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
        } else {
            alert("Failed to create term");
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
        } else {
            alert("Failed to update term");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this term?")) return;

        const res = await fetch(`/api/glossary/${id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            fetchTerms();
        } else {
            alert("Failed to delete term");
        }
    };

    return (
        <div className="space-y-8 font-mono">
            {/* Create Form */}
            <div className="neo-card p-6 bg-white border-4 border-black">
                <h3 className="text-xl font-black mb-4 uppercase font-sans">Add Technical Term</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase block mb-1">Term</label>
                            <input
                                className="neo-input w-full"
                                value={term}
                                onChange={e => setTerm(e.target.value)}
                                required
                                placeholder="e.g. Closure"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase block mb-1">Related Article Slug (Optional)</label>
                            <input
                                className="neo-input w-full"
                                value={relatedArticleId}
                                onChange={e => setRelatedArticleId(e.target.value)}
                                placeholder="article-slug"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase block mb-1">Definition</label>
                        <textarea
                            className="neo-input w-full min-h-[100px]"
                            value={definition}
                            onChange={e => setDefinition(e.target.value)}
                            required
                            placeholder="Provide a concise, logic-based definition..."
                        />
                    </div>
                    <button type="submit" className="neo-btn bg-black text-white w-full uppercase font-black">
                        + Register Term
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="neo-card p-0 bg-white overflow-hidden border-4 border-black">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black text-white font-sans">
                        <tr>
                            <th className="p-4 border-b-2 border-black font-bold uppercase text-xs">Term</th>
                            <th className="p-4 border-b-2 border-black font-bold uppercase text-xs">Definition</th>
                            <th className="p-4 border-b-2 border-black font-bold uppercase text-xs w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center animate-pulse uppercase font-black">Scanning Database...</td></tr>
                        ) : terms.map(item => (
                            <tr key={item.id} className="border-b-2 border-black hover:bg-zinc-50 group">
                                <td className="p-4 align-top">
                                    {editId === item.id ? (
                                        <input
                                            className="border-2 border-black p-1 w-full font-bold uppercase"
                                            value={item.term}
                                            onChange={e => setTerms(terms.map(t => t.id === item.id ? { ...t, term: e.target.value } : t))}
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
                                            onChange={e => setTerms(terms.map(t => t.id === item.id ? { ...t, definition: e.target.value } : t))}
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
                            <tr><td colSpan={3} className="p-12 text-center opacity-30 font-black uppercase">No terms registered in the archives.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { List, Plus, Trash2, Edit2, ChevronUp, ChevronDown, Check, X } from "lucide-react";
import { useToast } from "../ui/NeoToast";
import { useConfirm } from "../ui/NeoConfirm";

interface Path {
    id: string;
    title: string;
    description: string;
    slug: string;
    isPublished: boolean;
}

interface PathStep {
    id: string;
    pathId: string;
    articleId: string;
    stepOrder: number;
    article: {
        title: string;
    };
}

interface Article {
    id: string;
    title: string;
}

export default function PathManager() {
    const [paths, setPaths] = useState<Path[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPath, setSelectedPath] = useState<Path | null>(null);
    const [pathStepsList, setPathStepsList] = useState<PathStep[]>([]);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [slug, setSlug] = useState("");
    const [isEditing, setIsEditing] = useState<string | null>(null);

    const { showToast } = useToast();
    const { confirm } = useConfirm();

    useEffect(() => {
        fetchPaths();
        fetchArticles();
    }, []);

    useEffect(() => {
        if (selectedPath) {
            fetchPathSteps(selectedPath.id);
        } else {
            setPathStepsList([]);
        }
    }, [selectedPath]);

    const fetchPaths = async () => {
        const res = await fetch("/api/paths");
        const data = await res.json();
        setPaths(data);
        setLoading(false);
    };

    const fetchArticles = async () => {
        const res = await fetch("/api/articles");
        const data = await res.json();
        setArticles(data);
    };

    const fetchPathSteps = async (pathId: string) => {
        const res = await fetch(`/api/paths/${pathId}/steps`);
        const data = await res.json();
        setPathStepsList(data);
    };

    const handleCreatePath = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/paths", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, slug }),
        });
        if (res.ok) {
            setTitle("");
            setDescription("");
            setSlug("");
            fetchPaths();
            showToast("Alur belajar berhasil dibuat", "success");
        } else {
            showToast("Gagal membuat alur", "error");
        }
    };

    const handleDeletePath = async (id: string) => {
        const confirmed = await confirm({
            title: "Hapus Alur",
            message: "Hapus alur ini? Langkah-langkah kurikulum di dalamnya juga akan terhapus.",
            variant: "danger"
        });
        if (!confirmed) return;
        const res = await fetch(`/api/paths/${id}`, { method: "DELETE" });
        if (res.ok) {
            if (selectedPath?.id === id) setSelectedPath(null);
            fetchPaths();
            showToast("Alur berhasil dihapus", "success");
        } else {
            showToast("Gagal menghapus alur", "error");
        }
    };

    const handleAddStep = async (articleId: string) => {
        if (!selectedPath) return;
        const nextOrder = pathStepsList.length + 1;
        const newSteps = [...pathStepsList.map((s: PathStep) => ({ articleId: s.articleId, stepOrder: s.stepOrder })), { articleId, stepOrder: nextOrder }];

        const res = await fetch(`/api/paths/${selectedPath.id}/steps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ steps: newSteps }),
        });
        if (res.ok) fetchPathSteps(selectedPath.id);
    };

    const handleRemoveStep = async (index: number) => {
        if (!selectedPath) return;
        const newSteps = pathStepsList
            .filter((_: any, i: number) => i !== index)
            .map((s: PathStep, i: number) => ({ articleId: s.articleId, stepOrder: i + 1 }));

        const res = await fetch(`/api/paths/${selectedPath.id}/steps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ steps: newSteps }),
        });
        if (res.ok) fetchPathSteps(selectedPath.id);
    };

    const moveStep = async (index: number, direction: 'up' | 'down') => {
        if (!selectedPath) return;
        const newSteps = [...pathStepsList];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSteps.length) return;

        const temp = newSteps[index];
        newSteps[index] = newSteps[targetIndex];
        newSteps[targetIndex] = temp;

        const res = await fetch(`/api/paths/${selectedPath.id}/steps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ steps: newSteps.map((s: PathStep, i: number) => ({ articleId: s.articleId, stepOrder: i + 1 })) }),
        });
        if (res.ok) fetchPathSteps(selectedPath.id);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-mono">
            {/* Left Column: Path List & Create */}
            <div className="lg:col-span-1 space-y-6">
                <div className="neo-card p-6 bg-white border-4 border-black">
                    <h3 className="text-xl font-black mb-4 uppercase">Buat Alur</h3>
                    <form onSubmit={handleCreatePath} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase">Judul</label>
                            <input
                                className="neo-input w-full"
                                value={title}
                                onChange={e => {
                                    setTitle(e.target.value);
                                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase">Slug</label>
                            <input className="neo-input w-full text-xs" value={slug} onChange={e => setSlug(e.target.value)} required />
                        </div>
                        <button type="submit" className="neo-btn bg-yellow-400 w-full font-bold">BUAT ALUR</button>
                    </form>
                </div>

                <div className="neo-card bg-white border-4 border-black overflow-hidden">
                    <div className="bg-black text-white p-4 font-bold uppercase text-sm">Alur Belajar</div>
                    <div className="divide-y-2 divide-black">
                        {paths.map(path => (
                            <div
                                key={path.id}
                                className={`p-4 hover:bg-zinc-100 cursor-pointer flex justify-between items-center ${selectedPath?.id === path.id ? 'bg-zinc-100' : ''}`}
                                onClick={() => setSelectedPath(path)}
                            >
                                <div>
                                    <div className="font-bold">{path.title}</div>
                                    <div className="text-xs opacity-60">/{path.slug}</div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleDeletePath(path.id); }} className="text-red-500 p-2 hover:bg-red-50 rounded">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Steps Management */}
            <div className="lg:col-span-2">
                {selectedPath ? (
                    <div className="space-y-6">
                        <div className="neo-card p-6 bg-white border-4 border-black">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black uppercase">{selectedPath.title}</h3>
                                <div className="flex gap-2">
                                    <button className="neo-btn bg-zinc-100 px-4 py-2 text-xs">PRATINJAU</button>
                                    <button className="neo-btn bg-blue-500 text-white px-4 py-2 text-xs">TERBITKAN</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold uppercase block">Kurikulum Alur (Langkah)</label>
                                <div className="space-y-2">
                                    {pathStepsList.map((step, index) => (
                                        <div key={step.id} className="neo-card p-4 bg-zinc-50 border-2 border-black flex items-center gap-4">
                                            <div className="bg-black text-white w-8 h-8 flex items-center justify-center font-bold">{index + 1}</div>
                                            <div className="flex-1 font-bold">{step.article?.title || 'Artikel Tidak Diketahui'}</div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => moveStep(index, 'up')} disabled={index === 0} className="p-1 hover:bg-zinc-200 rounded disabled:opacity-20"><ChevronUp size={20} /></button>
                                                <button onClick={() => moveStep(index, 'down')} disabled={index === pathStepsList.length - 1} className="p-1 hover:bg-zinc-200 rounded disabled:opacity-20"><ChevronDown size={20} /></button>
                                                <button onClick={() => handleRemoveStep(index)} className="text-red-500 p-1 hover:bg-red-50 rounded ml-2"><X size={20} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {pathStepsList.length === 0 && (
                                        <div className="p-8 border-2 border-dashed border-zinc-300 text-center opacity-50 italic">Belum ada langkah yang ditambahkan.</div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t-2 border-black">
                                <label className="text-sm font-bold uppercase block mb-4 italic">Tambah Artikel ke Alur</label>
                                <select
                                    className="neo-input w-full mb-4"
                                    onChange={(e) => {
                                        if (e.target.value) handleAddStep(e.target.value);
                                        e.target.value = "";
                                    }}
                                >
                                    <option value="">Pilih Artikel...</option>
                                    {articles.map(article => (
                                        <option key={article.id} value={article.id}>{article.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="neo-card p-12 bg-zinc-100 border-4 border-dashed border-black flex flex-col items-center justify-center text-center">
                        <List size={48} className="mb-4 opacity-20" />
                        <div className="font-bold uppercase opacity-40 text-xl">Pilih alur untuk mengelola langkah-langkahnya</div>
                    </div>
                )}
            </div>
        </div>
    );
}

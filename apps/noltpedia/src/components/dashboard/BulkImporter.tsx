import React, { useState, useMemo } from "react";
import { useToast } from "../ui/NeoToast";
import {
    Upload,
    CheckCircle,
    XCircle,
    AlertTriangle,
    FileJson,
    Eye,
    Loader2,
    Copy,
    Trash2,
} from "lucide-react";

interface ImportResult {
    topic: { created: boolean; skipped: boolean; id: string } | null;
    articles: {
        created: string[];
        skipped: string[];
        errors: { slug: string; error: string }[];
    };
    path: { created: boolean; id: string; stepsCount: number } | null;
}

const SAMPLE_JSON = `{
  "topic": {
    "id": "react",
    "name": "React",
    "description": "Library JavaScript untuk membangun user interface",
    "icon": "⚛️"
  },
  "articles": [
    {
      "slug": "pengenalan-react",
      "title": "Pengenalan React",
      "excerpt": "Pelajari dasar-dasar React...",
      "difficulty": "beginner",
      "content": "# Pengenalan React\\n\\nReact adalah library JavaScript..."
    }
  ],
  "path": {
    "title": "Belajar React dari Nol",
    "slug": "belajar-react",
    "description": "Learning path lengkap untuk menguasai React"
  }
}`;

export default function BulkImporter() {
    const [jsonInput, setJsonInput] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { showToast } = useToast();

    // Live parse
    const parsed = useMemo(() => {
        if (!jsonInput.trim()) return null;
        try {
            const data = JSON.parse(jsonInput);
            return { valid: true, data, error: null };
        } catch (e: any) {
            return { valid: false, data: null, error: e.message };
        }
    }, [jsonInput]);

    const handleImport = async () => {
        if (!parsed?.valid) return;
        setIsImporting(true);
        setResult(null);
        setError(null);

        try {
            const res = await fetch("/api/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: jsonInput,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || `HTTP ${res.status}`);
                if (data.partialResult) setResult(data.partialResult);
                showToast("Impor selesai dengan beberapa kesalahan", "error");
            } else {
                setResult(data);
                showToast("Data berhasil diimpor", "success");
            }
        } catch (e: any) {
            setError(e.message);
            showToast("Gagal melakukan impor", "error");
        } finally {
            setIsImporting(false);
        }
    };

    const loadSample = () => {
        setJsonInput(SAMPLE_JSON);
        setResult(null);
        setError(null);
    };

    const clearAll = () => {
        setJsonInput("");
        setResult(null);
        setError(null);
    };

    const totalCreated = result
        ? (result.topic?.created ? 1 : 0) +
        result.articles.created.length +
        (result.path?.created ? 1 : 0)
        : 0;

    const totalSkipped = result
        ? (result.topic?.skipped ? 1 : 0) +
        result.articles.skipped.length +
        (result.path && !result.path.created ? 1 : 0)
        : 0;

    const totalErrors = result ? result.articles.errors.length : 0;

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={loadSample}
                    className="neo-btn bg-zinc-200 text-black hover:bg-zinc-300 flex items-center gap-2 text-sm"
                >
                    <Copy size={16} /> Muat Contoh JSON
                </button>
                <button
                    onClick={clearAll}
                    className="neo-btn bg-white text-black hover:bg-zinc-100 flex items-center gap-2 text-sm"
                >
                    <Trash2 size={16} /> Bersihkan
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Left: JSON Input */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                        <FileJson size={18} /> Tempel JSON
                    </label>
                    <textarea
                        value={jsonInput}
                        onChange={(e) => {
                            setJsonInput(e.target.value);
                            setResult(null);
                            setError(null);
                        }}
                        placeholder={`Tempel JSON hasil AI Anda di sini...\n\nFormat yang diharapkan:\n{\n  "topic": { ... },\n  "articles": [ ... ],\n  "path": { ... }\n}`}
                        className="w-full h-[500px] p-4 font-mono text-sm border-2 border-black bg-white resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        spellCheck={false}
                    />
                    {/* Validation status */}
                    {jsonInput.trim() && (
                        <div
                            className={`flex items-center gap-2 text-sm font-bold px-3 py-2 border-2 border-black ${parsed?.valid
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                                }`}
                        >
                            {parsed?.valid ? (
                                <>
                                    <CheckCircle size={16} /> JSON Valid
                                </>
                            ) : (
                                <>
                                    <XCircle size={16} /> {parsed?.error}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Preview */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                        <Eye size={18} /> Pratinjau
                    </label>

                    {!parsed?.valid ? (
                        <div className="h-[500px] border-2 border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center text-zinc-400 font-bold">
                            {jsonInput.trim()
                                ? "⚠️ Perbaiki kesalahan JSON untuk melihat pratinjau"
                                : "Tempel JSON untuk melihat pratinjau"}
                        </div>
                    ) : (
                        <div className="h-[500px] overflow-auto border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                            {/* Topic */}
                            {parsed.data.topic && (
                                <div className="border-2 border-black p-4 bg-yellow-50">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-700 mb-2">
                                        📁 Topik
                                    </h4>
                                    <p className="font-bold text-lg">
                                        {parsed.data.topic.icon}{" "}
                                        {parsed.data.topic.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        ID: {parsed.data.topic.id}
                                    </p>
                                    {parsed.data.topic.description && (
                                        <p className="text-sm text-zinc-600 mt-1">
                                            {parsed.data.topic.description}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Articles */}
                            {parsed.data.articles &&
                                parsed.data.articles.length > 0 && (
                                    <div className="border-2 border-black p-4 bg-blue-50">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">
                                            📝 Artikel (
                                            {parsed.data.articles.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {parsed.data.articles.map(
                                                (
                                                    a: any,
                                                    i: number
                                                ) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-start gap-3 border border-black p-3 bg-white"
                                                    >
                                                        <span className="text-xs font-bold bg-black text-white w-6 h-6 flex items-center justify-center flex-shrink-0">
                                                            {i + 1}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm truncate">
                                                                {a.title ||
                                                                    "(tanpa judul)"}
                                                            </p>
                                                            <p className="text-xs text-zinc-500">
                                                                /{a.slug ||
                                                                    "(tanpa slug)"}{" "}
                                                                ·{" "}
                                                                {a.difficulty === "advanced" ? "lanjutan" : a.difficulty === "intermediate" ? "menengah" : "pemula"}
                                                            </p>
                                                            {a.excerpt && (
                                                                <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                                                                    {a.excerpt}
                                                                </p>
                                                            )}
                                                            <p className="text-[10px] text-zinc-300 mt-1">
                                                                {a.content
                                                                    ? `${a.content.length.toLocaleString()} chars`
                                                                    : "⚠️ tidak ada konten"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Path */}
                            {parsed.data.path && (
                                <div className="border-2 border-black p-4 bg-purple-50">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">
                                        🗺️ Alur Belajar
                                    </h4>
                                    <p className="font-bold text-lg">
                                        {parsed.data.path.title}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        /{parsed.data.path.slug}
                                    </p>
                                    {parsed.data.path.description && (
                                        <p className="text-sm text-zinc-600 mt-1">
                                            {parsed.data.path.description}
                                        </p>
                                    )}
                                    {parsed.data.articles && (
                                        <p className="text-xs text-purple-600 mt-2 font-bold">
                                            {parsed.data.articles.length} langkah
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Warnings */}
                            {!parsed.data.topic &&
                                !parsed.data.articles &&
                                !parsed.data.path && (
                                    <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-100 p-3 border-2 border-yellow-400">
                                        <AlertTriangle size={16} />
                                        JSON valid tapi tidak ada field
                                        "topic", "articles", atau "path"
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </div>

            {/* Import Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleImport}
                    disabled={!parsed?.valid || isImporting}
                    className="neo-btn bg-green-500 text-white hover:bg-green-600 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:shadow-none disabled:border-zinc-300 flex items-center gap-2 text-lg px-8 py-3"
                >
                    {isImporting ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />{" "}
                            Mengimpor...
                        </>
                    ) : (
                        <>
                            <Upload size={20} /> Impor Konten
                        </>
                    )}
                </button>
                {parsed?.valid && parsed.data.articles && (
                    <span className="text-sm text-zinc-500">
                        {parsed.data.articles.length} artikel akan diimpor
                    </span>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="border-2 border-red-600 bg-red-50 p-4 flex items-start gap-3">
                    <XCircle
                        className="text-red-600 flex-shrink-0 mt-0.5"
                        size={20}
                    />
                    <div>
                        <p className="font-bold text-red-800">Kesalahan Impor</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle className="text-green-600" size={24} />
                        Impor Selesai
                    </h3>

                    {/* Summary counters */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="border-2 border-green-600 bg-green-50 p-4 text-center">
                            <p className="text-3xl font-black text-green-700">
                                {totalCreated}
                            </p>
                            <p className="text-xs font-bold uppercase text-green-600">
                                Dibuat
                            </p>
                        </div>
                        <div className="border-2 border-yellow-600 bg-yellow-50 p-4 text-center">
                            <p className="text-3xl font-black text-yellow-700">
                                {totalSkipped}
                            </p>
                            <p className="text-xs font-bold uppercase text-yellow-600">
                                Dilewati
                            </p>
                        </div>
                        <div className="border-2 border-red-600 bg-red-50 p-4 text-center">
                            <p className="text-3xl font-black text-red-700">
                                {totalErrors}
                            </p>
                            <p className="text-xs font-bold uppercase text-red-600">
                                Kesalahan
                            </p>
                        </div>
                    </div>

                    {/* Detail */}
                    <div className="space-y-3 text-sm">
                        {result.topic && (
                            <div className="flex items-center gap-2">
                                {result.topic.created ? (
                                    <CheckCircle
                                        className="text-green-600"
                                        size={16}
                                    />
                                ) : (
                                    <AlertTriangle
                                        className="text-yellow-600"
                                        size={16}
                                    />
                                )}
                                <span>
                                    Topik "{result.topic.id}" —{" "}
                                    {result.topic.created
                                        ? "berhasil dibuat"
                                        : "sudah ada (dilewati)"}
                                </span>
                            </div>
                        )}

                        {result.articles.created.length > 0 && (
                            <div>
                                <p className="font-bold text-green-700 mb-1">
                                    ✅ Artikel yang dibuat:
                                </p>
                                <ul className="list-disc list-inside text-xs text-zinc-600 space-y-0.5">
                                    {result.articles.created.map((slug) => (
                                        <li key={slug}>
                                            <a
                                                href={`/articles/${slug}`}
                                                className="underline hover:text-blue-600"
                                                target="_blank"
                                            >
                                                {slug}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.articles.skipped.length > 0 && (
                            <div>
                                <p className="font-bold text-yellow-700 mb-1">
                                    ⏭️ Dilewati (sudah ada):
                                </p>
                                <ul className="list-disc list-inside text-xs text-zinc-500 space-y-0.5">
                                    {result.articles.skipped.map((slug) => (
                                        <li key={slug}>{slug}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.articles.errors.length > 0 && (
                            <div>
                                <p className="font-bold text-red-700 mb-1">
                                    ❌ Kesalahan:
                                </p>
                                <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
                                    {result.articles.errors.map((err, i) => (
                                        <li key={i}>
                                            {err.slug}: {err.error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.path && (
                            <div className="flex items-center gap-2">
                                {result.path.created ? (
                                    <CheckCircle
                                        className="text-green-600"
                                        size={16}
                                    />
                                ) : (
                                    <AlertTriangle
                                        className="text-yellow-600"
                                        size={16}
                                    />
                                )}
                                <span>
                                    Alur Belajar —{" "}
                                    {result.path.created
                                        ? `berhasil dibuat dengan ${result.path.stepsCount} langkah`
                                        : "sudah ada (dilewati)"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

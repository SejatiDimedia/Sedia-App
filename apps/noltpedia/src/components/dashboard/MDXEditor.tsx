import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TextareaAutosize from "react-textarea-autosize";

interface Topic {
    id: string;
    name: string;
}

interface MDXEditorProps {
    articleId?: string;
}

export default function MDXEditor({ articleId }: MDXEditorProps) {
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [topicId, setTopicId] = useState("");
    const [content, setContent] = useState("# Hello World\nStart writing...");
    const [isPublished, setIsPublished] = useState(false);

    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        // Fetch topics for dropdown
        fetch("/api/topics").then(res => res.json()).then(setTopics);

        // If articleId is provided, fetch existing article
        if (articleId) {
            setFetching(true);
            fetch(`/api/articles/${articleId}`)
                .then(res => res.json())
                .then(data => {
                    setTitle(data.title);
                    setSlug(data.slug);
                    setTopicId(data.topicId || "");
                    setContent(data.content || "");
                    setIsPublished(data.isPublished || false);
                })
                .finally(() => setFetching(false));
        }
    }, [articleId]);

    // Auto-generate slug from title (only in Create Mode)
    useEffect(() => {
        if (!articleId) {
            const generated = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            setSlug(generated);
        }
    }, [title, articleId]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const url = articleId ? `/api/articles/${articleId}` : "/api/articles";
            const method = articleId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, slug, content, topicId, isPublished }),
            });

            if (res.ok) {
                alert(articleId ? "Article updated!" : "Article saved!");
                window.location.href = "/dashboard/articles";
            } else {
                const err = await res.json();
                alert("Error: " + err.error);
            }
        } catch (e) {
            alert("Network error");
        }
        setLoading(false);
    };

    if (fetching) return <div className="p-12 text-center font-mono uppercase animate-pulse">Loading Archive...</div>;

    return (
        <div className="flex flex-col h-[85vh]">
            {/* Toolbar */}
            <div className="flex items-center gap-4 mb-4 bg-white p-4 border-2 border-black neo-shadow">
                <input
                    className="flex-1 text-2xl font-black focus:outline-none bg-transparent"
                    placeholder="Article Title..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                <select
                    className="p-2 border-2 border-black font-mono text-sm"
                    value={topicId}
                    onChange={e => setTopicId(e.target.value)}
                >
                    <option value="">Select Topic</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <label className="flex items-center gap-2 font-bold text-sm bg-yellow-100 px-2 py-1 border-2 border-black border-dashed">
                    <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                    PUBLISH
                </label>
                <button onClick={handleSave} disabled={loading} className="neo-btn bg-black text-white hover:bg-zinc-800">
                    {loading ? "SAVING..." : "SAVE ARTICLE"}
                </button>
            </div>

            <div className="flex items-center gap-2 mb-4 text-xs font-mono opacity-60">
                <span>SLUG:</span>
                <input className="bg-transparent border-b border-black w-full focus:outline-none" value={slug} onChange={e => setSlug(e.target.value)} />
            </div>

            {/* Split Pane */}
            <div className="flex-1 grid grid-cols-2 gap-0 border-2 border-black bg-white overflow-hidden">
                {/* Editor */}
                <div className="border-r-2 border-black p-0 bg-zinc-50 overflow-y-auto">
                    <TextareaAutosize
                        className="w-full h-full p-6 bg-transparent border-none resize-none focus:outline-none font-mono text-sm leading-relaxed"
                        minRows={20}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                </div>

                {/* Preview */}
                <div className="p-8 overflow-y-auto prose prose-neutral max-w-none">
                    <article className="prose-headings:font-black prose-a:text-blue-600 prose-pre:bg-black prose-pre:text-white prose-pre:rounded-none prose-img:border-2 prose-img:border-black prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:bg-yellow-50 prose-blockquote:py-1">
                        <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
                    </article>
                </div>
            </div>
        </div>
    );
}

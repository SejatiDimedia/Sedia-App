import React, { useState, useEffect } from "react";
import { signIn, useSession } from "../../lib/auth-client";
import TextareaAutosize from "react-textarea-autosize";
import { Mail } from "lucide-react";

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    user: {
        id: string;
        name: string;
        image?: string;
    } | null;
}

interface CommentSectionProps {
    articleId: string;
}

export default function CommentSection({ articleId }: CommentSectionProps) {
    const { data: session, isPending: isAuthPending } = useSession();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch comments
    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/comments?articleId=${articleId}`);
            if (!res.ok) throw new Error("Failed to fetch comments");
            const data = await res.json();
            setComments(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load comments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [articleId]);

    // Handle Post
    const handlePost = async () => {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articleId, content: newComment }),
            });
            if (!res.ok) throw new Error("Failed to post comment");
            setNewComment("");
            await fetchComments(); // Refresh list
        } catch (err) {
            console.error(err);
            setError("Failed to post comment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Delete
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;
        try {
            const res = await fetch(`/api/comments/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete comment");
            setComments((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            console.error(err);
            alert("Failed to delete comment");
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <section className="mt-12 w-full max-w-3xl mx-auto border-t border-neutral-200 pt-8 dark:border-neutral-800">
            <h3 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-white">
                Diskusi ({comments.length})
            </h3>

            {/* ERROR MSG */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-100">
                    {error}
                </div>
            )}

            {/* COMMENT FORM */}
            <div className="mb-10">
                {isAuthPending ? (
                    <div className="h-24 bg-neutral-100 animate-pulse rounded-lg" />
                ) : session ? (
                    <div className="flex gap-4">
                        <div className="flex-shrink-0">
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name}
                                    className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border border-indigo-200">
                                    {session.user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <TextareaAutosize
                                minRows={3}
                                placeholder="Tulis komentar..."
                                className="w-full p-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none outline-none dark:text-neutral-100"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <div className="mt-2 flex justify-end">
                                <button
                                    onClick={handlePost}
                                    disabled={submitting || !newComment.trim()}
                                    className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-md font-medium text-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                >
                                    {submitting ? "Mengirim..." : "Kirim Komentar"}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-8 text-center">
                        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                            Bergabunglah dalam diskusi untuk bertanya atau berbagi wawasan.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={async () => {
                                    await signIn.social({
                                        provider: "google",
                                        callbackURL: window.location.href,
                                    });
                                }}
                                className="bg-white border border-neutral-300 text-neutral-900 px-6 py-2.5 rounded-full font-medium text-sm hover:bg-neutral-50 transition-colors inline-flex items-center gap-2 shadow-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Google
                            </button>
                            <a
                                href="/login"
                                className="bg-neutral-900 border border-neutral-900 text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 shadow-sm"
                            >
                                <Mail size={16} />
                                <span>Masuk dengan Email</span>
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {/* COMMENT LIST */}
            {loading ? (
                <div className="space-y-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex gap-4 animate-pulse">
                            <div className="w-10 h-10 bg-neutral-200 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-neutral-200 rounded w-1/4" />
                                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <p className="text-center text-neutral-500 py-8 italic">
                    Belum ada komentar. Jadilah yang pertama berkomentar!
                </p>
            ) : (
                <div className="space-y-8">
                    {comments.map((comment) => (
                        <div key={comment.id} className="group flex gap-4">
                            <div className="flex-shrink-0 pt-1">
                                {comment.user?.image ? (
                                    <img
                                        src={comment.user.image}
                                        alt={comment.user.name}
                                        className="w-10 h-10 rounded-full object-cover border border-neutral-100"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center font-bold border border-neutral-200">
                                        {comment.user?.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                            {comment.user?.name || "Anonymous"}
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                    </div>
                                    {(session?.user.id === comment.userId) && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>
                                <div className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

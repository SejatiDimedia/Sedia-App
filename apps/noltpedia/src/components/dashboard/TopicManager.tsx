import React, { useState, useEffect } from "react";
import LucideIcon from "../ui/LucideIcon";

interface Topic {
    id: string;
    name: string;
    description: string;
    icon: string;
    isPublished: boolean;
}

export default function TopicManager() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("");

    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        const res = await fetch("/api/topics");
        const data = await res.json();
        setTopics(data);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        const id = name.toLowerCase().replace(/\s+/g, '-');

        const res = await fetch("/api/topics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, name, description, icon }),
        });

        if (res.ok) {
            setName("");
            setDescription("");
            setIcon("");
            fetchTopics();
        } else {
            alert("Failed to create topic");
        }
    };

    const handleUpdate = async (topic: Topic) => {
        const res = await fetch(`/api/topics/${topic.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(topic),
        });

        if (res.ok) {
            setEditId(null);
            fetchTopics();
        } else {
            alert("Failed to update topic");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this topic?")) return;

        const res = await fetch(`/api/topics/${id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            fetchTopics();
        } else {
            alert("Failed to delete topic");
        }
    };

    return (
        <div className="space-y-8">
            {/* Create Form */}
            <div className="neo-card p-6 bg-white">
                <h3 className="text-xl font-black mb-4 uppercase">Create New Topic</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="text-xs font-bold uppercase">Name</label>
                        <input className="neo-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. PHP" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold uppercase">Description</label>
                        <input className="neo-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description..." />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-xs font-bold uppercase">Icon (Lucide Name)</label>
                        <input className="neo-input" value={icon} onChange={e => setIcon(e.target.value)} placeholder="e.g. code, database, cpu" />
                    </div>
                    <div className="md:col-span-4">
                        <button type="submit" className="neo-btn bg-yellow-400 w-full">+ ADD TOPIC</button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="neo-card p-0 bg-white overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black text-white">
                        <tr>
                            <th className="p-4 border-b-2 border-black font-bold uppercase text-sm">ID</th>
                            <th className="p-4 border-b-2 border-black font-bold uppercase text-sm">Name</th>
                            <th className="p-4 border-b-2 border-black font-bold uppercase text-sm">Description</th>
                            <th className="p-4 border-b-2 border-black font-bold uppercase text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                        ) : topics.map(topic => (
                            <tr key={topic.id} className="border-b border-black hover:bg-zinc-50">
                                <td className="p-4 font-mono text-sm">{topic.id}</td>
                                <td className="p-4 font-bold flex items-center gap-2">
                                    {editId === topic.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                className="border border-black p-1 text-xs w-20"
                                                value={topic.icon}
                                                onChange={e => setTopics(topics.map(t => t.id === topic.id ? { ...t, icon: e.target.value } : t))}
                                                placeholder="icon name"
                                            />
                                            <input
                                                className="border border-black p-1 text-xs"
                                                value={topic.name}
                                                onChange={e => setTopics(topics.map(t => t.id === topic.id ? { ...t, name: e.target.value } : t))}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <LucideIcon name={topic.icon} size={18} strokeWidth={3} /> {topic.name}
                                        </>
                                    )}
                                </td>
                                <td className="p-4 opacity-70 text-sm max-w-xs truncate">
                                    {editId === topic.id ? (
                                        <input
                                            className="border border-black p-1 text-xs w-full"
                                            value={topic.description}
                                            onChange={e => setTopics(topics.map(t => t.id === topic.id ? { ...t, description: e.target.value } : t))}
                                        />
                                    ) : (
                                        topic.description
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        {editId === topic.id ? (
                                            <>
                                                <button onClick={() => handleUpdate(topic)} className="text-green-600 font-bold hover:underline text-xs uppercase">
                                                    Save
                                                </button>
                                                <button onClick={() => setEditId(null)} className="text-zinc-600 font-bold hover:underline text-xs uppercase">
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setEditId(topic.id)} className="text-blue-600 font-bold hover:underline text-xs uppercase">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(topic.id)} className="text-red-600 font-bold hover:underline text-xs uppercase">
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && topics.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center opacity-50">No topics found. Start by creating one.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

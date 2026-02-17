import React, { useState } from "react";
import { signIn } from "../../lib/auth-client";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signIn.email({
                email,
                password,
            }, {
                onSuccess: () => {
                    window.location.href = "/";
                },
                onError: (ctx) => {
                    setError(ctx.error.message);
                    setLoading(false);
                }
            });
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="neo-card p-8 max-w-md w-full mx-auto">
            <h2 className="text-3xl font-black mb-6 uppercase">Login Area</h2>

            {error && (
                <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 mb-4 font-bold">
                    ERROR: {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block font-bold mb-1 uppercase text-sm">Email</label>
                    <input
                        type="email"
                        className="neo-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="hacker@noltpedia.com"
                    />
                </div>
                <div>
                    <label className="block font-bold mb-1 uppercase text-sm">Password</label>
                    <input
                        type="password"
                        className="neo-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                    />
                </div>

                <button type="submit" className="neo-btn bg-yellow-400 text-black w-full mt-4" disabled={loading}>
                    {loading ? "ACCESSING..." : "ENTER ARCHIVE"}
                </button>
            </form>

            <div className="mt-6 text-center text-sm border-t-2 border-black pt-4 opacity-60">
                <p>Restricted Area. Authorized Personnel Only.</p>
            </div>
        </div>
    );
}

import { useState } from "react";
import { signIn } from "../../lib/auth-client";

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signIn.social({
                provider: "google",
                callbackURL: "/dashboard",
            });
        } catch (err) {
            setError("Login failed. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-sky-500/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-emerald-500/10 blur-[100px] rounded-full opacity-30 pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-10">
                    <a href="/" className="inline-flex items-center gap-3 group">
                        <a href="/" className="inline-flex items-center gap-0.5 text-4xl tracking-tight leading-none group hover:scale-105 transition-transform duration-300">
                            <span className="font-extrabold text-sky-500">Sedia</span>
                            <span className="font-normal text-zinc-400">Arcive</span>
                            <span className="text-sky-500 font-bold mb-2 text-5xl">.</span>
                        </a>
                    </a>
                    <p className="mt-4 text-zinc-400 text-sm">Welcome back! Please sign in to continue.</p>
                </div>

                {/* Login Card */}
                <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-8 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="group w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-zinc-50 text-zinc-900 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        {isLoading ? "Signing in..." : "Continue with Google"}
                    </button>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-wider font-medium">
                            <span className="px-3 bg-zinc-900/50 text-zinc-600 backdrop-blur-sm">Or continue with</span>
                        </div>
                    </div>

                    {/* Email Login (Coming Soon) */}
                    <div className="text-center">
                        <button disabled className="w-full px-4 py-3.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-500 text-sm font-medium cursor-not-allowed hover:bg-zinc-800/70 transition-colors flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Sign in with Email (Coming Soon)
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-zinc-500">
                    Don't have an account?{" "}
                    <a href="/register" className="text-sky-400 hover:text-sky-300 font-medium hover:underline transition-colors">
                        Sign up for free
                    </a>
                </p>
                <div className="mt-8 flex justify-center gap-6 text-xs text-zinc-600">
                    <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Service</a>
                </div>
            </div>
        </div>
    );
}

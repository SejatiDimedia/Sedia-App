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
        <div className="min-h-screen w-full flex bg-white relative overflow-hidden">
            {/* Left Side - Form Container */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-24 relative z-10 bg-white">
                {/* Logo */}
                <div className="animate-fade-in-down">
                    <a href="/" className="inline-flex items-center gap-0.5 text-2xl tracking-tight leading-none group hover:scale-[1.02] transition-transform origin-left">
                        <span className="font-extrabold text-sky-600">Sedia</span>
                        <span className="font-normal text-slate-600">Arcive</span>
                        <span className="text-sky-500 font-bold mb-1.5 text-3xl animate-bounce-subtle">.</span>
                    </a>
                </div>

                {/* Main Content */}
                <div className="flex flex-col gap-8 max-w-sm w-full mx-auto animate-fade-in-up delay-100">
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Welcome back
                        </h1>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Sign in to access your files and start organizing your digital world.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3 animate-shake">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 hover:bg-sky-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-sky-600/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 active:translate-y-0 active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12.5S6.42 23 12.1 23c5.83 0 10.13-4.13 9.47-11.9z"
                                />
                            </svg>
                        )}
                        <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
                    </button>

                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase tracking-wider font-medium">Secure Access</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-6 text-sm text-slate-500 animate-fade-in">
                    <span className="text-xs text-slate-400">&copy; 2026 SediaArcive. | Part of SejatiDimedia. | All rights reserved.</span>
                </div>
            </div>

            {/* Right Side - Visual */}
            <div className="hidden lg:flex w-1/2 bg-slate-50 relative overflow-hidden items-center justify-center p-24">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50"></div>

                {/* Animated Gradient Blobs - Aligned with Sky Theme */}
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-sky-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-0 animate-blob" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-0 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-sky-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-0 animate-blob animation-delay-4000" />

                {/* Glass Card Content */}
                <div className="relative z-10 w-full max-w-md perspective-[1000px]">
                    <div className="backdrop-blur-2xl bg-white/60 border border-white/60 p-10 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] transform transition-all hover:scale-[1.02] duration-500 group">

                        {/* Decorative Icon */}
                        <div className="relative w-14 h-14 bg-gradient-to-br from-sky-50 to-white rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-white ring-1 ring-sky-100 group-hover:rotate-6 transition-transform duration-500">
                            <div className="absolute inset-0 bg-sky-400/20 blur-xl rounded-full"></div>
                            <svg className="w-7 h-7 text-sky-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <h2 className="text-3xl font-bold text-slate-800 mb-4 leading-tight">
                            Your digital archive, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-500">perfected.</span>
                        </h2>
                        <p className="text-slate-600 text-lg leading-relaxed">
                            Upload, organize, and share your files with confidence. Fast, secure, and built for the modern cloud.
                        </p>

                        {/* Decor elements */}
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-sky-50 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
                        <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-blue-50 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); opacity: 0.5; }
                    33% { transform: translate(30px, -50px) scale(1.1); opacity: 0.7; }
                    66% { transform: translate(-20px, 20px) scale(0.9); opacity: 0.5; }
                    100% { transform: translate(0px, 0px) scale(1); opacity: 0.5; }
                }
                .animate-blob {
                    animation: blob 10s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
                .delay-100 {
                    animation-delay: 0.1s;
                }
            `}</style>
        </div>
    );
}

// Add animation styles for blobs
// tailwind.config.js usually handles this, but inline styles work for now via arbitrary values or checking global css
// Assuming standard animate-blob is not present, we rely on the blurred shapes which look good even static.
// If needed we can add a style tag.

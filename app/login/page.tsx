"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Authentication failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Successful login
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-black text-[#ededed] relative overflow-hidden font-sans selection:bg-white selection:text-black">
      {/* Vercel minimalist ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] vercel-glow pointer-events-none" />
      <div className="absolute inset-0 vercel-grid-bg opacity-30 pointer-events-none" />

      {/* Top minimal header */}
      <header className="relative z-10 w-full px-6 py-6 flex items-center justify-between border-b border-[#222222]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Vercel triangle logo mark */}
          <svg
            className="w-5 h-5 text-white fill-current"
            viewBox="0 0 75 65"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M37.5 0L75 65H0L37.5 0Z" />
          </svg>
          <span className="text-sm font-medium tracking-tight text-white">Doxera</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1c1c1c] text-[#888888] border border-[#333333]">
            Security
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#888888]">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Operational</span>
        </div>
      </header>

      {/* Main card container */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[400px]">
          {/* Card */}
          <div className="rounded-xl border border-[#222222] bg-[#0a0a0a]/90 backdrop-blur-xl p-8 shadow-2xl transition-all duration-200">
            {/* Header info */}
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#262626] bg-[#141414]">
                <svg
                  className="w-5 h-5 text-white fill-current"
                  viewBox="0 0 75 65"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M37.5 0L75 65H0L37.5 0Z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                Log in to Doxera
              </h1>
              <p className="mt-1.5 text-xs text-[#888888]">
                Enter your credentials to access the protected dashboard
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-950/60 bg-red-950/20 px-3.5 py-3 text-xs text-red-300 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-medium text-[#a1a1aa] mb-1.5"
                >
                  Login / Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full h-10 px-3.5 rounded-lg border border-[#27272a] bg-[#121214] text-sm text-white placeholder-[#52525b] outline-none transition-all duration-150 focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-[#a1a1aa]"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-[#27272a] bg-[#121214] text-sm text-white placeholder-[#52525b] outline-none transition-all duration-150 focus:border-white focus:ring-1 focus:ring-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 mt-2 flex items-center justify-center gap-2 rounded-lg bg-white text-black text-sm font-medium transition-all duration-150 hover:bg-[#e6e6e6] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center text-xs text-[#71717a]">
            Vercel Minimalism Design System &middot; Protected Route
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#71717a] border-t border-[#222222]/60">
        <div>&copy; 2025 Doxera Inc. All rights reserved.</div>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
          <span className="hover:text-white transition-colors cursor-pointer">Security</span>
        </div>
      </footer>
    </div>
  );
}

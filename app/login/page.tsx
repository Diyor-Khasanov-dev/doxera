"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { theme } = useTheme();

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
      const destination = data.redirectTo || (data.role === "llc" ? "/portal" : "/dashboard");
      router.push(destination);
      router.refresh();
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between relative overflow-hidden font-sans transition-colors ${
        theme === "dark"
          ? "bg-black text-[#ededed] selection:bg-white selection:text-black"
          : "bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white"
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] app-ambient-glow pointer-events-none" />
      <div className="absolute inset-0 app-grid-bg opacity-30 pointer-events-none" />

      {/* Top minimal header */}
      <header
        className={`relative z-10 w-full px-6 py-4 flex items-center justify-between border-b backdrop-blur-md ${
          theme === "dark" ? "border-[#222222]/60" : "border-slate-200 bg-white/70 shadow-xs"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <svg
            className={`w-5 h-5 fill-current ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            viewBox="0 0 75 65"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M37.5 0L75 65H0L37.5 0Z" />
          </svg>
          <span className="text-sm font-semibold tracking-tight">Doxera</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${
              theme === "dark"
                ? "bg-[#1c1c1c] text-[#888888] border-[#333333]"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            Security
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-500 mr-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational</span>
          </div>
        </div>
      </header>

      {/* Main card container */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[400px]">
          {/* Card */}
          <div
            className={`rounded-2xl border p-8 shadow-2xl transition-all duration-200 backdrop-blur-xl ${
              theme === "dark"
                ? "border-[#222222] bg-[#0a0a0a]/90 text-[#ededed]"
                : "border-slate-200 bg-white/95 text-slate-900 shadow-xl"
            }`}
          >
            {/* Header info */}
            <div className="text-center mb-6">
              <div
                className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border ${
                  theme === "dark"
                    ? "border-[#262626] bg-[#141414]"
                    : "border-slate-300 bg-slate-100 shadow-xs"
                }`}
              >
                <svg
                  className={`w-5 h-5 fill-current ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                  viewBox="0 0 75 65"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M37.5 0L75 65H0L37.5 0Z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                Log in to Doxera
              </h1>
              <p className="mt-1.5 text-xs text-zinc-400">
                Enter your credentials to access the protected portal
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
                  className="block text-xs font-medium text-zinc-400 mb-1.5"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or apexdynamics"
                  className={`w-full h-10 px-3 rounded-lg border text-xs outline-none transition-colors ${
                    theme === "dark"
                      ? "border-[#28282e] bg-[#141418] text-white placeholder-zinc-500 focus:border-white"
                      : "border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white"
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-zinc-400"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full h-10 pl-3 pr-10 rounded-lg border text-xs font-mono outline-none transition-colors ${
                      theme === "dark"
                        ? "border-[#28282e] bg-[#141418] text-white placeholder-zinc-500 focus:border-white"
                        : "border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
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
                className={`w-full h-10 mt-2 flex items-center justify-center gap-2 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
                  theme === "dark"
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer
        className={`relative z-10 w-full px-6 py-4 border-t text-center text-xs flex flex-col sm:flex-row items-center justify-between gap-2 ${
          theme === "dark" ? "border-[#222222]/60 text-zinc-500" : "border-slate-200 text-slate-500"
        }`}
      >
        <div>&copy; 2026 Doxera Enterprise Systems. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Status</span>
        </div>
      </footer>
    </div>
  );
}

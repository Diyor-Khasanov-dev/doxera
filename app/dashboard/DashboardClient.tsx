"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Layers,
  Activity,
  Shield,
  Server,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  GitBranch,
  Terminal,
  Cpu,
  Database,
  Globe,
  Loader2,
} from "lucide-react";

interface UserProfile {
  username: string;
  name: string;
  role: string;
}

export default function DashboardClient({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#ededed] flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Top Navbar */}
      <nav className="w-full border-b border-[#222222] bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {/* Vercel Triangle */}
            <svg
              className="w-5 h-5 text-white fill-current"
              viewBox="0 0 75 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M37.5 0L75 65H0L37.5 0Z" />
            </svg>
            <span className="text-zinc-600 font-light text-sm">/</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{user.username}</span>
              <span className="text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                PRO
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 text-xs text-zinc-400 pl-4 border-l border-[#222222]">
            <span className="text-white font-medium">doxera-production</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-zinc-500">overview</span>
          </div>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-950/60 bg-emerald-950/20 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Protected Route Active
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-white">
              {user.username.slice(0, 2).toUpperCase()}
            </div>

            <button
              id="logout-button"
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#333333] hover:border-zinc-500 hover:bg-zinc-900 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>Log out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#222222]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Welcome back, {user.username}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-medium text-white border border-white/20">
                {user.role}
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              Your session is securely authenticated. All backend services and deployments are normal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#121214] text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
            >
              <span>Vercel Platform</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Authentication</span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-semibold text-white tracking-tight">Active & Protected</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>HTTP-Only HMAC Session</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Deployment</span>
              <GitBranch className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-xl font-semibold text-white tracking-tight">Production (main)</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>commit: </span>
              <span className="font-mono text-zinc-300">eddebb7 (HEAD)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Server Edge Latency</span>
              <Activity className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-xl font-semibold text-white tracking-tight">18 ms</div>
            <div className="mt-2 text-xs text-zinc-400">
              Global Edge CDN (iad1)
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Middleware Shield</span>
              <Server className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-xl font-semibold text-white tracking-tight">Enabled</div>
            <div className="mt-2 text-xs text-zinc-400">
              Auto-redirect unauthenticated
            </div>
          </div>
        </div>

        {/* Content Section: Project Info & Activity logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Production Deployment Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-sm font-medium text-white">Project Overview</h2>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                  Ready
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between py-2 border-b border-[#1f1f22]">
                  <span className="text-zinc-400">Framework</span>
                  <span className="font-medium text-white">Next.js 16 (App Router + Turbopack)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1f1f22]">
                  <span className="text-zinc-400">Design System</span>
                  <span className="font-medium text-white">Vercel Minimalism</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1f1f22]">
                  <span className="text-zinc-400">Route Security</span>
                  <span className="font-mono text-zinc-300">proxy.ts + server-side session</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-400">Active User</span>
                  <span className="font-mono text-zinc-300">{user.username}</span>
                </div>
              </div>
            </div>

            {/* Edge Diagnostics */}
            <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-medium text-white">Edge Runtime Diagnostics</h2>
              </div>
              <div className="bg-black/60 rounded-lg p-3 font-mono text-[11px] text-zinc-400 border border-zinc-900 leading-relaxed">
                <p className="text-emerald-400">&gt; GET /dashboard HTTP/2.0 200 OK</p>
                <p className="text-zinc-500">x-vercel-cache: HIT</p>
                <p className="text-zinc-500">x-auth-status: verified_session</p>
                <p className="text-zinc-500">user-identity: admin (authenticated)</p>
                <p className="text-zinc-400 mt-2">&gt; All security policies verified.</p>
              </div>
            </div>
          </div>

          {/* Right Col: Quick Stack & Resource Indicators */}
          <div className="space-y-6">
            <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6">
              <h2 className="text-sm font-medium text-white mb-4">System Architecture</h2>
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Cpu className="w-4 h-4 text-zinc-500" />
                  <div>
                    <div className="font-medium text-white">Next.js Turbopack</div>
                    <div className="text-[11px] text-zinc-500">Lightning-fast React 19 engine</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-300">
                  <Database className="w-4 h-4 text-zinc-500" />
                  <div>
                    <div className="font-medium text-white">State Management</div>
                    <div className="text-[11px] text-zinc-500">Secure HTTP-Only cookies</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-300">
                  <Globe className="w-4 h-4 text-zinc-500" />
                  <div>
                    <div className="font-medium text-white">Edge Middleware</div>
                    <div className="text-[11px] text-zinc-500">Sub-millisecond route guarding</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-5">
              <h3 className="text-xs font-medium text-white mb-2">Need to switch accounts?</h3>
              <p className="text-xs text-zinc-400 mb-4">
                You can terminate your active session and return to the login screen at any time.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full py-2 px-3 rounded-lg border border-[#333333] hover:border-zinc-500 bg-[#141416] hover:bg-zinc-800 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Sign out of {user.username}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 border-t border-[#222222] mt-auto">
        <div>Doxera Minimalist Dashboard &middot; Protected Admin Environment</div>
        <div className="mt-2 sm:mt-0 font-mono text-[10px] text-zinc-600">v0.1.0-prod</div>
      </footer>
    </div>
  );
}

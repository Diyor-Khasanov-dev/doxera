"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  DollarSign,
  FileText,
  Clock,
  TrendingUp,
  LogOut,
  Key,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Download,
  Lock,
} from "lucide-react";
import { LLCItem } from "@/lib/models/llc";

export default function PortalPage() {
  const router = useRouter();
  const [llc, setLlc] = useState<LLCItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    async function loadPortalData() {
      try {
        const res = await fetch("/api/portal/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const body = await res.json();
        if (body.success && body.data) {
          setLlc(body.data);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }
    loadPortalData();
  }, [router]);

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    setIsUpdatingPassword(true);

    try {
      const res = await fetch("/api/portal/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password.");
        setIsUpdatingPassword(false);
        return;
      }

      setPasswordSuccess(true);
      setNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch {
      setPasswordError("A network error occurred.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-white mb-3" />
        <p className="text-xs font-mono">Loading LLC Portal session...</p>
      </div>
    );
  }

  if (!llc) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-[#ededed] flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Top Portal Navbar */}
      <nav className="w-full border-b border-[#222222] bg-[#0a0a0c]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo Mark */}
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
            <span className="text-sm font-semibold text-white tracking-tight">
              {llc.companyName}
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              {llc.plan}
            </span>
          </div>
        </div>

        {/* Right Navigation */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-950/60 bg-emerald-950/20 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LLC Entity Active</span>
          </div>

          <button
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
      </nav>

      {/* Main Portal Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Banner */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#222222]">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {llc.companyName}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                {llc.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Registration Ref: <span className="font-mono text-zinc-300">{llc.llcId}</span> &middot; Jurisdiction: <span className="text-white font-medium">{llc.state}</span> &middot; Formation Date: <span className="text-zinc-300">{llc.formationDate}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-lg border border-[#222222] bg-[#0c0c0e] text-xs">
              <span className="text-zinc-500 block text-[10px]">Federal EIN</span>
              <span className="font-mono text-white font-medium">{llc.ein}</span>
            </div>
          </div>
        </div>

        {/* Analytics & Health Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Annual Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight font-mono">
              {formatCurrency(llc.revenue)}
            </div>
            <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Financial filings up to date</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>State Compliance</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight font-mono">
              {llc.analytics?.complianceScore || 95}%
            </div>
            <div className="mt-2 text-xs text-zinc-400">
              Good standing in {llc.state}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Vault Documents</span>
              <FileText className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight font-mono">
              {llc.documentsCount} Files
            </div>
            <div className="mt-2 text-xs text-zinc-400">
              Articles, EIN confirmation & reports
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Active Filings</span>
              <Clock className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight font-mono">
              {llc.analytics?.activeFilings || 1} Registered
            </div>
            <div className="mt-2 text-xs text-zinc-400">
              Registered agent service active
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Monthly Revenue Trajectory & Documents */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Trajectory */}
            <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6">
              <h2 className="text-sm font-semibold text-white mb-4">
                Revenue & Performance Trajectory
              </h2>
              <div className="grid grid-cols-6 gap-2 h-32 items-end bg-[#08080a] p-4 rounded-xl border border-[#1f1f22]">
                {llc.analytics?.monthlyRevenue?.map((rev, idx) => {
                  const maxRev = Math.max(...(llc.analytics?.monthlyRevenue || [1]), 1);
                  const height = Math.max(15, Math.round((rev / maxRev) * 100));
                  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-mono text-zinc-400">
                        ${(rev / 1000).toFixed(0)}k
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-sm"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {months[idx] || `M${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Corporate Documents Repository */}
            <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Corporate Documents & Proofs</h2>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg border border-[#222222] bg-[#121214] hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-medium text-white">Articles of Organization</div>
                      <div className="text-[11px] text-zinc-500">Certified by Secretary of State</div>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#222222] bg-[#121214] hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-medium text-white">IRS EIN Confirmation Letter (CP-575)</div>
                      <div className="text-[11px] text-zinc-500">Federal Tax ID Assignment</div>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#222222] bg-[#121214] hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-medium text-white">Operating Agreement & By-Laws</div>
                      <div className="text-[11px] text-zinc-500">Executed Member Governance</div>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </span>
                </div>
              </div>
            </div>

            {/* Audit History */}
            <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Compliance & Audit Activity</h2>
              <div className="space-y-2 text-xs">
                {llc.analytics?.auditLogs?.map((log, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-[#1e1e22] bg-[#0a0a0c] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-medium text-white">{log.action}</div>
                      {log.detail && <div className="text-[11px] text-zinc-500 mt-0.5">{log.detail}</div>}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Account & Password Settings */}
          <div className="space-y-6">
            <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-4 h-4 text-white" />
                <h2 className="text-sm font-semibold text-white">Security & Password</h2>
              </div>

              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                You are logged in as <span className="font-mono text-white">{llc.username}</span>. You can update your portal access password at any time.
              </p>

              {passwordSuccess && (
                <div className="mb-4 p-3 rounded-lg border border-emerald-950/60 bg-emerald-950/20 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Password changed successfully.</span>
                </div>
              )}

              {passwordError && (
                <div className="mb-4 p-3 rounded-lg border border-red-950/60 bg-red-950/20 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-9 pl-3 pr-8 rounded-lg border border-[#28282e] bg-[#141416] text-white font-mono outline-none focus:border-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-2 px-3 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>Update Password</span>
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 text-xs space-y-3">
              <h3 className="font-semibold text-white">Registered Entity Support</h3>
              <p className="text-zinc-400">
                Need to amend corporate filings, add members, or obtain a Certificate of Good Standing?
              </p>
              <div className="pt-2 border-t border-[#1f1f22]">
                <span className="text-zinc-500 block text-[11px]">Primary Contact</span>
                <span className="text-zinc-300 font-mono">{llc.email}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 border-t border-[#222222] mt-auto">
        <div>Doxera LLC Portal &middot; Secure Entity Dashboard</div>
        <div className="mt-2 sm:mt-0 font-mono text-[10px] text-zinc-600">v0.1.0-prod</div>
      </footer>
    </div>
  );
}

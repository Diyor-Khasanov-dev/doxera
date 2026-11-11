"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Key,
  Mail,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Building,
  Save,
} from "lucide-react";
import { LLCItem } from "@/lib/models/llc";

export default function PortalSettingsPage() {
  const router = useRouter();
  const [llc, setLlc] = useState<LLCItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Email contact state
  const [email, setEmail] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

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
          setEmail(body.data.email || "");
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

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
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch {
      setPasswordError("A network error occurred.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess(false);
    setIsUpdatingEmail(true);

    try {
      const res = await fetch("/api/portal/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || "Failed to update notification email.");
        setIsUpdatingEmail(false);
        return;
      }

      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 4000);
    } catch {
      setEmailError("A network error occurred.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-white mb-3" />
        <p className="text-xs font-mono">Loading portal settings...</p>
      </div>
    );
  }

  if (!llc) {
    return null;
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8">
      {/* Top Header displaying the page name: Settings */}
      <div className="mb-8 pb-6 border-b border-[#222222]">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage credentials, security preferences, and portal access for <span className="text-white font-medium">{llc.companyName}</span>
        </p>
      </div>

      <div className="space-y-8">
        {/* Security / Password section */}
        <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-white" />
            <h2 className="text-sm font-semibold text-white">Password & Authentication</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-6">
            Update your authentication password for username <span className="font-mono text-white font-medium">{llc.username}</span>.
          </p>

          {passwordSuccess && (
            <div className="mb-4 p-3 rounded-lg border border-emerald-950/60 bg-emerald-950/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Password updated successfully.</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 rounded-lg border border-red-950/60 bg-red-950/20 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full h-9 pl-3 pr-8 rounded-lg border border-[#28282e] bg-[#141416] text-white text-xs font-mono outline-none focus:border-zinc-500"
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

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white text-xs font-mono outline-none focus:border-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="py-2 px-4 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Update Password</span>
            </button>
          </form>
        </div>

        {/* Contact and Notifications */}
        <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-white" />
            <h2 className="text-sm font-semibold text-white">Contact & Notifications</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-6">
            Official email address for entity compliance notifications and filing notices.
          </p>

          {emailSuccess && (
            <div className="mb-4 p-3 rounded-lg border border-emerald-950/60 bg-emerald-950/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Contact email updated.</span>
            </div>
          )}

          {emailError && (
            <div className="mb-4 p-3 rounded-lg border border-red-950/60 bg-red-950/20 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{emailError}</span>
            </div>
          )}

          <form onSubmit={handleEmailSave} className="space-y-4 max-w-md">
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white text-xs font-mono outline-none focus:border-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingEmail}
              className="py-2 px-4 rounded-lg border border-[#333338] bg-[#1a1a1f] hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Email Address</span>
            </button>
          </form>
        </div>

        {/* Read-only Entity Reference */}
        <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 text-xs">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-4 h-4 text-white" />
            <h2 className="text-sm font-semibold text-white">Entity Credentials Reference</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg border border-[#1e1e24] bg-[#101014]">
            <div>
              <span className="text-zinc-500 block text-[11px]">Portal Username</span>
              <span className="font-mono text-white">{llc.username}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Entity ID / Reference</span>
              <span className="font-mono text-zinc-300">{llc.llcId}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Jurisdiction</span>
              <span className="text-zinc-300">{llc.state}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

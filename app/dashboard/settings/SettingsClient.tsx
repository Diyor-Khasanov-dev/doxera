"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings as SettingsIcon,
  User,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";

interface AdminData {
  name: string;
  username: string;
  role: string;
}

export default function SettingsClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadAdminProfile() {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error("Failed to load admin profile");
        const json = await res.json();
        if (!ignore && json.success && json.user) {
          const user: AdminData = json.user;
          setName(user.name || "");
          setUsername(user.username || "");
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Failed to load settings. Please refresh the page.");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    loadAdminProfile();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Name cannot be empty.");
      return;
    }

    if (!username.trim()) {
      setErrorMessage("Login username cannot be empty.");
      return;
    }

    if (username.trim().length < 3) {
      setErrorMessage("Login username must be at least 3 characters long.");
      return;
    }

    if (password) {
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Password confirmation does not match.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: { name: string; username: string; password?: string } = {
        name: name.trim(),
        username: username.trim(),
      };

      if (password) {
        payload.password = password;
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update settings.");
        setIsSaving(false);
        return;
      }

      setSuccessMessage("Settings successfully updated.");
      setPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch {
      setErrorMessage("A network error occurred while updating settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-[#222222]">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-zinc-400" />
            <span>Account Settings</span>
          </h1>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            Administrator
          </span>
        </div>
        <p className="text-sm text-zinc-400">
          Manage your administrator profile credentials and access details.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-900/60 bg-emerald-950/20 text-xs text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-950/60 bg-red-950/20 text-xs text-red-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#1f1f22] bg-[#101014] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Administrator Profile & Security</h2>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Role: Administrator</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
            <span>Loading admin profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 text-xs">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-name"
                className="block text-xs font-medium text-zinc-300 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Full Name</span>
              </label>
              <input
                id="admin-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter administrator full name"
                className="w-full h-10 px-3.5 rounded-lg border border-[#28282e] bg-[#141416] text-sm text-white placeholder-zinc-500 outline-none focus:border-white transition-colors"
              />
              <p className="text-[11px] text-zinc-500">
                The name displayed in your workspace and audit logs.
              </p>
            </div>

            {/* Login / Username Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-username"
                className="block text-xs font-medium text-zinc-300 flex items-center gap-1.5"
              >
                <AtSign className="w-3.5 h-3.5 text-zinc-400" />
                <span>Login Username</span>
              </label>
              <input
                id="admin-username"
                type="text"
                required
                minLength={3}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter login username"
                className="w-full h-10 px-3.5 rounded-lg border border-[#28282e] bg-[#141416] text-sm font-mono text-white placeholder-zinc-500 outline-none focus:border-white transition-colors"
              />
              <p className="text-[11px] text-zinc-500">
                The username you will use to sign into the administrative workspace.
              </p>
            </div>

            <div className="pt-4 border-t border-[#1f1f22]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Change Password (Optional)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-medium text-zinc-300"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-[#28282e] bg-[#141416] text-sm font-mono text-white placeholder-zinc-500 outline-none focus:border-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Minimum 6 characters. Leave empty to keep existing password.
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-confirm-password"
                    className="block text-xs font-medium text-zinc-300"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="admin-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={!password}
                      className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-[#28282e] bg-[#141416] text-sm font-mono text-white placeholder-zinc-500 outline-none focus:border-white transition-colors disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={!password}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white disabled:opacity-50"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Re-enter your new password to verify.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-4 border-t border-[#1f1f22] flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

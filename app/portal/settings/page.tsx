"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { LLCItem } from "@/lib/models/llc";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function PortalSettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const [llc, setLlc] = useState<LLCItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Strictly LLC-modifiable fields: companyName, username, password
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
          setCompanyName(body.data.companyName || "");
          setUsername(body.data.username || "");
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validation: Company Name
    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setErrorMessage(t.errNameRequired);
      return;
    }

    // Validation: Login / Username
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      setErrorMessage(t.errLoginRequired);
      return;
    }
    if (trimmedUsername.length < 3) {
      setErrorMessage("Login username must be at least 3 characters.");
      return;
    }

    // Validation: Optional Password change
    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMessage(t.errPasswordLength);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage(t.errPasswordsDontMatch);
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload: { companyName: string; username: string; password?: string } = {
        companyName: trimmedName,
        username: trimmedUsername,
      };

      if (newPassword) {
        payload.password = newPassword;
      }

      const res = await fetch("/api/portal/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update profile settings.");
        setIsSaving(false);
        return;
      }

      setLlc(data.data);
      setCompanyName(data.data.companyName || trimmedName);
      setUsername(data.data.username || trimmedUsername);
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage(t.settingsSuccessMsg);

      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch {
      setErrorMessage("A network error occurred while updating settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const isDark = theme === "dark";

  if (isLoading) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center p-12 ${
          isDark ? "text-zinc-400" : "text-slate-500"
        }`}
      >
        <Loader2 className={`w-6 h-6 animate-spin mb-3 ${isDark ? "text-white" : "text-slate-900"}`} />
        <p className="text-xs font-mono">Loading portal settings...</p>
      </div>
    );
  }

  if (!llc) {
    return null;
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 transition-colors">
      {/* Page Header */}
      <div
        className={`mb-6 pb-6 border-b ${
          isDark ? "border-[#222226]" : "border-slate-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className={`text-2xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {t.settingsTitle}
            </h1>
            <p className={`text-xs mt-1 ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
              {t.settingsSubtitle}
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
              isDark
                ? "bg-[#141418] border-[#27272a] text-zinc-300"
                : "bg-slate-100 border-slate-300 text-slate-700"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{llc.llcId}</span>
          </div>
        </div>

        {/* Regulatory / Permission Scope Notice */}
        <div
          className={`mt-4 p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
            isDark
              ? "bg-[#121217] border-[#222228] text-zinc-400"
              : "bg-amber-50/70 border-amber-200/80 text-amber-900"
          }`}
        >
          <Lock
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              isDark ? "text-amber-400" : "text-amber-600"
            }`}
          />
          <p className="leading-relaxed">{t.settingsRestrictedNotice}</p>
        </div>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-xs font-medium ${
            isDark
              ? "bg-emerald-950/25 border-emerald-900/60 text-emerald-300"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-xs font-medium ${
            isDark
              ? "bg-red-950/25 border-red-900/60 text-red-300"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card: LLC Profile & Credentials (Name, Login, Password ONLY) */}
        <div
          className={`rounded-2xl border p-6 transition-all ${
            isDark
              ? "bg-[#0d0d10] border-[#222228] shadow-lg shadow-black/20"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          {/* Section: Entity Name */}
          <div className="mb-6">
            <label
              htmlFor="settings-company-name"
              className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${
                isDark ? "text-zinc-200" : "text-slate-800"
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${isDark ? "text-zinc-400" : "text-slate-500"}`} />
              <span>{t.companyNameLabel}</span>
              <span className="text-red-400">*</span>
            </label>
            <input
              id="settings-company-name"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t.companyNamePlaceholder}
              className={`w-full h-10 px-3.5 rounded-lg border text-xs font-medium outline-none transition-all ${
                isDark
                  ? "bg-[#141418] border-[#28282e] text-white placeholder-zinc-600 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500"
              }`}
            />
          </div>

          {/* Section: Portal Login (Username) */}
          <div className="mb-6">
            <label
              htmlFor="settings-username"
              className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${
                isDark ? "text-zinc-200" : "text-slate-800"
              }`}
            >
              <User className={`w-3.5 h-3.5 ${isDark ? "text-zinc-400" : "text-slate-500"}`} />
              <span>{t.loginLabel}</span>
              <span className="text-red-400">*</span>
            </label>
            <input
              id="settings-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.loginPlaceholder}
              className={`w-full h-10 px-3.5 rounded-lg border text-xs font-mono outline-none transition-all ${
                isDark
                  ? "bg-[#141418] border-[#28282e] text-white placeholder-zinc-600 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500"
              }`}
            />
          </div>

          <div
            className={`my-6 pt-6 border-t ${
              isDark ? "border-[#222228]" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className={`w-4 h-4 ${isDark ? "text-zinc-300" : "text-slate-700"}`} />
              <h2
                className={`text-sm font-semibold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {t.newPasswordLabel}
              </h2>
            </div>
            <p className={`text-xs mb-4 ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
              {t.newPasswordPlaceholder}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New Password */}
              <div>
                <label
                  htmlFor="settings-password"
                  className={`block text-xs font-semibold mb-2 ${
                    isDark ? "text-zinc-200" : "text-slate-800"
                  }`}
                >
                  {t.newPasswordLabel}
                </label>
                <div className="relative">
                  <input
                    id="settings-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t.newPasswordPlaceholder}
                    className={`w-full h-10 pl-3.5 pr-10 rounded-lg border text-xs font-mono outline-none transition-all ${
                      isDark
                        ? "bg-[#141418] border-[#28282e] text-white placeholder-zinc-600 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
                      isDark ? "text-zinc-500 hover:text-white" : "text-slate-400 hover:text-slate-800"
                    }`}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="settings-confirm-password"
                  className={`block text-xs font-semibold mb-2 ${
                    isDark ? "text-zinc-200" : "text-slate-800"
                  }`}
                >
                  {t.confirmPasswordLabel}
                </label>
                <input
                  id="settings-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  className={`w-full h-10 px-3.5 rounded-lg border text-xs font-mono outline-none transition-all ${
                    isDark
                      ? "bg-[#141418] border-[#28282e] text-white placeholder-zinc-600 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                      : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200 active:bg-zinc-300"
                  : "bg-slate-900 text-white hover:bg-slate-800 active:bg-black"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.savingSettingsBtn}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t.saveSettingsBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Read-Only Entity Security Reference */}
      <div
        className={`mt-8 rounded-2xl border p-6 text-xs ${
          isDark ? "bg-[#0d0d10] border-[#222228]" : "bg-white border-slate-200"
        }`}
      >
        <h3
          className={`text-xs font-semibold uppercase tracking-wider mb-4 ${
            isDark ? "text-zinc-400" : "text-slate-600"
          }`}
        >
          {t.entityCredentialsRef}
        </h3>

        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border ${
            isDark
              ? "border-[#1e1e24] bg-[#141418]"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div>
            <span
              className={`block text-[11px] mb-1 ${
                isDark ? "text-zinc-500" : "text-slate-500"
              }`}
            >
              {t.currentLogin}
            </span>
            <span
              className={`font-mono font-medium ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {llc.username}
            </span>
          </div>

          <div>
            <span
              className={`block text-[11px] mb-1 ${
                isDark ? "text-zinc-500" : "text-slate-500"
              }`}
            >
              {t.entityIdLabel}
            </span>
            <span
              className={`font-mono font-medium ${
                isDark ? "text-zinc-300" : "text-slate-700"
              }`}
            >
              {llc.llcId}
            </span>
          </div>

          <div>
            <span
              className={`block text-[11px] mb-1 ${
                isDark ? "text-zinc-500" : "text-slate-500"
              }`}
            >
              {t.jurisdictionLabel}
            </span>
            <span
              className={`font-medium ${
                isDark ? "text-zinc-300" : "text-slate-700"
              }`}
            >
              {llc.state || "Delaware"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

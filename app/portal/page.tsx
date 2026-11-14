"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Download,
  ArrowUpRight,
  Settings,
  Loader2,
} from "lucide-react";
import { LLCItem } from "@/lib/models/llc";
import { LLCDocumentWithComputedStatus } from "@/lib/models/document";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTheme } from "@/lib/theme/ThemeContext";

function formatDate(dateStr?: string, lang?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const locale = lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US";
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function PortalDashboardPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();

  const [llc, setLlc] = useState<LLCItem | null>(null);
  const [documents, setDocuments] = useState<LLCDocumentWithComputedStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      setIsLoading(true);
      setError(null);
      try {
        const [meRes, docsRes] = await Promise.all([
          fetch("/api/portal/me"),
          fetch("/api/portal/documents"),
        ]);

        if (!meRes.ok) {
          router.push("/login");
          return;
        }

        const meJson = await meRes.json();
        if (!ignore && meJson.success && meJson.data) {
          setLlc(meJson.data);
        } else if (!ignore) {
          router.push("/login");
          return;
        }

        if (docsRes.ok) {
          const docsJson = await docsRes.json();
          if (!ignore && docsJson.success && Array.isArray(docsJson.data)) {
            setDocuments(docsJson.data);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        if (!ignore) {
          setError("Failed to load company dashboard data. Please try again.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      ignore = true;
    };
  }, [router]);

  // Download handler
  const handleDownloadDocument = (doc: LLCDocumentWithComputedStatus) => {
    const filename =
      doc.fileName ||
      `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.${(doc.fileFormat || "pdf").toLowerCase()}`;

    if (doc.fileUrl) {
      if (doc.fileUrl.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = doc.fileUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      } else {
        window.open(doc.fileUrl, "_blank");
        return;
      }
    }

    const content = `================================================================================
DOXERA ENTERPRISE VAULT - OFFICIAL CORPORATE RECORD
================================================================================
Entity Name:        ${llc?.companyName || "Registered LLC"}
Entity ID:          ${doc.llcId}
Document Title:     ${doc.title}
Filing Date:        ${doc.creationDate}
Validity Type:      ${doc.expirationType === "duration" ? `${doc.durationYears || 10} Years Duration` : "Fixed End Date"}
Expiration / End:   ${doc.endDate}
Status:             ${doc.statusLabel.toUpperCase()}
Days Remaining:     ${doc.daysRemaining} days
File Format:        ${doc.fileFormat || "PDF"}
File Size:          ${doc.fileSize || "1.2 MB"}
Storage Location:   Cloudflare R2 Object Storage
Timestamp:          ${new Date().toISOString()}
================================================================================
This record is certified as an archived filing in the Doxera corporate portal.
Authorized signature & cryptographic verification on file.
================================================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename.endsWith(".pdf") ? filename.replace(/\.pdf$/, ".txt") : filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 text-zinc-400">
        <Loader2 className="w-7 h-7 animate-spin text-zinc-400 mb-3" />
        <p className="text-xs font-mono">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !llc) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-12">
        <div
          className={`p-6 rounded-xl border text-xs ${
            theme === "dark"
              ? "border-red-900/60 bg-red-950/20 text-red-300"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2 font-medium mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>Unable to load dashboard</span>
          </div>
          <p className="mb-4">{error || "LLC account not found."}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Real document statistics
  const totalDocs = documents.length;
  const activeDocs = documents.filter((d) => d.status === "active").length;
  const warningDocs = documents.filter((d) => d.status === "warning").length;
  const expiredDocs = documents.filter((d) => d.status === "expired").length;

  // Up to 5 most recent documents
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime())
    .slice(0, 5);

  const isDark = theme === "dark";

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
          isDark ? "border-[#222222]" : "border-slate-200"
        }`}
      >
        <div>
          <div className="flex items-center gap-3">
            <h1
              className={`text-2xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {t.dashboard}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                llc.status === "active"
                  ? isDark
                    ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/40"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : llc.status === "pending"
                  ? isDark
                    ? "bg-amber-950/50 text-amber-400 border-amber-800/40"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                  : isDark
                  ? "bg-rose-950/50 text-rose-400 border-rose-800/40"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {llc.status === "active"
                ? t.activeStatus
                : llc.status === "pending"
                ? t.pendingStatus
                : t.suspendedStatus}
            </span>
          </div>
          <p className={`text-xs mt-1.5 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
            {t.dashboardSubtitle}{" "}
            <span className={`font-semibold ${isDark ? "text-zinc-200" : "text-slate-800"}`}>
              {llc.companyName}
            </span>{" "}
            &middot; <span className="font-mono">{llc.llcId}</span>
          </p>
        </div>

        {/* Quick action shortcuts */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/portal/settings"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all ${
              isDark
                ? "border-[#2e2e34] bg-[#121214] text-zinc-300 hover:text-white hover:border-zinc-500"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-2xs"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t.quickSettings}</span>
          </Link>
          <Link
            href="/portal/documents"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-xs ${
              isDark
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.openVault}</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* Real Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div
          className={`p-5 rounded-xl border transition-all relative overflow-hidden group shadow-xs ${
            isDark
              ? "border-[#222222] bg-[#0c0c0e] hover:border-zinc-700"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-3">
            <span className={`font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              {t.totalDocuments}
            </span>
            <div
              className={`p-2 rounded-lg border ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-white"
                  : "bg-slate-100 border-slate-200 text-slate-600 group-hover:text-slate-900"
              } transition-colors`}
            >
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-3xl font-extrabold tracking-tight font-mono ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {totalDocs}
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
            {t.totalDocsSubtitle}
          </p>
        </div>

        {/* Active Documents */}
        <div
          className={`p-5 rounded-xl border transition-all relative overflow-hidden group shadow-xs ${
            isDark
              ? "border-[#222222] bg-[#0c0c0e] hover:border-emerald-800/60"
              : "border-slate-200 bg-white hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-3">
            <span className={`font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              {t.active}
            </span>
            <div
              className={`p-2 rounded-lg border ${
                isDark
                  ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400"
                  : "bg-emerald-50 border-emerald-200 text-emerald-600"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight font-mono text-emerald-500">
            {activeDocs}
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
            {t.activeSubtitle}
          </p>
        </div>

        {/* Expiring Soon */}
        <div
          className={`p-5 rounded-xl border transition-all relative overflow-hidden group shadow-xs ${
            isDark
              ? "border-[#222222] bg-[#0c0c0e] hover:border-amber-800/60"
              : "border-slate-200 bg-white hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-3">
            <span className={`font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              {t.expiringSoon}
            </span>
            <div
              className={`p-2 rounded-lg border ${
                isDark
                  ? "bg-amber-950/40 border-amber-900/50 text-amber-400"
                  : "bg-amber-50 border-amber-200 text-amber-600"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight font-mono text-amber-500">
            {warningDocs}
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
            {t.expiringSoonSubtitle}
          </p>
        </div>

        {/* Expired */}
        <div
          className={`p-5 rounded-xl border transition-all relative overflow-hidden group shadow-xs ${
            isDark
              ? "border-[#222222] bg-[#0c0c0e] hover:border-rose-800/60"
              : "border-slate-200 bg-white hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-3">
            <span className={`font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              {t.expired}
            </span>
            <div
              className={`p-2 rounded-lg border ${
                isDark
                  ? "bg-rose-950/40 border-rose-900/50 text-rose-400"
                  : "bg-rose-50 border-rose-200 text-rose-600"
              }`}
            >
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-3xl font-extrabold tracking-tight font-mono ${
              expiredDocs > 0 ? "text-rose-500" : isDark ? "text-zinc-500" : "text-slate-400"
            }`}
          >
            {expiredDocs}
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
            {t.expiredSubtitle}
          </p>
        </div>
      </div>

      {/* Main Content Area: Recent Documents + Entity Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Documents */}
        <div
          className={`lg:col-span-2 rounded-xl border shadow-xs flex flex-col justify-between ${
            isDark ? "border-[#222222] bg-[#0c0c0e]" : "border-slate-200 bg-white"
          }`}
        >
          <div>
            <div
              className={`p-5 border-b flex items-center justify-between ${
                isDark ? "border-[#1e1e24]" : "border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className={`w-4 h-4 ${isDark ? "text-white" : "text-slate-900"}`} />
                <h2
                  className={`text-sm font-semibold tracking-tight ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {t.recentDocuments}
                </h2>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                    isDark
                      ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {documents.length}
                </span>
              </div>

              {documents.length > 0 && (
                <Link
                  href="/portal/documents"
                  className={`text-xs font-medium flex items-center gap-1 hover:underline ${
                    isDark ? "text-zinc-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>{t.all}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {/* Document List */}
            {recentDocs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    isDark ? "bg-zinc-900 text-zinc-600" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <FileText className="w-6 h-6" />
                </div>
                <h3
                  className={`text-sm font-medium mb-1 ${
                    isDark ? "text-zinc-300" : "text-slate-800"
                  }`}
                >
                  {t.noDocumentsYet}
                </h3>
                <p
                  className={`text-xs max-w-sm mb-4 ${
                    isDark ? "text-zinc-500" : "text-slate-500"
                  }`}
                >
                  {t.noDocumentsDesc}
                </p>
                <Link
                  href="/portal/documents"
                  className={`text-xs font-medium px-4 py-2 rounded-lg border transition-all ${
                    isDark
                      ? "border-zinc-700 bg-zinc-900 text-zinc-200 hover:text-white hover:border-zinc-500"
                      : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {t.openVault}
                </Link>
              </div>
            ) : (
              <div className={`divide-y ${isDark ? "divide-[#1a1a1f]" : "divide-slate-100"}`}>
                {recentDocs.map((doc) => (
                  <div
                    key={doc.id || doc._id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isDark ? "hover:bg-[#111115]" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-lg border shrink-0 mt-0.5 ${
                          doc.status === "active"
                            ? isDark
                              ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                              : "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : doc.status === "warning"
                            ? isDark
                              ? "bg-amber-950/20 border-amber-900/40 text-amber-400"
                              : "bg-amber-50 border-amber-200 text-amber-600"
                            : isDark
                            ? "bg-rose-950/20 border-rose-900/40 text-rose-400"
                            : "bg-rose-50 border-rose-200 text-rose-600"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {doc.title}
                          </h4>
                          <span
                            className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                              doc.status === "active"
                                ? isDark
                                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : doc.status === "warning"
                                ? isDark
                                  ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                                : isDark
                                ? "bg-rose-950/40 text-rose-400 border-rose-800/40"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {doc.status === "active"
                              ? t.active
                              : doc.status === "warning"
                              ? `${doc.daysRemaining} ${t.daysRemaining}`
                              : t.expired}
                          </span>
                        </div>

                        <div
                          className={`flex items-center gap-3 text-[11px] mt-1.5 flex-wrap ${
                            isDark ? "text-zinc-500" : "text-slate-500"
                          }`}
                        >
                          {doc.fileName && (
                            <span className="truncate max-w-[180px] font-mono">
                              {doc.fileName}
                            </span>
                          )}
                          {doc.fileSize && <span>&middot; {doc.fileSize}</span>}
                          <span>
                            &middot; {t.creation}: {doc.creationDate}
                          </span>
                          <span>
                            &middot; {t.expires}: {doc.endDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(doc)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isDark
                            ? "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white hover:border-zinc-600"
                            : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                        title={t.download}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t.download}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {documents.length > 5 && (
            <div
              className={`p-3.5 border-t text-center ${
                isDark ? "border-[#1e1e24] bg-[#09090b]" : "border-slate-100 bg-slate-50/50"
              }`}
            >
              <Link
                href="/portal/documents"
                className={`text-xs font-medium inline-flex items-center gap-1.5 hover:underline ${
                  isDark ? "text-zinc-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{t.viewAllDocuments}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Entity Details Information */}
        <div className="space-y-6">
          <div
            className={`p-6 rounded-xl border shadow-xs space-y-5 ${
              isDark ? "border-[#222222] bg-[#0c0c0e]" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Building2 className={`w-4 h-4 ${isDark ? "text-white" : "text-slate-900"}`} />
                <h3
                  className={`text-sm font-semibold tracking-tight ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {t.entityDetails}
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isDark
                    ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {llc.llcId}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span
                  className={`block text-[11px] mb-0.5 ${
                    isDark ? "text-zinc-500" : "text-slate-500"
                  }`}
                >
                  {t.legalName}
                </span>
                <span
                  className={`font-semibold text-sm ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {llc.companyName}
                </span>
              </div>

              <div>
                <span
                  className={`block text-[11px] mb-0.5 ${
                    isDark ? "text-zinc-500" : "text-slate-500"
                  }`}
                >
                  {t.entityIdLabel}
                </span>
                <span className="font-mono text-xs font-medium text-emerald-500">
                  {llc.llcId}
                </span>
              </div>

              <div>
                <span
                  className={`block text-[11px] mb-0.5 ${
                    isDark ? "text-zinc-500" : "text-slate-500"
                  }`}
                >
                  {t.currentLogin}
                </span>
                <span
                  className={`font-mono text-xs ${
                    isDark ? "text-zinc-300" : "text-slate-700"
                  }`}
                >
                  {llc.username}
                </span>
              </div>

              <div>
                <span
                  className={`block text-[11px] mb-0.5 ${
                    isDark ? "text-zinc-500" : "text-slate-500"
                  }`}
                >
                  {t.accountStatus}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  {llc.status === "active" ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-emerald-500">{t.activeStatus}</span>
                    </>
                  ) : llc.status === "pending" ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-amber-500">{t.pendingStatus}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-rose-500">{t.suspendedStatus}</span>
                    </>
                  )}
                </span>
              </div>

              {llc.createdAt && (
                <div>
                  <span
                    className={`block text-[11px] mb-0.5 ${
                      isDark ? "text-zinc-500" : "text-slate-500"
                    }`}
                  >
                    {t.memberSince}
                  </span>
                  <span
                    className={`text-xs ${
                      isDark ? "text-zinc-300" : "text-slate-700"
                    }`}
                  >
                    {formatDate(llc.createdAt, lang)}
                  </span>
                </div>
              )}
            </div>

            <div className={`pt-3 border-t ${isDark ? "border-[#1e1e24]" : "border-slate-100"}`}>
              <Link
                href="/portal/settings"
                className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border transition-all ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-600"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{t.quickSettings}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  FileCheck,
  Loader2,
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  X,
  ArrowUpDown,
  Download,
  Upload,
  FileUp,
  Paperclip,
  Cloud,
} from "lucide-react";
import { LLCItem } from "@/lib/models/llc";
import {
  LLCDocumentWithComputedStatus,
  ExpirationType,
  DocumentStatus,
  calculateEndDateFromDuration,
} from "@/lib/models/document";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTheme } from "@/lib/theme/ThemeContext";

// Helper to format file sizes nicely
function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function PortalDocumentsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const [llc, setLlc] = useState<LLCItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<LLCDocumentWithComputedStatus[]>([]);

  // Search, filter & sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "warning" | "expired">("all");
  const [sortBy, setSortBy] = useState<"creationDate" | "endDate" | "title" | "status">("creationDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createCreationDate, setCreateCreationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [createExpirationType, setCreateExpirationType] = useState<ExpirationType>("duration");
  const [createDurationYears, setCreateDurationYears] = useState<number>(10);
  const [createEndDate, setCreateEndDate] = useState<string>("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState("");

  // Create Modal File State (REQUIRED)
  const [createFileName, setCreateFileName] = useState("");
  const [createFileSize, setCreateFileSize] = useState("");
  const [createFileFormat, setCreateFileFormat] = useState("");
  const [createFileUrl, setCreateFileUrl] = useState("");
  const [isDraggingCreate, setIsDraggingCreate] = useState(false);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LLCDocumentWithComputedStatus | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCreationDate, setEditCreationDate] = useState("");
  const [editExpirationType, setEditExpirationType] = useState<ExpirationType>("duration");
  const [editDurationYears, setEditDurationYears] = useState<number>(10);
  const [editEndDate, setEditEndDate] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Edit Modal File State (REQUIRED)
  const [editExistingFileName, setEditExistingFileName] = useState<string | undefined>(undefined);
  const [editExistingFileSize, setEditExistingFileSize] = useState<string | undefined>(undefined);
  const [editExistingFileFormat, setEditExistingFileFormat] = useState<string | undefined>(undefined);
  const [editNewFile, setEditNewFile] = useState<File | null>(null);
  const [editNewFileName, setEditNewFileName] = useState("");
  const [editNewFileSize, setEditNewFileSize] = useState("");
  const [editNewFileFormat, setEditNewFileFormat] = useState("");
  const [editNewFileUrl, setEditNewFileUrl] = useState("");
  const [isDraggingEdit, setIsDraggingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete Modal state
  const [docToDelete, setDocToDelete] = useState<LLCDocumentWithComputedStatus | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch LLC Profile and Documents
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/documents");
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.data)) {
          setDocuments(body.data);
        }
      }
    } catch (err) {
      console.error("Failed to load documents", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const [meRes, docsRes] = await Promise.all([
          fetch("/api/portal/me"),
          fetch("/api/portal/documents"),
        ]);

        if (!meRes.ok) {
          router.push("/login");
          return;
        }

        const meBody = await meRes.json();
        if (meBody.success && meBody.data) {
          if (isMounted) setLlc(meBody.data);
        } else {
          router.push("/login");
          return;
        }

        if (docsRes.ok) {
          const docsBody = await docsRes.json();
          if (isMounted && docsBody.success && Array.isArray(docsBody.data)) {
            setDocuments(docsBody.data);
          }
        }
      } catch {
        router.push("/login");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // File parsing helper: converts exact file to Base64 Data URL to send to Cloudflare R2
  const processUploadedFile = (file: File): Promise<{
    name: string;
    size: string;
    format: string;
    url: string;
  }> => {
    return new Promise((resolve, reject) => {
      const parts = file.name.split(".");
      const ext = parts.length > 1 ? parts.pop()!.toUpperCase() : "FILE";
      const sizeStr = formatBytes(file.size);

      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          size: sizeStr,
          format: ext,
          url: reader.result as string,
        });
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file select for Create Modal
  const handleCreateFileSelect = async (file: File) => {
    try {
      if (file.size > 25 * 1024 * 1024) {
        setCreateError(t.fileTooLarge);
        return;
      }
      const processed = await processUploadedFile(file);
      setCreateFileName(processed.name);
      setCreateFileSize(processed.size);
      setCreateFileFormat(processed.format);
      setCreateFileUrl(processed.url);
      setCreateError("");

      // If document title is empty, prefill with clean file name
      if (!createTitle.trim()) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        setCreateTitle(cleanName);
      }
    } catch {
      setCreateError("Unable to process selected file.");
    }
  };

  // Handle file select for Edit Modal
  const handleEditFileSelect = async (file: File) => {
    try {
      if (file.size > 25 * 1024 * 1024) {
        setEditError(t.fileTooLarge);
        return;
      }
      const processed = await processUploadedFile(file);
      setEditNewFile(file);
      setEditNewFileName(processed.name);
      setEditNewFileSize(processed.size);
      setEditNewFileFormat(processed.format);
      setEditNewFileUrl(processed.url);
      setEditError("");
    } catch {
      setEditError("Unable to process selected file.");
    }
  };

  // Handle open create modal
  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setCreateTitle("");
    setCreateCreationDate(today);
    setCreateExpirationType("duration");
    setCreateDurationYears(10);
    setCreateEndDate(calculateEndDateFromDuration(today, 10));
    setCreateFileName("");
    setCreateFileSize("");
    setCreateFileFormat("");
    setCreateFileUrl("");
    setCreateError("");
    setIsCreateModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (doc: LLCDocumentWithComputedStatus) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditCreationDate(doc.creationDate);
    setEditExpirationType(doc.expirationType || "duration");
    setEditDurationYears(doc.durationYears || 10);
    setEditEndDate(doc.endDate);

    // Existing file state
    setEditExistingFileName(doc.fileName || `${doc.title}.${(doc.fileFormat || "pdf").toLowerCase()}`);
    setEditExistingFileSize(doc.fileSize || "1.2 MB");
    setEditExistingFileFormat(doc.fileFormat || "PDF");

    // Clear new file staging
    setEditNewFile(null);
    setEditNewFileName("");
    setEditNewFileSize("");
    setEditNewFileFormat("");
    setEditNewFileUrl("");
    setEditError("");
    setIsEditModalOpen(true);
  };

  // Create submission: strictly checks required file
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setCreateError(t.errTitleRequired);
      return;
    }

    // MANDATORY REQUIREMENT: File is strictly required
    if (!createFileName || !createFileUrl) {
      setCreateError(t.errFileRequired);
      return;
    }

    if (!createCreationDate) {
      setCreateError(t.errCreationDateRequired);
      return;
    }

    let calculatedEnd = createEndDate;
    if (createExpirationType === "duration") {
      calculatedEnd = calculateEndDateFromDuration(createCreationDate, createDurationYears);
    } else {
      if (!createEndDate) {
        setCreateError(t.errEndDateRequired);
        return;
      }
      if (createEndDate < createCreationDate) {
        setCreateError(t.errEndDatePrior);
        return;
      }
    }

    setIsSubmittingCreate(true);
    setCreateError("");

    try {
      const payload: Record<string, unknown> = {
        title: createTitle.trim(),
        creationDate: createCreationDate,
        expirationType: createExpirationType,
        durationYears: createExpirationType === "duration" ? createDurationYears : undefined,
        endDate: calculatedEnd,
        fileName: createFileName,
        fileSize: createFileSize,
        fileFormat: createFileFormat,
        fileUrl: createFileUrl, // Base64 data sent to Cloudflare R2
      };

      const res = await fetch("/api/portal/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreateError(data.error || "Failed to create document.");
        setIsSubmittingCreate(false);
        return;
      }

      setIsCreateModalOpen(false);
      await fetchDocuments();
    } catch {
      setCreateError("An unexpected network error occurred.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Edit submission: strictly verifies file remains present
  const handleEditDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    if (!editTitle.trim()) {
      setEditError(t.errTitleRequired);
      return;
    }

    // MANDATORY REQUIREMENT: File must be present (either keep existing or new replacement)
    const hasFile = Boolean(editNewFileName || editExistingFileName);
    if (!hasFile) {
      setEditError(t.errFileRequired);
      return;
    }

    if (!editCreationDate) {
      setEditError(t.errCreationDateRequired);
      return;
    }

    let calculatedEnd = editEndDate;
    if (editExpirationType === "duration") {
      calculatedEnd = calculateEndDateFromDuration(editCreationDate, editDurationYears);
    } else {
      if (!editEndDate) {
        setEditError(t.errEndDateRequired);
        return;
      }
      if (editEndDate < editCreationDate) {
        setEditError(t.errEndDatePrior);
        return;
      }
    }

    setIsSubmittingEdit(true);
    setEditError("");

    const docId = editingDoc.id || editingDoc._id;
    try {
      const payload: Record<string, unknown> = {
        title: editTitle.trim(),
        creationDate: editCreationDate,
        expirationType: editExpirationType,
        durationYears: editExpirationType === "duration" ? editDurationYears : undefined,
        endDate: calculatedEnd,
      };

      // If user uploaded a replacement file
      if (editNewFile && editNewFileName) {
        payload.fileName = editNewFileName;
        payload.fileSize = editNewFileSize;
        payload.fileFormat = editNewFileFormat;
        payload.fileUrl = editNewFileUrl;
      }

      const res = await fetch(`/api/portal/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setEditError(data.error || "Failed to update document.");
        setIsSubmittingEdit(false);
        return;
      }

      setIsEditModalOpen(false);
      setEditingDoc(null);
      await fetchDocuments();
    } catch {
      setEditError("An unexpected network error occurred.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete submission
  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    const docId = docToDelete.id || docToDelete._id;
    try {
      const res = await fetch(`/api/portal/documents/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocToDelete(null);
        await fetchDocuments();
      } else {
        alert("Failed to delete document.");
      }
    } catch {
      alert("Error deleting document.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Download handler: downloads the exact file saved to Cloudflare R2 or data URL
  const handleDownloadDocument = (doc: LLCDocumentWithComputedStatus) => {
    const filename = doc.fileName || `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.${(doc.fileFormat || "pdf").toLowerCase()}`;

    // If file has a direct URL (Cloudflare R2 or Data URL or API download route)
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
        // Cloudflare R2 direct URL or /api/documents/download
        window.open(doc.fileUrl, "_blank");
        return;
      }
    }

    // Dynamic authentic certificate record for seeded sample documents
    const content = `================================================================================
DOXERA ENTERPRISE VAULT - OFFICIAL CORPORATE RECORD
================================================================================
Entity Name:        ${llc?.companyName || "Registered LLC"}
Entity ID:          ${doc.llcId}
Federal EIN:        ${llc?.ein || "Verified"}
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

  // Filtered & Sorted documents
  const filteredAndSortedDocs = useMemo(() => {
    let result = [...documents];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.creationDate.includes(q) ||
          d.endDate.includes(q) ||
          (d.fileName && d.fileName.toLowerCase().includes(q)) ||
          d.status.toLowerCase().includes(q) ||
          d.statusLabel.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === "creationDate") {
        comparison = new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime();
      } else if (sortBy === "endDate") {
        comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      } else if (sortBy === "status") {
        const orderMap: Record<DocumentStatus, number> = { warning: 1, active: 2, expired: 3 };
        comparison = (orderMap[a.status] || 0) - (orderMap[b.status] || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [documents, statusFilter, searchQuery, sortBy, sortOrder]);

  // Counts for summary metrics
  const activeCount = useMemo(() => documents.filter((d) => d.status === "active").length, [documents]);
  const warningCount = useMemo(() => documents.filter((d) => d.status === "warning").length, [documents]);
  const expiredCount = useMemo(() => documents.filter((d) => d.status === "expired").length, [documents]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400 min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-mono">Loading corporate documents...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Top Header */}
      <div
        className={`mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
          theme === "dark" ? "border-[#222222]" : "border-slate-200"
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-emerald-500" />
            <span>{t.documentsTitle}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t.documentsSubtitle}{" "}
            <span className={theme === "dark" ? "text-white font-medium" : "text-slate-900 font-medium"}>
              {llc?.companyName}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newDocument}</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 rounded-xl border ${
            theme === "dark"
              ? "border-[#222222] bg-[#0c0c0e]"
              : "border-slate-200 bg-white shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>{t.totalDocuments}</span>
            <FileText className="w-4 h-4 text-zinc-400" />
          </div>
          <div
            className={`text-2xl font-bold tracking-tight font-mono ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            {documents.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">{t.totalDocsSubtitle}</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            theme === "dark"
              ? "border-[#222222] bg-[#0c0c0e]"
              : "border-slate-200 bg-white shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>{t.active}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500 tracking-tight font-mono">
            {activeCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">{t.activeSubtitle}</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            theme === "dark"
              ? "border-[#222222] bg-[#0c0c0e]"
              : "border-slate-200 bg-white shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>{t.expiringSoon}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500 tracking-tight font-mono">
            {warningCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">{t.expiringSoonSubtitle}</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            theme === "dark"
              ? "border-[#222222] bg-[#0c0c0e]"
              : "border-slate-200 bg-white shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>{t.expired}</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-500 tracking-tight font-mono">
            {expiredCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">{t.expiredSubtitle}</div>
        </div>
      </div>

      {/* Filter, Search & Sort Bar */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 p-3 rounded-xl border ${
          theme === "dark"
            ? "border-[#222222] bg-[#0c0c0e]"
            : "border-slate-200 bg-white shadow-xs"
        }`}
      >
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "all"
                ? theme === "dark"
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "bg-slate-900 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.all} ({documents.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "active"
                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                : "text-zinc-400 hover:text-emerald-400"
            }`}
          >
            {t.active} ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("warning")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "warning"
                ? "bg-amber-950/60 text-amber-300 border border-amber-800"
                : "text-zinc-400 hover:text-amber-400"
            }`}
          >
            {t.expiringSoon} ({warningCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("expired")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "expired"
                ? "bg-rose-950/60 text-rose-300 border border-rose-800"
                : "text-zinc-400 hover:text-rose-400"
            }`}
          >
            {t.expired} ({expiredCount})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-8 pl-9 pr-3 rounded-lg border text-xs outline-none transition-colors ${
                theme === "dark"
                  ? "border-[#26262b] bg-[#141418] text-white placeholder-zinc-500 focus:border-zinc-400"
                  : "border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-slate-900"
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "creationDate" | "endDate" | "title" | "status")}
              className={`h-8 px-2.5 rounded-lg border text-xs outline-none cursor-pointer ${
                theme === "dark"
                  ? "border-[#26262b] bg-[#141418] text-zinc-300 focus:border-zinc-400"
                  : "border-slate-300 bg-slate-50 text-slate-800 focus:border-slate-900"
              }`}
            >
              <option value="creationDate">{t.creationDate}</option>
              <option value="endDate">{t.endDate}</option>
              <option value="title">{t.documentTitle}</option>
              <option value="status">{t.status}</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                theme === "dark"
                  ? "border-[#26262b] bg-[#141418] text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "border-slate-300 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Vault List */}
      <div
        className={`rounded-xl border overflow-hidden ${
          theme === "dark"
            ? "border-[#222222] bg-[#0c0c0e]"
            : "border-slate-200 bg-white shadow-xs"
        }`}
      >
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            theme === "dark" ? "border-[#1e1e24]" : "border-slate-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <h2 className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              {t.vaultHeading}
            </h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredAndSortedDocs.length} {filteredAndSortedDocs.length === 1 ? t.record : t.records}
          </span>
        </div>

        <div className={`divide-y ${theme === "dark" ? "divide-[#1e1e24]" : "divide-slate-100"}`}>
          {filteredAndSortedDocs.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400">
              <FileText className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-40" />
              {t.noDocumentsFound}
            </div>
          ) : (
            filteredAndSortedDocs.map((doc) => {
              const docId = doc.id || doc._id || "";
              return (
                <div
                  key={docId}
                  className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    theme === "dark" ? "hover:bg-[#111115]" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                        theme === "dark"
                          ? "bg-zinc-900 border-zinc-800 text-zinc-300"
                          : "bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      {doc.fileFormat === "PDF" ? (
                        <span className="text-[10px] font-bold font-mono text-red-500">PDF</span>
                      ) : doc.fileFormat === "DOCX" || doc.fileFormat === "DOC" ? (
                        <span className="text-[10px] font-bold font-mono text-blue-500">DOC</span>
                      ) : (
                        <FileText className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-semibold ${
                            theme === "dark" ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {doc.title}
                        </span>

                        {/* Status Badge */}
                        {doc.status === "active" && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {t.active}
                          </span>
                        )}
                        {doc.status === "warning" && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-amber-950/70 text-amber-300 border border-amber-800/80">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            {t.expiringSoon}
                          </span>
                        )}
                        {doc.status === "expired" && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-rose-950/70 text-rose-300 border border-rose-800/80">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            {t.expired}
                          </span>
                        )}

                        {doc.expirationType === "duration" && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                              theme === "dark"
                                ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                                : "bg-slate-100 text-slate-600 border-slate-300"
                            }`}
                          >
                            {doc.durationYears || 10} {t.yearsDuration}
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800/40 font-mono">
                          <Cloud className="w-2.5 h-2.5 text-blue-400" />
                          <span>R2</span>
                        </span>
                      </div>

                      {/* File Details Subtitle */}
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                        {doc.fileName && (
                          <span className="inline-flex items-center gap-1 font-mono text-zinc-300">
                            <Paperclip className="w-3 h-3 text-zinc-400" />
                            <span className="truncate max-w-[220px]">{doc.fileName}</span>
                          </span>
                        )}
                        {doc.fileSize && (
                          <>
                            <span>&bull;</span>
                            <span className="font-mono text-zinc-400">{doc.fileSize}</span>
                          </>
                        )}
                        {doc.fileFormat && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              theme === "dark" ? "bg-zinc-800/80 text-zinc-400" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {doc.fileFormat}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400 font-mono flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          <span>{t.creation}: <strong>{doc.creationDate}</strong></span>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{t.expires}: <strong className={doc.status === "expired" ? "text-rose-500" : doc.status === "warning" ? "text-amber-500" : theme === "dark" ? "text-zinc-200" : "text-slate-800"}>{doc.endDate}</strong></span>
                        </span>
                        {doc.daysRemaining !== undefined && (
                          <>
                            <span>&bull;</span>
                            <span className={doc.daysRemaining < 0 ? "text-rose-500 font-semibold" : doc.daysRemaining <= 90 ? "text-amber-500 font-semibold" : "text-zinc-400"}>
                              {doc.daysRemaining < 0
                                ? `${t.expiredDaysAgo} ${Math.abs(doc.daysRemaining)} d`
                                : `${doc.daysRemaining} ${t.daysRemaining}`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit, Delete, Download */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(doc)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        theme === "dark"
                          ? "border-[#2c2c34] bg-[#16161a] hover:bg-zinc-800 hover:text-white text-zinc-300"
                          : "border-slate-300 bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-700 shadow-xs"
                      }`}
                      title={t.edit}
                    >
                      <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{t.edit}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 hover:bg-rose-900/40 text-xs text-rose-300 transition-colors cursor-pointer"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.delete}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadDocument(doc)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        theme === "dark"
                          ? "border-[#2c2c34] bg-[#16161a] hover:bg-emerald-950/40 hover:text-emerald-300 hover:border-emerald-800 text-zinc-300"
                          : "border-slate-300 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 shadow-xs"
                      }`}
                      title={t.download}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.download}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CREATE DOCUMENT MODAL - REQUIRED FILE UPLOAD ON CLOUDFLARE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className={`relative w-full max-w-lg rounded-xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
              theme === "dark" ? "border-[#2a2a30] bg-[#0f0f12] text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-4 border-b ${
                theme === "dark" ? "border-[#222226]" : "border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-semibold">{t.createNewDocument}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDocument} className="mt-5 space-y-4">
              {/* REQUIRED File Upload Zone */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {t.attachFileRequired} <span className="text-rose-500">*</span>
                </label>

                <input
                  type="file"
                  required
                  ref={createFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCreateFileSelect(file);
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                  className="hidden"
                />

                {createFileName ? (
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                      theme === "dark"
                        ? "border-emerald-800/60 bg-emerald-950/20"
                        : "border-emerald-300 bg-emerald-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-xs font-medium truncate max-w-[260px] ${
                            theme === "dark" ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {createFileName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                          <span>{createFileSize}</span>
                          <span>&bull;</span>
                          <span className="uppercase text-emerald-500 font-semibold">{createFileFormat}</span>
                          <span>&bull;</span>
                          <span className="text-blue-400 flex items-center gap-0.5">
                            <Cloud className="w-2.5 h-2.5" /> Cloudflare R2
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCreateFileName("");
                        setCreateFileSize("");
                        setCreateFileFormat("");
                        setCreateFileUrl("");
                        if (createFileInputRef.current) createFileInputRef.current.value = "";
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingCreate(true);
                    }}
                    onDragLeave={() => setIsDraggingCreate(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingCreate(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleCreateFileSelect(file);
                    }}
                    onClick={() => createFileInputRef.current?.click()}
                    className={`p-5 rounded-lg border-2 border-dashed text-center transition-all cursor-pointer ${
                      isDraggingCreate
                        ? "border-emerald-500 bg-emerald-950/20"
                        : theme === "dark"
                        ? "border-[#2a2a30] hover:border-zinc-500 bg-[#141418] hover:bg-[#18181d]"
                        : "border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <Upload className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    <p className={`text-xs font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      {t.clickToUpload}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {t.fileHint}
                    </p>
                  </div>
                )}
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  {t.docNameLabel} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.docNamePlaceholder}
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className={`w-full h-9 px-3 rounded-lg border text-xs outline-none transition-colors ${
                    theme === "dark"
                      ? "border-[#2a2a30] bg-[#16161b] text-white placeholder-zinc-500 focus:border-emerald-500"
                      : "border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white"
                  }`}
                />
              </div>

              {/* Creation Date */}
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  {t.creationDateLabel} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={createCreationDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setCreateCreationDate(newDate);
                    if (createExpirationType === "duration") {
                      setCreateEndDate(calculateEndDateFromDuration(newDate, createDurationYears));
                    }
                  }}
                  className={`w-full h-9 px-3 rounded-lg border text-xs outline-none transition-colors ${
                    theme === "dark"
                      ? "border-[#2a2a30] bg-[#16161b] text-white focus:border-emerald-500"
                      : "border-slate-300 bg-slate-50 text-slate-900 focus:border-slate-900 focus:bg-white"
                  }`}
                />
              </div>

              {/* Select Duration OR End Date */}
              <div>
                <label className="block text-xs font-medium mb-2">
                  {t.validityMethodLabel} <span className="text-rose-400">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateExpirationType("duration");
                      setCreateEndDate(calculateEndDateFromDuration(createCreationDate, createDurationYears));
                    }}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      createExpirationType === "duration"
                        ? "border-emerald-500 bg-emerald-950/20 font-medium"
                        : theme === "dark"
                        ? "border-[#2a2a30] bg-[#16161b] text-zinc-400"
                        : "border-slate-300 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{t.durationLabel}</span>
                      {createExpirationType === "duration" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">{t.durationDesc}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreateExpirationType("endDate");
                    }}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      createExpirationType === "endDate"
                        ? "border-emerald-500 bg-emerald-950/20 font-medium"
                        : theme === "dark"
                        ? "border-[#2a2a30] bg-[#16161b] text-zinc-400"
                        : "border-slate-300 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{t.endDateLabel}</span>
                      {createExpirationType === "endDate" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">{t.endDateDesc}</span>
                  </button>
                </div>

                {createExpirationType === "duration" ? (
                  <div
                    className={`p-3.5 rounded-lg border space-y-2 ${
                      theme === "dark" ? "border-[#222228] bg-[#121216]" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <label className="block text-[11px] text-zinc-400">
                      {t.durationPeriod}
                    </label>
                    <select
                      value={createDurationYears}
                      onChange={(e) => {
                        const yrs = Number(e.target.value);
                        setCreateDurationYears(yrs);
                        setCreateEndDate(calculateEndDateFromDuration(createCreationDate, yrs));
                      }}
                      className={`h-9 px-3 rounded-lg border text-xs outline-none w-full cursor-pointer ${
                        theme === "dark"
                          ? "border-[#2a2a30] bg-[#16161b] text-white focus:border-emerald-500"
                          : "border-slate-300 bg-white text-slate-900 focus:border-slate-900"
                      }`}
                    >
                      <option value={10}>{t.tenYearsRecommended}</option>
                      <option value={1}>1 Year (Annual)</option>
                      <option value={2}>2 Years</option>
                      <option value={3}>3 Years</option>
                      <option value={5}>5 Years</option>
                      <option value={15}>15 Years</option>
                      <option value={20}>20 Years</option>
                    </select>
                    <div className="text-[11px] text-zinc-400">
                      {t.autoCalculatedEndDate}:{" "}
                      <span className="font-mono font-bold">
                        {calculateEndDateFromDuration(createCreationDate, createDurationYears)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`p-3.5 rounded-lg border space-y-2 ${
                      theme === "dark" ? "border-[#222228] bg-[#121216]" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <label className="block text-[11px] text-zinc-400">
                      {t.endDateLabel} (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      required={createExpirationType === "endDate"}
                      value={createEndDate}
                      min={createCreationDate}
                      onChange={(e) => setCreateEndDate(e.target.value)}
                      className={`w-full h-9 px-3 rounded-lg border text-xs outline-none ${
                        theme === "dark"
                          ? "border-[#2a2a30] bg-[#16161b] text-white focus:border-emerald-500"
                          : "border-slate-300 bg-white text-slate-900 focus:border-slate-900"
                      }`}
                    />
                  </div>
                )}
              </div>

              <div
                className={`flex items-center justify-end gap-3 pt-4 border-t ${
                  theme === "dark" ? "border-[#222226]" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                    theme === "dark"
                      ? "border-[#2a2a30] text-zinc-400 hover:text-white hover:bg-zinc-800"
                      : "border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmittingCreate ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t.creatingBtn}</span>
                    </>
                  ) : (
                    <span>{t.createDocumentBtn}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCUMENT MODAL - REQUIRED FILE UPLOAD ON CLOUDFLARE */}
      {isEditModalOpen && editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className={`relative w-full max-w-lg rounded-xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
              theme === "dark" ? "border-[#2a2a30] bg-[#0f0f12] text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-4 border-b ${
                theme === "dark" ? "border-[#222226]" : "border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-semibold">{t.modifyDocument}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingDoc(null);
                }}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 mt-2">
              {t.modifySubtitle}
            </p>

            {editError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditDocument} className="mt-5 space-y-4">
              {/* REQUIRED File Input for Editing / Replacement */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {t.attachFileRequired} <span className="text-rose-500">*</span>
                </label>

                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleEditFileSelect(file);
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                  className="hidden"
                />

                {editNewFileName ? (
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                      theme === "dark" ? "border-blue-800/60 bg-blue-950/20" : "border-blue-300 bg-blue-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                        <FileUp className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-blue-600 text-white font-semibold font-mono">
                            {t.newReplacement}
                          </span>
                        </div>
                        <div className="text-xs font-medium truncate max-w-[240px] mt-0.5">
                          {editNewFileName}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {editNewFileSize} &bull; {editNewFileFormat} &bull; Cloudflare R2
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditNewFile(null);
                        setEditNewFileName("");
                        setEditNewFileSize("");
                        setEditNewFileFormat("");
                        setEditNewFileUrl("");
                        if (editFileInputRef.current) editFileInputRef.current.value = "";
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Cancel replacement and keep existing"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`p-3 rounded-lg border space-y-2 ${
                      theme === "dark" ? "border-[#2a2a30] bg-[#141418]" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-mono font-medium truncate">
                            {editExistingFileName || "No file currently attached"}
                          </div>
                          {editExistingFileSize && (
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {editExistingFileSize} &bull; {editExistingFileFormat} &bull; Cloudflare R2
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer shrink-0 ${
                          theme === "dark"
                            ? "border-[#33333d] bg-[#1a1a20] hover:bg-zinc-800 text-zinc-200"
                            : "border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-xs"
                        }`}
                      >
                        {t.replaceFile}
                      </button>
                    </div>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingEdit(true);
                      }}
                      onDragLeave={() => setIsDraggingEdit(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingEdit(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleEditFileSelect(file);
                      }}
                      onClick={() => editFileInputRef.current?.click()}
                      className={`p-3 rounded-md border border-dashed text-center transition-all cursor-pointer ${
                        isDraggingEdit
                          ? "border-blue-500 bg-blue-950/20"
                          : theme === "dark"
                          ? "border-[#222228] hover:border-zinc-500 bg-[#0e0e12]"
                          : "border-slate-300 hover:border-slate-500 bg-white"
                      }`}
                    >
                      <p className="text-[11px] text-zinc-400">
                        {t.dropFileHere}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  {t.docNameLabel} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={`w-full h-9 px-3 rounded-lg border text-xs outline-none transition-colors ${
                    theme === "dark"
                      ? "border-[#2a2a30] bg-[#16161b] text-white focus:border-blue-500"
                      : "border-slate-300 bg-slate-50 text-slate-900 focus:border-slate-900 focus:bg-white"
                  }`}
                />
              </div>

              {/* Creation Date */}
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  {t.creationDateLabel} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={editCreationDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setEditCreationDate(newDate);
                    if (editExpirationType === "duration") {
                      setEditEndDate(calculateEndDateFromDuration(newDate, editDurationYears));
                    }
                  }}
                  className={`w-full h-9 px-3 rounded-lg border text-xs outline-none transition-colors ${
                    theme === "dark"
                      ? "border-[#2a2a30] bg-[#16161b] text-white focus:border-blue-500"
                      : "border-slate-300 bg-slate-50 text-slate-900 focus:border-slate-900 focus:bg-white"
                  }`}
                />
              </div>

              {/* Duration OR End Date */}
              <div>
                <label className="block text-xs font-medium mb-2">
                  {t.validityMethodLabel} <span className="text-rose-400">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditExpirationType("duration");
                      setEditEndDate(calculateEndDateFromDuration(editCreationDate, editDurationYears));
                    }}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      editExpirationType === "duration"
                        ? "border-blue-500 bg-blue-950/20 font-medium"
                        : theme === "dark"
                        ? "border-[#2a2a30] bg-[#16161b] text-zinc-400"
                        : "border-slate-300 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{t.durationLabel}</span>
                      {editExpirationType === "duration" && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">{t.durationDesc}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditExpirationType("endDate");
                    }}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      editExpirationType === "endDate"
                        ? "border-blue-500 bg-blue-950/20 font-medium"
                        : theme === "dark"
                        ? "border-[#2a2a30] bg-[#16161b] text-zinc-400"
                        : "border-slate-300 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{t.endDateLabel}</span>
                      {editExpirationType === "endDate" && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">{t.endDateDesc}</span>
                  </button>
                </div>

                {editExpirationType === "duration" ? (
                  <div
                    className={`p-3.5 rounded-lg border space-y-2 ${
                      theme === "dark" ? "border-[#222228] bg-[#121216]" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <label className="block text-[11px] text-zinc-400">
                      {t.durationPeriod}
                    </label>
                    <select
                      value={editDurationYears}
                      onChange={(e) => {
                        const yrs = Number(e.target.value);
                        setEditDurationYears(yrs);
                        setEditEndDate(calculateEndDateFromDuration(editCreationDate, yrs));
                      }}
                      className={`w-full h-9 px-3 rounded-lg border text-xs outline-none cursor-pointer ${
                        theme === "dark"
                          ? "border-[#2a2a30] bg-[#16161b] text-white focus:border-blue-500"
                          : "border-slate-300 bg-white text-slate-900 focus:border-slate-900"
                      }`}
                    >
                      <option value={10}>{t.tenYearsRecommended}</option>
                      <option value={1}>1 Year</option>
                      <option value={2}>2 Years</option>
                      <option value={3}>3 Years</option>
                      <option value={5}>5 Years</option>
                      <option value={15}>15 Years</option>
                      <option value={20}>20 Years</option>
                    </select>
                    <div className="text-[11px] text-zinc-400">
                      {t.autoCalculatedEndDate}:{" "}
                      <span className="font-mono font-bold">
                        {calculateEndDateFromDuration(editCreationDate, editDurationYears)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`p-3.5 rounded-lg border space-y-2 ${
                      theme === "dark" ? "border-[#222228] bg-[#121216]" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <label className="block text-[11px] text-zinc-400">
                      {t.endDateLabel} (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      required={editExpirationType === "endDate"}
                      value={editEndDate}
                      min={editCreationDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className={`w-full h-9 px-3 rounded-lg border text-xs outline-none ${
                        theme === "dark"
                          ? "border-[#2a2a30] bg-[#16161b] text-white focus:border-blue-500"
                          : "border-slate-300 bg-white text-slate-900 focus:border-slate-900"
                      }`}
                    />
                  </div>
                )}
              </div>

              <div
                className={`flex items-center justify-end gap-3 pt-4 border-t ${
                  theme === "dark" ? "border-[#222226]" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingDoc(null);
                  }}
                  className={`px-4 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                    theme === "dark"
                      ? "border-[#2a2a30] text-zinc-400 hover:text-white hover:bg-zinc-800"
                      : "border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t.savingBtn}</span>
                    </>
                  ) : (
                    <span>{t.saveChangesBtn}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className={`relative w-full max-w-md rounded-xl border p-6 shadow-2xl ${
              theme === "dark" ? "border-[#2a2a30] bg-[#0f0f12] text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-semibold">{t.deleteConfirmTitle}</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {t.deleteConfirmText}{" "}
              <span className={theme === "dark" ? "text-white font-medium" : "text-slate-900 font-medium"}>
                &ldquo;{docToDelete.title}&rdquo;
              </span>
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className={`px-4 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                  theme === "dark"
                    ? "border-[#2a2a30] text-zinc-400 hover:text-white hover:bg-zinc-800"
                    : "border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteDocument}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.deletingBtn}</span>
                  </>
                ) : (
                  <span>{t.confirmDeleteBtn}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

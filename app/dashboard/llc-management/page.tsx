"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Building2,
  Plus,
  Search,
  Key,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Loader2,
  RefreshCw,
  Copy,
  FileText,
  FileCheck,
  Download,
  Upload,
  Paperclip,
} from "lucide-react";
import { LLCItem } from "@/lib/models/llc";
import {
  LLCDocumentWithComputedStatus,
  ExpirationType,
  calculateEndDateFromDuration,
} from "@/lib/models/document";

// Helper to format file sizes nicely
function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function LLCManagementPage() {
  const [llcs, setLlcs] = useState<LLCItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);

  // LLC Documents modal state (Admin managing documents for LLC)
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedLLCForDocs, setSelectedLLCForDocs] = useState<LLCItem | null>(null);
  const [llcDocs, setLlcDocs] = useState<LLCDocumentWithComputedStatus[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [docFilter, setDocFilter] = useState<"all" | "active" | "warning" | "expired">("all");

  // Admin Document Create / Edit modal state
  const [docSubModalOpen, setDocSubModalOpen] = useState<"create" | "edit" | null>(null);
  const [editingLLCDoc, setEditingLLCDoc] = useState<LLCDocumentWithComputedStatus | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docCreationDate, setDocCreationDate] = useState(new Date().toISOString().split("T")[0]);
  const [docExpirationType, setDocExpirationType] = useState<ExpirationType>("duration");
  const [docDurationYears, setDocDurationYears] = useState(10);
  const [docEndDate, setDocEndDate] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [docFileSize, setDocFileSize] = useState("");
  const [docFileFormat, setDocFileFormat] = useState("");
  const [docFileUrl, setDocFileUrl] = useState("");
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  const [docFormError, setDocFormError] = useState("");
  const [isDraggingAdminDoc, setIsDraggingAdminDoc] = useState(false);
  const adminDocFileInputRef = useRef<HTMLInputElement>(null);

  // Selected item for operations
  const [selectedLLC, setSelectedLLC] = useState<LLCItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    companyName: "",
    username: "",
    password: "",
    status: "active" as "active" | "pending" | "suspended",
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load LLCs
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const llcRes = await fetch("/api/llcs");
      const llcData = await llcRes.json();

      if (llcData.success) {
        setLlcs(llcData.data);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const llcRes = await fetch("/api/llcs");
        const llcData = await llcRes.json();
        if (!ignore) {
          if (llcData.success) setLlcs(llcData.data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        if (!ignore) setIsLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Filtered LLCs
  const filteredLLCs = useMemo(() => {
    return llcs.filter((item) => {
      const matchesSearch =
        search === "" ||
        item.companyName.toLowerCase().includes(search.toLowerCase()) ||
        item.username.toLowerCase().includes(search.toLowerCase()) ||
        item.llcId.toLowerCase().includes(search.toLowerCase()) ||
        item.ein.includes(search);

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [llcs, search, statusFilter]);

  // Handle Create LLC
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/llcs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          username: formData.username,
          password: formData.password,
          status: formData.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create LLC");
        setIsSubmitting(false);
        return;
      }

      setCreateModalOpen(false);
      resetForm();
      await fetchData();
    } catch {
      setFormError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit LLC
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLLC) return;
    setFormError("");

    const updatePayload: Record<string, unknown> = {};

    if (formData.companyName.trim()) {
      updatePayload.companyName = formData.companyName.trim();
    }
    if (formData.username.trim()) {
      updatePayload.username = formData.username.trim();
    }
    if (formData.password.trim()) {
      if (formData.password.trim().length < 6) {
        setFormError("Password must be at least 6 characters long.");
        return;
      }
      updatePayload.password = formData.password.trim();
    }
    if (formData.status) {
      updatePayload.status = formData.status;
    }

    if (Object.keys(updatePayload).length === 0) {
      setEditModalOpen(false);
      setSelectedLLC(null);
      return;
    }

    setIsSubmitting(true);

    try {
      const targetId = selectedLLC._id || selectedLLC.llcId;
      const res = await fetch(`/api/llcs/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to update LLC");
        setIsSubmitting(false);
        return;
      }

      setEditModalOpen(false);
      setSelectedLLC(null);
      await fetchData();
    } catch {
      setFormError("A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Reset
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLLC || !newPasswordInput) return;
    setFormError("");
    setIsSubmitting(true);

    try {
      const targetId = selectedLLC._id || selectedLLC.llcId;
      const res = await fetch(`/api/llcs/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPasswordInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to update password");
        setIsSubmitting(false);
        return;
      }

      setCredentialsModalOpen(false);
      setNewPasswordInput("");
      setSelectedLLC(null);
      await fetchData();
    } catch {
      setFormError("Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete LLC
  const handleDeleteConfirm = async () => {
    if (!selectedLLC) return;
    setIsSubmitting(true);

    try {
      const targetId = selectedLLC._id || selectedLLC.llcId;
      const res = await fetch(`/api/llcs/${targetId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete LLC");
        setIsSubmitting(false);
        return;
      }

      setDeleteModalOpen(false);
      setSelectedLLC(null);
      await fetchData();
    } catch {
      alert("Error deleting LLC");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      username: "",
      password: "",
      status: "active",
    });
    setFormError("");
    setShowPassword(false);
    setShowEditPassword(false);
  };

  const openEditModal = (item: LLCItem) => {
    setSelectedLLC(item);
    setFormData({
      companyName: item.companyName,
      username: item.username,
      password: "",
      status: item.status,
    });
    setShowEditPassword(false);
    setFormError("");
    setEditModalOpen(true);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open LLC Documents Management
  const fetchLLCDocs = async (llcId: string) => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch(`/api/portal/documents?llcId=${llcId}`);
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.data)) {
          setLlcDocs(body.data);
        }
      }
    } catch (err) {
      console.error("Failed to load LLC docs:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const openDocumentsModal = (item: LLCItem) => {
    setSelectedLLCForDocs(item);
    setDocFilter("all");
    setDocumentsModalOpen(true);
    fetchLLCDocs(item.llcId || item._id || "");
  };

  // File parsing for Admin
  const handleAdminDocFileSelect = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      setDocFormError("File size exceeds 25MB.");
      return;
    }
    const parts = file.name.split(".");
    const ext = parts.length > 1 ? parts.pop()!.toUpperCase() : "FILE";
    const sizeStr = formatBytes(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      setDocFileName(file.name);
      setDocFileSize(sizeStr);
      setDocFileFormat(ext);
      setDocFileUrl(reader.result as string);
      setDocFormError("");
      if (!docTitle.trim()) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        setDocTitle(cleanName);
      }
    };
    reader.readAsDataURL(file);
  };

  const openCreateDocModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setDocTitle("");
    setDocCreationDate(today);
    setDocExpirationType("duration");
    setDocDurationYears(10);
    setDocEndDate(calculateEndDateFromDuration(today, 10));
    setDocFileName("");
    setDocFileSize("");
    setDocFileFormat("");
    setDocFileUrl("");
    setDocFormError("");
    setDocSubModalOpen("create");
  };

  const openEditDocModal = (doc: LLCDocumentWithComputedStatus) => {
    setEditingLLCDoc(doc);
    setDocTitle(doc.title);
    setDocCreationDate(doc.creationDate);
    setDocExpirationType(doc.expirationType || "duration");
    setDocDurationYears(doc.durationYears || 10);
    setDocEndDate(doc.endDate);
    setDocFileName(doc.fileName || "");
    setDocFileSize(doc.fileSize || "");
    setDocFileFormat(doc.fileFormat || "");
    setDocFileUrl(doc.fileUrl || "");
    setDocFormError("");
    setDocSubModalOpen("edit");
  };

  const handleAdminDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLLCForDocs) return;

    if (!docTitle.trim()) {
      setDocFormError("Please enter document title.");
      return;
    }
    if (!docCreationDate) {
      setDocFormError("Please select creation date.");
      return;
    }

    let calculatedEnd = docEndDate;
    if (docExpirationType === "duration") {
      calculatedEnd = calculateEndDateFromDuration(docCreationDate, docDurationYears);
    } else {
      if (!docEndDate) {
        setDocFormError("Please select end date.");
        return;
      }
      if (docEndDate < docCreationDate) {
        setDocFormError("End date cannot be prior to creation date.");
        return;
      }
    }

    setIsSubmittingDoc(true);
    setDocFormError("");

    try {
      const targetLlcId = selectedLLCForDocs.llcId || selectedLLCForDocs._id || "";

      if (docSubModalOpen === "create") {
        const payload: Record<string, unknown> = {
          llcId: targetLlcId,
          title: docTitle.trim(),
          creationDate: docCreationDate,
          expirationType: docExpirationType,
          durationYears: docExpirationType === "duration" ? docDurationYears : undefined,
          endDate: calculatedEnd,
          fileName: docFileName || undefined,
          fileSize: docFileSize || undefined,
          fileFormat: docFileFormat || undefined,
          fileUrl: docFileUrl || undefined,
        };

        const res = await fetch("/api/portal/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          setDocFormError(errData.error || "Failed to create document.");
          setIsSubmittingDoc(false);
          return;
        }
      } else if (docSubModalOpen === "edit" && editingLLCDoc) {
        const docId = editingLLCDoc.id || editingLLCDoc._id;
        const payload: Record<string, unknown> = {
          title: docTitle.trim(),
          creationDate: docCreationDate,
          expirationType: docExpirationType,
          durationYears: docExpirationType === "duration" ? docDurationYears : undefined,
          endDate: calculatedEnd,
          fileName: docFileName || undefined,
          fileSize: docFileSize || undefined,
          fileFormat: docFileFormat || undefined,
          fileUrl: docFileUrl || undefined,
        };

        const res = await fetch(`/api/portal/documents/${docId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          setDocFormError(errData.error || "Failed to update document.");
          setIsSubmittingDoc(false);
          return;
        }
      }

      setDocSubModalOpen(null);
      await fetchLLCDocs(targetLlcId);
      await fetchData(); // refresh count
    } catch {
      setDocFormError("An unexpected network error occurred.");
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  const handleAdminDeleteDoc = async (doc: LLCDocumentWithComputedStatus) => {
    if (!selectedLLCForDocs) return;
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

    const docId = doc.id || doc._id;
    try {
      const res = await fetch(`/api/portal/documents/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchLLCDocs(selectedLLCForDocs.llcId || selectedLLCForDocs._id || "");
        await fetchData();
      }
    } catch {
      alert("Failed to delete document.");
    }
  };

  const handleAdminDownloadDoc = (doc: LLCDocumentWithComputedStatus) => {
    const filename = doc.fileName || `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.${(doc.fileFormat || "pdf").toLowerCase()}`;

    if (doc.fileUrl && doc.fileUrl.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const content = `================================================================================
DOXERA ENTERPRISE VAULT - OFFICIAL CORPORATE RECORD
================================================================================
Entity:             ${selectedLLCForDocs?.companyName || doc.llcId}
Entity ID:          ${doc.llcId}
Document:           ${doc.title}
Filing Date:        ${doc.creationDate}
Validity Type:      ${doc.expirationType === "duration" ? `${doc.durationYears || 10} Years Duration` : "Fixed End Date"}
Expiration Date:    ${doc.endDate}
Status:             ${doc.statusLabel.toUpperCase()}
Format:             ${doc.fileFormat || "PDF"}
Size:               ${doc.fileSize || "1.2 MB"}
Record ID:          ${doc.id || doc._id}
Timestamp:          ${new Date().toISOString()}
================================================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".pdf") ? filename.replace(/\.pdf$/, ".txt") : filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredAdminDocs = useMemo(() => {
    if (docFilter === "all") return llcDocs;
    return llcDocs.filter((d) => d.status === docFilter);
  }, [llcDocs, docFilter]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-zinc-400" />
              <span>LLC Management & Credentials</span>
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              Verified Records
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Create and manage registered LLC entities, configure client portal access credentials, and manage vault documents with integrated files.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New LLC</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-3 rounded-xl border border-[#222222] bg-[#0a0a0c]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search LLC by name, username, code, or EIN..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#27272a] bg-[#121214] text-xs text-white placeholder-zinc-500 outline-none focus:border-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#27272a] bg-[#121214] text-xs text-zinc-300 outline-none focus:border-white transition-colors cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            type="button"
            onClick={fetchData}
            title="Refresh List"
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#27272a] bg-[#121214] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main LLC Data Table */}
      <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#222222] bg-[#101014] text-zinc-400 font-medium">
                <th className="py-3 px-4">Entity & Reference</th>
                <th className="py-3 px-4">Portal Login</th>
                <th className="py-3 px-4">Documents</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1b1e]">
              {isLoading && llcs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    <span>Loading registered LLCs...</span>
                  </td>
                </tr>
              ) : filteredLLCs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <Building2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-zinc-400 font-medium">No LLC entities found.</p>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      {search || statusFilter !== "all"
                        ? "Try adjusting your search filters"
                        : "Click 'Register New LLC' to create your first company"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLLCs.map((item) => (
                  <tr
                    key={item._id || item.llcId}
                    className="hover:bg-[#141418] transition-colors group"
                  >
                    {/* Entity Details */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {item.companyName}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-zinc-500 text-[11px]">
                          <span className="font-mono text-zinc-400">{item.llcId}</span>
                          <span>&middot;</span>
                          <span>EIN: {item.ein}</span>
                        </div>
                      </div>
                    </td>

                    {/* Portal Login Credentials */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-[#16161a] border border-[#28282e] px-2 py-0.5 rounded text-zinc-200">
                          {item.username}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.username, `user-${item.llcId}`)}
                          className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                          title="Copy login username"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copiedId === `user-${item.llcId}` && (
                          <span className="text-[10px] text-emerald-400">Copied</span>
                        )}
                      </div>
                    </td>

                    {/* Documents Vault Button */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => openDocumentsModal(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#28282e] bg-[#141418] hover:bg-emerald-950/40 hover:border-emerald-800 text-zinc-300 hover:text-emerald-300 transition-colors cursor-pointer"
                        title="Manage documents and files for this LLC"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-mono font-medium">{item.documentsCount ?? 0}</span>
                        <span className="text-[10px] text-zinc-500">Files</span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          item.status === "active"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                            : item.status === "pending"
                            ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                            : "bg-red-950/40 text-red-400 border-red-800/40"
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Manage Documents */}
                        <button
                          type="button"
                          onClick={() => openDocumentsModal(item)}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Manage Documents & Files"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset / Set password */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLLC(item);
                            setNewPasswordInput("");
                            setCredentialsModalOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                          title="Manage Login Credentials"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit LLC */}
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Edit LLC"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete LLC */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLLC(item);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete LLC"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info banner */}
        <div className="p-3 border-t border-[#222222] bg-[#09090b] flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
          <div>
            Showing <span className="text-zinc-300 font-medium">{filteredLLCs.length}</span> of{" "}
            <span className="text-zinc-300 font-medium">{llcs.length}</span> total entities
          </div>
          <div className="flex items-center gap-3">
            <span>LLC Portal login URL: <span className="font-mono text-zinc-400">/login</span></span>
            <span className="text-zinc-600">&middot;</span>
            <span>Target Panel: <span className="font-mono text-zinc-400">/portal</span></span>
          </div>
        </div>
      </div>

      {/* CREATE LLC MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-white" />
                <h3 className="text-base font-semibold text-white">Create Registered LLC</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg border border-red-950/60 bg-red-950/20 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Apex Holdings LLC"
                  className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Login *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. apexadmin"
                  className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white font-mono outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full h-9 pl-3 pr-8 rounded-lg border border-[#28282e] bg-[#141416] text-white font-mono outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "active" | "pending" | "suspended" })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white outline-none focus:border-white cursor-pointer"
                >
                  <option value="active">active</option>
                  <option value="pending">pending</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#28282e] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Create Entity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LLC MODAL */}
      {editModalOpen && selectedLLC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-white" />
                <h3 className="text-base font-semibold text-white">Edit {selectedLLC.companyName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg border border-red-950/60 bg-red-950/20 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder={selectedLLC.companyName}
                  className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Login</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder={selectedLLC.username}
                  className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white font-mono outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Password (leave blank to keep current)</label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full h-9 pl-3 pr-8 rounded-lg border border-[#28282e] bg-[#141416] text-white font-mono outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "active" | "pending" | "suspended" })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white outline-none focus:border-white cursor-pointer"
                >
                  <option value="active">active</option>
                  <option value="pending">pending</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#28282e] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS RESET MODAL */}
      {credentialsModalOpen && selectedLLC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">Manage LLC Credentials</h3>
              </div>
              <button
                type="button"
                onClick={() => setCredentialsModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Update password for <span className="text-white font-medium">{selectedLLC.companyName}</span> ({selectedLLC.username}).
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-lg border border-red-950/60 bg-red-950/20 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new 6+ char password"
                    className="w-full h-9 pl-3 pr-8 rounded-lg border border-[#28282e] bg-[#141416] text-white font-mono outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setCredentialsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#28282e] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-amber-400 text-black font-medium hover:bg-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : null}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && selectedLLC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-red-900/40 bg-[#0c0c0e] p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Delete LLC Entity?</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 my-4 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-semibold text-white">{selectedLLC.companyName}</span> ({selectedLLC.llcId}) and revoke portal login credentials for user <span className="font-mono text-zinc-200">{selectedLLC.username}</span>?
            </p>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#28282e] text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LLC DOCUMENTS VAULT MODAL (ADMIN) */}
      {documentsModalOpen && selectedLLCForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-xl border border-[#26262b] bg-[#0c0c0e] p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            {/* Top header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#222226]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <span>Documents Vault: {selectedLLCForDocs.companyName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                      {selectedLLCForDocs.llcId}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Manage corporate filings, valid terms, and file attachments for this entity.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openCreateDocModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentsModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 py-3 border-b border-[#1f1f24] text-xs">
              <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-medium">Status:</span>
              <button
                type="button"
                onClick={() => setDocFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  docFilter === "all" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                }`}
              >
                All ({llcDocs.length})
              </button>
              <button
                type="button"
                onClick={() => setDocFilter("active")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  docFilter === "active" ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800" : "text-zinc-400 hover:text-emerald-300"
                }`}
              >
                Active ({llcDocs.filter((d) => d.status === "active").length})
              </button>
              <button
                type="button"
                onClick={() => setDocFilter("warning")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  docFilter === "warning" ? "bg-amber-950/60 text-amber-300 border border-amber-800" : "text-zinc-400 hover:text-amber-300"
                }`}
              >
                Expiring Soon ({llcDocs.filter((d) => d.status === "warning").length})
              </button>
              <button
                type="button"
                onClick={() => setDocFilter("expired")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  docFilter === "expired" ? "bg-rose-950/60 text-rose-300 border border-rose-800" : "text-zinc-400 hover:text-rose-300"
                }`}
              >
                Expired ({llcDocs.filter((d) => d.status === "expired").length})
              </button>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#1e1e24] my-2 pr-1">
              {isLoadingDocs ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                  <span>Loading LLC documents...</span>
                </div>
              ) : filteredAdminDocs.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                  <p>No documents found for this entity.</p>
                </div>
              ) : (
                filteredAdminDocs.map((doc) => {
                  return (
                    <div
                      key={doc.id || doc._id}
                      className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#121216] rounded-lg transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-white">{doc.title}</span>

                            {doc.status === "active" && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800">
                                Active
                              </span>
                            )}
                            {doc.status === "warning" && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full font-medium bg-amber-950/70 text-amber-300 border border-amber-800">
                                Expiring Soon
                              </span>
                            )}
                            {doc.status === "expired" && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full font-medium bg-rose-950/70 text-rose-300 border border-rose-800">
                                Expired
                              </span>
                            )}

                            {doc.expirationType === "duration" && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                                {doc.durationYears || 10}Y
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                            {doc.fileName && (
                              <span className="inline-flex items-center gap-1 font-mono text-zinc-300">
                                <Paperclip className="w-3 h-3 text-zinc-500" />
                                <span className="truncate max-w-[200px]">{doc.fileName}</span>
                              </span>
                            )}
                            {doc.fileSize && (
                              <>
                                <span>&bull;</span>
                                <span className="font-mono text-zinc-500">{doc.fileSize}</span>
                              </>
                            )}
                            {doc.fileFormat && (
                              <span className="text-[10px] px-1 rounded bg-zinc-800 text-zinc-400 font-mono">
                                {doc.fileFormat}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-500 font-mono flex-wrap">
                            <span>Created: <strong className="text-zinc-300">{doc.creationDate}</strong></span>
                            <span>&bull;</span>
                            <span>Expires: <strong className={doc.status === "expired" ? "text-rose-400" : doc.status === "warning" ? "text-amber-400" : "text-zinc-300"}>{doc.endDate}</strong></span>
                            {doc.daysRemaining !== undefined && (
                              <>
                                <span>&bull;</span>
                                <span className={doc.daysRemaining < 0 ? "text-rose-400 font-semibold" : doc.daysRemaining <= 90 ? "text-amber-400 font-semibold" : "text-zinc-400"}>
                                  {doc.daysRemaining < 0 ? `Expired ${Math.abs(doc.daysRemaining)}d ago` : `${doc.daysRemaining}d remaining`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => openEditDocModal(doc)}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Edit Document"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminDownloadDoc(doc)}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminDeleteDoc(doc)}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CREATE / EDIT DOCUMENT SUB-MODAL */}
      {docSubModalOpen && selectedLLCForDocs && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-[#2a2a30] bg-[#0f0f12] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#222226]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">
                  {docSubModalOpen === "create" ? "Add Corporate Document" : "Modify Corporate Document"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDocSubModalOpen(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {docFormError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{docFormError}</span>
              </div>
            )}

            <form onSubmit={handleAdminDocSubmit} className="mt-4 space-y-4 text-xs">
              {/* File upload input */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  Attached Document File
                </label>
                <input
                  type="file"
                  ref={adminDocFileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAdminDocFileSelect(f);
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                  className="hidden"
                />

                {docFileName ? (
                  <div className="p-3 rounded-lg border border-emerald-800/60 bg-emerald-950/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate max-w-[260px] font-mono">
                          {docFileName}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {docFileSize} &bull; {docFileFormat}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDocFileName("");
                        setDocFileSize("");
                        setDocFileFormat("");
                        setDocFileUrl("");
                        if (adminDocFileInputRef.current) adminDocFileInputRef.current.value = "";
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingAdminDoc(true);
                    }}
                    onDragLeave={() => setIsDraggingAdminDoc(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingAdminDoc(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleAdminDocFileSelect(f);
                    }}
                    onClick={() => adminDocFileInputRef.current?.click()}
                    className={`p-4 rounded-lg border-2 border-dashed text-center transition-all cursor-pointer ${
                      isDraggingAdminDoc
                        ? "border-emerald-500 bg-emerald-950/20"
                        : "border-[#2a2a30] hover:border-zinc-500 bg-[#141418]"
                    }`}
                  >
                    <Upload className="w-5 h-5 text-zinc-400 mx-auto mb-1" />
                    <p className="text-xs text-white font-medium">Click to attach file or drag & drop</p>
                    <p className="text-[10px] text-zinc-500">PDF, DOCX, Images up to 25MB</p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Operating Agreement"
                  className="w-full h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#16161b] text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Creation Date */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Creation Date *</label>
                <input
                  type="date"
                  required
                  value={docCreationDate}
                  onChange={(e) => {
                    const d = e.target.value;
                    setDocCreationDate(d);
                    if (docExpirationType === "duration") {
                      setDocEndDate(calculateEndDateFromDuration(d, docDurationYears));
                    }
                  }}
                  className="w-full h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#16161b] text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Validity Method */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">Validity Method *</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDocExpirationType("duration");
                      setDocEndDate(calculateEndDateFromDuration(docCreationDate, docDurationYears));
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                      docExpirationType === "duration"
                        ? "border-emerald-500 bg-emerald-950/20 text-white font-medium"
                        : "border-[#2a2a30] bg-[#16161b] text-zinc-400"
                    }`}
                  >
                    Duration Period
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocExpirationType("endDate")}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                      docExpirationType === "endDate"
                        ? "border-emerald-500 bg-emerald-950/20 text-white font-medium"
                        : "border-[#2a2a30] bg-[#16161b] text-zinc-400"
                    }`}
                  >
                    Specific End Date
                  </button>
                </div>

                {docExpirationType === "duration" ? (
                  <div className="p-3 rounded-lg border border-[#222228] bg-[#121216] space-y-1.5">
                    <label className="block text-[11px] text-zinc-400">Duration Years</label>
                    <select
                      value={docDurationYears}
                      onChange={(e) => {
                        const y = Number(e.target.value);
                        setDocDurationYears(y);
                        setDocEndDate(calculateEndDateFromDuration(docCreationDate, y));
                      }}
                      className="w-full h-8 px-2 rounded-lg border border-[#2a2a30] bg-[#16161b] text-white outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value={10}>10 Years</option>
                      <option value={1}>1 Year</option>
                      <option value={2}>2 Years</option>
                      <option value={3}>3 Years</option>
                      <option value={5}>5 Years</option>
                      <option value={15}>15 Years</option>
                      <option value={20}>20 Years</option>
                    </select>
                    <span className="text-[10px] text-zinc-500 block">
                      End date: {calculateEndDateFromDuration(docCreationDate, docDurationYears)}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-[#222228] bg-[#121216] space-y-1.5">
                    <label className="block text-[11px] text-zinc-400">Specific End Date</label>
                    <input
                      type="date"
                      required={docExpirationType === "endDate"}
                      value={docEndDate}
                      min={docCreationDate}
                      onChange={(e) => setDocEndDate(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg border border-[#2a2a30] bg-[#16161b] text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#222226]">
                <button
                  type="button"
                  onClick={() => setDocSubModalOpen(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#28282e] text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoc}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{docSubModalOpen === "create" ? "Add Document" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

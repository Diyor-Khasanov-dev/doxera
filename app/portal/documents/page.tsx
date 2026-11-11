"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { LLCItem } from "@/lib/models/llc";
import {
  LLCDocumentWithComputedStatus,
  ExpirationType,
  calculateEndDateFromDuration,
} from "@/lib/models/document";

export default function PortalDocumentsPage() {
  const router = useRouter();
  const [llc, setLlc] = useState<LLCItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<LLCDocumentWithComputedStatus[]>([]);

  // Search, filter & sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "warning" | "finished">("all");
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

  // Edit Modal state (Strictly allows editing ONLY the 3 data: title/document, creationDate, duration OR endDate)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LLCDocumentWithComputedStatus | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCreationDate, setEditCreationDate] = useState("");
  const [editExpirationType, setEditExpirationType] = useState<ExpirationType>("duration");
  const [editDurationYears, setEditDurationYears] = useState<number>(10);
  const [editEndDate, setEditEndDate] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

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

  // Handle open create modal
  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setCreateTitle("");
    setCreateCreationDate(today);
    setCreateExpirationType("duration");
    setCreateDurationYears(10);
    setCreateEndDate(calculateEndDateFromDuration(today, 10));
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
    setEditError("");
    setIsEditModalOpen(true);
  };

  // Create submission
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setCreateError("Please enter a document name.");
      return;
    }
    if (!createCreationDate) {
      setCreateError("Please select a creation date.");
      return;
    }

    let calculatedEnd = createEndDate;
    if (createExpirationType === "duration") {
      calculatedEnd = calculateEndDateFromDuration(createCreationDate, createDurationYears);
    } else {
      if (!createEndDate) {
        setCreateError("Please select an end date for the document.");
        return;
      }
      if (createEndDate < createCreationDate) {
        setCreateError("End date cannot be prior to creation date.");
        return;
      }
    }

    setIsSubmittingCreate(true);
    setCreateError("");

    try {
      const res = await fetch("/api/portal/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonBody({
          title: createTitle.trim(),
          creationDate: createCreationDate,
          expirationType: createExpirationType,
          durationYears: createExpirationType === "duration" ? createDurationYears : undefined,
          endDate: calculatedEnd,
        }),
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

  // Edit submission (strictly 3 fields: title, creationDate, duration or endDate)
  const handleEditDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    if (!editTitle.trim()) {
      setEditError("Please enter a document name.");
      return;
    }
    if (!editCreationDate) {
      setEditError("Please select a creation date.");
      return;
    }

    let calculatedEnd = editEndDate;
    if (editExpirationType === "duration") {
      calculatedEnd = calculateEndDateFromDuration(editCreationDate, editDurationYears);
    } else {
      if (!editEndDate) {
        setEditError("Please select an end date for the document.");
        return;
      }
      if (editEndDate < editCreationDate) {
        setEditError("End date cannot be prior to creation date.");
        return;
      }
    }

    setIsSubmittingEdit(true);
    setEditError("");

    const docId = editingDoc.id || editingDoc._id;
    try {
      const res = await fetch(`/api/portal/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: jsonBody({
          title: editTitle.trim(),
          creationDate: editCreationDate,
          expirationType: editExpirationType,
          durationYears: editExpirationType === "duration" ? editDurationYears : undefined,
          endDate: calculatedEnd,
        }),
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

  // Safe JSON helper
  function jsonBody(payload: unknown) {
    return JSON.stringify(payload);
  }

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
        const orderMap = { warning: 1, active: 2, finished: 3 };
        comparison = (orderMap[a.status] || 0) - (orderMap[b.status] || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [documents, statusFilter, searchQuery, sortBy, sortOrder]);

  // Counts for summary metrics
  const activeCount = useMemo(() => documents.filter((d) => d.status === "active").length, [documents]);
  const warningCount = useMemo(() => documents.filter((d) => d.status === "warning").length, [documents]);
  const finishedCount = useMemo(() => documents.filter((d) => d.status === "finished").length, [documents]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400 min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-white mb-3" />
        <p className="text-xs font-mono">Loading corporate documents...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Top Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#222222]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Documents
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Corporate archive and official filings repository for{" "}
            <span className="text-white font-medium">{llc?.companyName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Total Documents</span>
            <FileText className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {documents.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Corporate records filed</div>
        </div>

        <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">
            {activeCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Valid beyond 3 months</div>
        </div>

        <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Expiring Soon</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight font-mono">
            {warningCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Due within next 3 months</div>
        </div>

        <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Finished</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight font-mono">
            {finishedCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Expired corporate documents</div>
        </div>
      </div>

      {/* Filter, Search & Sort Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 p-3 rounded-xl border border-[#222222] bg-[#0c0c0e]">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-zinc-800 text-white border border-zinc-700"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            All ({documents.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "active"
                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                : "text-zinc-400 hover:text-emerald-300 hover:bg-zinc-900"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("warning")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "warning"
                ? "bg-amber-950/60 text-amber-300 border border-amber-800"
                : "text-zinc-400 hover:text-amber-300 hover:bg-zinc-900"
            }`}
          >
            Expiring Soon ({warningCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("finished")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "finished"
                ? "bg-rose-950/60 text-rose-300 border border-rose-800"
                : "text-zinc-400 hover:text-rose-300 hover:bg-zinc-900"
            }`}
          >
            Finished ({finishedCount})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-3 rounded-lg border border-[#26262b] bg-[#141418] text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "creationDate" | "endDate" | "title" | "status")}
              className="h-8 px-2.5 rounded-lg border border-[#26262b] bg-[#141418] text-xs text-zinc-300 outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="creationDate">Creation Date</option>
              <option value="endDate">End Date</option>
              <option value="title">Document Title</option>
              <option value="status">Status</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              className="h-8 w-8 rounded-lg border border-[#26262b] bg-[#141418] hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Vault List */}
      <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1e1e24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Entity Document Vault</h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredAndSortedDocs.length} {filteredAndSortedDocs.length === 1 ? "Record" : "Records"}
          </span>
        </div>

        <div className="divide-y divide-[#1e1e24]">
          {filteredAndSortedDocs.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500">
              <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
              No corporate documents found matching your filter criteria.
            </div>
          ) : (
            filteredAndSortedDocs.map((doc) => {
              const docId = doc.id || doc._id || "";
              return (
                <div
                  key={docId}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#111115] transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">
                          {doc.title}
                        </span>

                        {/* Status Badge */}
                        {doc.status === "active" && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        )}
                        {doc.status === "warning" && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-amber-950/70 text-amber-300 border border-amber-800/80">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            Expiring Soon (Nearly to finish)
                          </span>
                        )}
                        {doc.status === "finished" && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-rose-950/70 text-rose-300 border border-rose-800/80">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            Finished
                          </span>
                        )}

                        {doc.expirationType === "duration" && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                            {doc.durationYears || 10} Years Duration
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400 font-mono flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>Creation: <strong>{doc.creationDate}</strong></span>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>End Date: <strong className={doc.status === "finished" ? "text-rose-400" : doc.status === "warning" ? "text-amber-400" : "text-zinc-200"}>{doc.endDate}</strong></span>
                        </span>
                        <span>&bull;</span>
                        <span>Format: {doc.fileFormat || "PDF"}</span>
                        {doc.daysRemaining !== undefined && (
                          <>
                            <span>&bull;</span>
                            <span className={doc.daysRemaining < 0 ? "text-rose-400" : doc.daysRemaining <= 90 ? "text-amber-400" : "text-zinc-500"}>
                              {doc.daysRemaining < 0
                                ? `Expired ${Math.abs(doc.daysRemaining)} days ago`
                                : `${doc.daysRemaining} days remaining`}
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2c2c34] bg-[#16161a] hover:bg-zinc-800 hover:text-white text-xs text-zinc-300 transition-colors cursor-pointer"
                      title="Edit this document (Title, Creation Date, Duration / End Date)"
                    >
                      <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 hover:bg-rose-900/40 text-xs text-rose-300 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        alert(`Downloading ${doc.title} (${doc.fileFormat || "PDF"})`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2c2c34] bg-[#16161a] hover:bg-zinc-800 hover:text-white text-xs text-zinc-300 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CREATE DOCUMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl border border-[#2a2a30] bg-[#0f0f12] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#222226]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">Create New Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
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
              {/* Field 1: Document Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Document Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Agreement, Annual Certificate..."
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#16161b] text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Field 2: Creation Date */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Creation Date <span className="text-rose-400">*</span>
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
                  className="w-full h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#16161b] text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Field 3: Select either Duration (10 years) OR End Date */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Document Validity / Expiration Method <span className="text-rose-400">*</span>
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
                        ? "border-emerald-500 bg-emerald-950/20 text-white font-medium"
                        : "border-[#2a2a30] bg-[#16161b] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">Duration</span>
                      {createExpirationType === "duration" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">Fixed period (e.g. 10 years)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreateExpirationType("endDate");
                    }}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      createExpirationType === "endDate"
                        ? "border-emerald-500 bg-emerald-950/20 text-white font-medium"
                        : "border-[#2a2a30] bg-[#16161b] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">End of Document</span>
                      {createExpirationType === "endDate" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">Specific end date</span>
                  </button>
                </div>

                {createExpirationType === "duration" ? (
                  <div className="p-3.5 rounded-lg border border-[#222228] bg-[#121216] space-y-2">
                    <label className="block text-[11px] text-zinc-400">
                      Duration Period
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={createDurationYears}
                        onChange={(e) => {
                          const yrs = Number(e.target.value);
                          setCreateDurationYears(yrs);
                          setCreateEndDate(calculateEndDateFromDuration(createCreationDate, yrs));
                        }}
                        className="h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#16161b] text-xs text-white outline-none focus:border-emerald-500 flex-1"
                      >
                        <option value={10}>10 Years (Recommended standard)</option>
                        <option value={1}>1 Year (Annual)</option>
                        <option value={2}>2 Years</option>
                        <option value={3}>3 Years</option>
                        <option value={5}>5 Years</option>
                        <option value={15}>15 Years</option>
                        <option value={20}>20 Years</option>
                      </select>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Auto-calculated End Date:{" "}
                      <span className="text-white font-mono">
                        {calculateEndDateFromDuration(createCreationDate, createDurationYears)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg border border-[#222228] bg-[#121216] space-y-2">
                    <label className="block text-[11px] text-zinc-400">
                      Specific End Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      required={createExpirationType === "endDate"}
                      value={createEndDate}
                      min={createCreationDate}
                      onChange={(e) => setCreateEndDate(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#16161b] text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222226]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#2a2a30] text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingCreate ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Document</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCUMENT MODAL (Strictly modifies ONLY the 3 specified data fields) */}
      {isEditModalOpen && editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl border border-[#2a2a30] bg-[#0f0f12] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#222226]">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-white">Modify Document</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingDoc(null);
                }}
                className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 mt-2">
              Per LLC policy, you can modify strictly the 3 core document parameters: document name, creation date, and duration or end date.
            </p>

            {editError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditDocument} className="mt-5 space-y-4">
              {/* Field 1: Document Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Document Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#16161b] text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                />
              </div>

              {/* Field 2: Creation Date */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Creation Date <span className="text-rose-400">*</span>
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
                  className="w-full h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#16161b] text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Field 3: Duration OR End of Document */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Document Validity / Expiration Method <span className="text-rose-400">*</span>
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
                        ? "border-blue-500 bg-blue-950/20 text-white font-medium"
                        : "border-[#2a2a30] bg-[#16161b] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">Duration</span>
                      {editExpirationType === "duration" && (
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">Duration (10 years)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditExpirationType("endDate");
                    }}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      editExpirationType === "endDate"
                        ? "border-blue-500 bg-blue-950/20 text-white font-medium"
                        : "border-[#2a2a30] bg-[#16161b] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">End of Document</span>
                      {editExpirationType === "endDate" && (
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">Specific end date</span>
                  </button>
                </div>

                {editExpirationType === "duration" ? (
                  <div className="p-3.5 rounded-lg border border-[#222228] bg-[#121216] space-y-2">
                    <label className="block text-[11px] text-zinc-400">
                      Duration Period
                    </label>
                    <select
                      value={editDurationYears}
                      onChange={(e) => {
                        const yrs = Number(e.target.value);
                        setEditDurationYears(yrs);
                        setEditEndDate(calculateEndDateFromDuration(editCreationDate, yrs));
                      }}
                      className="w-full h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#16161b] text-xs text-white outline-none focus:border-blue-500"
                    >
                      <option value={10}>10 Years (10years)</option>
                      <option value={1}>1 Year</option>
                      <option value={2}>2 Years</option>
                      <option value={3}>3 Years</option>
                      <option value={5}>5 Years</option>
                      <option value={15}>15 Years</option>
                      <option value={20}>20 Years</option>
                    </select>
                    <div className="text-[11px] text-zinc-500">
                      Calculated End Date:{" "}
                      <span className="text-white font-mono">
                        {calculateEndDateFromDuration(editCreationDate, editDurationYears)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg border border-[#222228] bg-[#121216] space-y-2">
                    <label className="block text-[11px] text-zinc-400">
                      End of the Document (Date)
                    </label>
                    <input
                      type="date"
                      required={editExpirationType === "endDate"}
                      value={editEndDate}
                      min={editCreationDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#16161b] text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222226]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingDoc(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-[#2a2a30] text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
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
          <div className="relative w-full max-w-md rounded-xl border border-[#2a2a30] bg-[#0f0f12] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-semibold text-white">Delete Document</h3>
            </div>
            <p className="text-xs text-zinc-300">
              Are you sure you want to permanently delete{" "}
              <span className="text-white font-medium">&ldquo;{docToDelete.title}&rdquo;</span>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-lg border border-[#2a2a30] text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteDocument}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Document</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Plus,
  Search,
  TrendingUp,
  ShieldCheck,
  FileText,
  DollarSign,
  Key,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  BarChart3,
  AlertTriangle,
  X,
  Loader2,
  RefreshCw,
  Copy,
} from "lucide-react";
import { LLCItem, LLCAnalyticsOverview } from "@/lib/models/llc";

export default function LLCManagementPage() {
  const [llcs, setLlcs] = useState<LLCItem[]>([]);
  const [analytics, setAnalytics] = useState<LLCAnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Selected item for operations
  const [selectedLLC, setSelectedLLC] = useState<LLCItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    companyName: "",
    username: "",
    password: "",
    email: "",
    state: "Delaware",
    formationDate: new Date().toISOString().split("T")[0],
    plan: "Starter" as "Starter" | "Growth" | "Enterprise",
    status: "active" as "active" | "pending" | "suspended",
    ein: "",
    revenue: 0,
    documentsCount: 1,
    notes: "",
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load LLCs and Analytics
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [llcRes, analyticsRes] = await Promise.all([
        fetch("/api/llcs"),
        fetch("/api/llcs/analytics"),
      ]);

      const llcData = await llcRes.json();
      const analyticsData = await analyticsRes.json();

      if (llcData.success) {
        setLlcs(llcData.data);
      }
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
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
        const [llcRes, analyticsRes] = await Promise.all([
          fetch("/api/llcs"),
          fetch("/api/llcs/analytics"),
        ]);
        const llcData = await llcRes.json();
        const analyticsData = await analyticsRes.json();
        if (!ignore) {
          if (llcData.success) setLlcs(llcData.data);
          if (analyticsData.success) setAnalytics(analyticsData.data);
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
        item.ein.includes(search) ||
        item.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesState = stateFilter === "all" || item.state === stateFilter;
      const matchesPlan = planFilter === "all" || item.plan === planFilter;

      return matchesSearch && matchesStatus && matchesState && matchesPlan;
    });
  }, [llcs, search, statusFilter, stateFilter, planFilter]);

  // Unique states for filtering
  const availableStates = useMemo(() => {
    const set = new Set(llcs.map((i) => i.state));
    return Array.from(set);
  }, [llcs]);

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
    setIsSubmitting(true);

    try {
      const targetId = selectedLLC._id || selectedLLC.llcId;
      const res = await fetch(`/api/llcs/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          email: formData.email,
          state: formData.state,
          plan: formData.plan,
          status: formData.status,
          ein: formData.ein,
          revenue: formData.revenue,
          documentsCount: formData.documentsCount,
          notes: formData.notes,
        }),
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

  // Handle Password Reset / Credentials change
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
      email: "",
      state: "Delaware",
      formationDate: new Date().toISOString().split("T")[0],
      plan: "Starter",
      status: "active",
      ein: "",
      revenue: 0,
      documentsCount: 1,
      notes: "",
    });
    setFormError("");
    setShowPassword(false);
  };

  const openEditModal = (item: LLCItem) => {
    setSelectedLLC(item);
    setFormData({
      companyName: item.companyName,
      username: item.username,
      password: "",
      email: item.email,
      state: item.state,
      formationDate: item.formationDate,
      plan: item.plan,
      status: item.status,
      ein: item.ein,
      revenue: item.revenue,
      documentsCount: item.documentsCount,
      notes: item.notes || "",
    });
    setFormError("");
    setEditModalOpen(true);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

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
              MongoDB Backed
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Create and manage registered LLC entities, configure client portal access credentials, and analyze compliance and financial performance.
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

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total LLCs */}
        <div className="p-5 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Total Entities</span>
            <Building2 className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? "..." : analytics?.totalLLCs || 0}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
            <span className="text-emerald-400 font-medium">{analytics?.activeLLCs || 0} Active</span>
            <span>&middot;</span>
            <span className="text-amber-400">{analytics?.pendingLLCs || 0} Pending</span>
          </div>
        </div>

        {/* Total Aggregate Revenue */}
        <div className="p-5 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Aggregated Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? "..." : formatCurrency(analytics?.totalRevenue || 0)}
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">+14.2%</span> vs last quarter
          </div>
        </div>

        {/* Avg Compliance Score */}
        <div className="p-5 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Compliance Score</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? "..." : `${analytics?.averageCompliance || 0}%`}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Across state and federal requirements
          </div>
        </div>

        {/* Active Filings */}
        <div className="p-5 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Active Filings</span>
            <FileText className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? "..." : analytics?.totalFilings || 0}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Annual reports & registered agent updates
          </div>
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
            placeholder="Search LLC by name, username, code, EIN, or email..."
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

          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#27272a] bg-[#121214] text-xs text-zinc-300 outline-none focus:border-white transition-colors cursor-pointer"
          >
            <option value="all">All States</option>
            {availableStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#27272a] bg-[#121214] text-xs text-zinc-300 outline-none focus:border-white transition-colors cursor-pointer"
          >
            <option value="all">All Plans</option>
            <option value="Starter">Starter</option>
            <option value="Growth">Growth</option>
            <option value="Enterprise">Enterprise</option>
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
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Plan & Status</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">Compliance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1b1e]">
              {isLoading && llcs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    <span>Loading registered LLCs from database...</span>
                  </td>
                </tr>
              ) : filteredLLCs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
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
                          className="text-zinc-500 hover:text-white transition-colors"
                          title="Copy login username"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copiedId === `user-${item.llcId}` && (
                          <span className="text-[10px] text-emerald-400">Copied</span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 block mt-0.5 truncate max-w-[150px]">
                        {item.email}
                      </span>
                    </td>

                    {/* State */}
                    <td className="py-3.5 px-4">
                      <span className="text-zinc-300">{item.state}</span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        Formed: {item.formationDate}
                      </span>
                    </td>

                    {/* Plan & Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-300 font-medium">{item.plan}</span>
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
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-zinc-200 font-medium">
                        {formatCurrency(item.revenue)}
                      </span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        {item.documentsCount} documents
                      </span>
                    </td>

                    {/* Compliance */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              (item.analytics?.complianceScore || 0) > 85
                                ? "bg-emerald-400"
                                : (item.analytics?.complianceScore || 0) > 60
                                ? "bg-amber-400"
                                : "bg-red-400"
                            }`}
                            style={{ width: `${item.analytics?.complianceScore || 0}%` }}
                          />
                        </div>
                        <span className="font-mono text-zinc-300">
                          {item.analytics?.complianceScore || 0}%
                        </span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Inspect detail */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLLC(item);
                            setDetailModalOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="View LLC Analytics & Details"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
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
                className="text-zinc-400 hover:text-white"
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
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
                className="text-zinc-400 hover:text-white"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) =>
                      setFormData({ ...formData, plan: e.target.value as "Starter" | "Growth" | "Enterprise" })
                    }
                    className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white outline-none focus:border-white cursor-pointer"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Growth">Growth</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
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
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">EIN</label>
                  <input
                    type="text"
                    value={formData.ein}
                    onChange={(e) => setFormData({ ...formData, ein: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white font-mono outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Revenue ($)</label>
                  <input
                    type="number"
                    value={formData.revenue}
                    onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white font-mono outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Documents</label>
                  <input
                    type="number"
                    value={formData.documentsCount}
                    onChange={(e) => setFormData({ ...formData, documentsCount: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg border border-[#28282e] bg-[#141416] text-white font-mono outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Internal Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#28282e] bg-[#141416] text-white outline-none focus:border-white"
                />
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
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Update password for <span className="text-white font-medium">{selectedLLC.companyName}</span>. They will use their username <span className="font-mono text-zinc-200">({selectedLLC.username})</span> and this new password to sign into the LLC portal.
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
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


      {/* SINGLE LLC INSPECT / ANALYTICS DRAWER */}
      {detailModalOpen && selectedLLC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-base font-semibold text-white">{selectedLLC.companyName}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-mono">{selectedLLC.llcId}</span>
                    <span>&middot;</span>
                    <span>{selectedLLC.state}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick credentials card */}
            <div className="p-4 rounded-xl border border-[#222222] bg-[#08080a] mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  Client Login Credentials
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    setCredentialsModalOpen(true);
                  }}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Change Password
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Username</span>
                  <span className="font-mono text-white">{selectedLLC.username}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Portal Route</span>
                  <span className="font-mono text-zinc-300">/login &rarr; /portal</span>
                </div>
              </div>
            </div>

            {/* Performance metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-lg border border-[#222222] bg-[#121214]">
                <span className="text-[11px] text-zinc-500 block">Total Revenue</span>
                <span className="text-base font-bold text-white font-mono">
                  {formatCurrency(selectedLLC.revenue)}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-[#222222] bg-[#121214]">
                <span className="text-[11px] text-zinc-500 block">Compliance</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {selectedLLC.analytics?.complianceScore || 0}%
                </span>
              </div>
              <div className="p-3 rounded-lg border border-[#222222] bg-[#121214]">
                <span className="text-[11px] text-zinc-500 block">Active Filings</span>
                <span className="text-base font-bold text-white font-mono">
                  {selectedLLC.analytics?.activeFilings || 0}
                </span>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Audit History & Filings
              </h4>
              <div className="space-y-2 text-xs">
                {selectedLLC.analytics?.auditLogs?.map((log, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-[#1e1e22] bg-[#08080a] flex items-start justify-between gap-4"
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

            <div className="flex justify-end pt-4 mt-6 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

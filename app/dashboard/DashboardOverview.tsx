"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Activity,
  FileCheck2,
} from "lucide-react";
import { LLCAnalyticsOverview } from "@/lib/models/llc";

export default function DashboardOverview() {
  const [data, setData] = useState<LLCAnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "revenue" | "states">("users");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/llcs/analytics");
      if (!res.ok) {
        throw new Error("Failed to load analytics");
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error("Invalid analytics response");
      }
    } catch {
      setError("Unable to load latest analytics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const res = await fetch("/api/llcs/analytics");
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = await res.json();
        if (!ignore && json.success && json.data) {
          setData(json.data);
          setIsLoading(false);
        }
      } catch {
        if (!ignore) {
          setError("Unable to load latest analytics. Please try again.");
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const dailyUsers = data?.dailyUserAnalytics || [
    { dayLabel: "Fri", dateString: "2025-03-07", userCount: 1, activeSessions: 4, isToday: false, isTomorrow: false },
    { dayLabel: "Sat", dateString: "2025-03-08", userCount: 1, activeSessions: 3, isToday: false, isTomorrow: false },
    { dayLabel: "Yesterday", dateString: "2025-03-09", userCount: 1, activeSessions: 5, isToday: false, isTomorrow: false },
    { dayLabel: "Today", dateString: "2025-03-10", userCount: 2, activeSessions: 7, isToday: true, isTomorrow: false },
    { dayLabel: "Tomorrow", dateString: "2025-03-11", userCount: 3, activeSessions: 11, isToday: false, isTomorrow: true },
    { dayLabel: "Wed", dateString: "2025-03-12", userCount: 4, activeSessions: 14, isToday: false, isTomorrow: false },
    { dayLabel: "Thu", dateString: "2025-03-13", userCount: 5, activeSessions: 18, isToday: false, isTomorrow: false },
  ];

  const maxUserCount = Math.max(...dailyUsers.map((d) => d.userCount), 6);
  const monthlyRevenue = data?.monthlyRevenueTotals || [];
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.amount), 100000);

  const todayMetric = dailyUsers.find((d) => d.isToday) || dailyUsers[3];
  const tomorrowMetric = dailyUsers.find((d) => d.isTomorrow) || dailyUsers[4];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Executive Dashboard</span>
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              Live Overview
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Real-time entity operations, user analytics trajectory, compliance metrics, and financial performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#2e2e34] bg-[#121214] text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-500 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Analytics</span>
          </button>

          <Link
            href="/dashboard/llc-management"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-all shadow-sm"
          >
            <span>Manage LLCs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-950/60 bg-red-950/20 text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="underline hover:text-white cursor-pointer ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 MAIN DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Registered LLCs */}
        <div className="p-5 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">Total Registered LLCs</span>
            <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {isLoading ? (
              <span className="text-zinc-600">--</span>
            ) : (
              data?.totalLLCs ?? 0
            )}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs pt-2.5 border-t border-[#18181b]">
            <span className="text-zinc-500">Status</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {data?.activeLLCs ?? 0} Active ({data?.totalLLCs ? Math.round(((data.activeLLCs ?? 0) / data.totalLLCs) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* 2. Active LLC Users */}
        <div className="p-5 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">Active LLC Users</span>
            <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono flex items-baseline gap-2">
            {isLoading ? (
              <span className="text-zinc-600">--</span>
            ) : (
              <span>{todayMetric?.userCount ?? 2}</span>
            )}
            <span className="text-xs font-normal text-zinc-500">active accounts</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs pt-2.5 border-t border-[#18181b]">
            <span className="text-zinc-500">Next Projection</span>
            <span className="text-blue-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Tomorrow: {tomorrowMetric?.userCount ?? 3} users
            </span>
          </div>
        </div>

        {/* 3. Total Managed Revenue */}
        <div className="p-5 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">Total Managed Revenue</span>
            <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {isLoading ? (
              <span className="text-zinc-600">--</span>
            ) : (
              formatCurrency(data?.totalRevenue ?? 0)
            )}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs pt-2.5 border-t border-[#18181b]">
            <span className="text-zinc-500">Portfolio</span>
            <span className="text-zinc-300 font-medium">All registered entities</span>
          </div>
        </div>

        {/* 4. Compliance & Active Filings */}
        <div className="p-5 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">Compliance & Filings</span>
            <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono flex items-baseline gap-2">
            {isLoading ? (
              <span className="text-zinc-600">--</span>
            ) : (
              <span>{data?.averageCompliance ?? 95}%</span>
            )}
            <span className="text-xs font-normal text-zinc-500">score</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs pt-2.5 border-t border-[#18181b]">
            <span className="text-zinc-500">Active Filings</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5" />
              {data?.totalFilings ?? 10} verified
            </span>
          </div>
        </div>
      </div>

      {/* CHART SECTION: LLCs' ANALYTICS */}
      <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 shadow-2xl">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1f1f22]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">LLCs&apos; Analytics & User Trajectory</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Interactive timeline tracking active LLC users over time: today ({todayMetric?.userCount ?? 2} users), tomorrow ({tomorrowMetric?.userCount ?? 3} users), and growth projection.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center bg-[#141416] p-1 rounded-lg border border-[#28282e]">
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-white text-black shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Daily Users
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("revenue")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === "revenue"
                  ? "bg-white text-black shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Revenue Flow
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("states")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === "states"
                  ? "bg-white text-black shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Jurisdictions
            </button>
          </div>
        </div>

        {/* Tab 1: Daily LLC Users Analytics Chart */}
        {activeTab === "users" && (
          <div className="pt-6 space-y-6">
            {/* Quick summary indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-[#1e1e22] bg-[#101014]">
                <span className="text-[11px] text-zinc-500 block mb-0.5">Today</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-white font-mono">{todayMetric?.userCount ?? 2}</span>
                  <span className="text-xs text-emerald-400 font-medium">active users</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-blue-900/30 bg-blue-950/10">
                <span className="text-[11px] text-blue-400 block mb-0.5">Tomorrow</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-blue-300 font-mono">{tomorrowMetric?.userCount ?? 3}</span>
                  <span className="text-xs text-blue-400 font-medium">projected</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[#1e1e22] bg-[#101014]">
                <span className="text-[11px] text-zinc-500 block mb-0.5">Growth Delta</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-emerald-400 font-mono">+50%</span>
                  <span className="text-xs text-zinc-400">day-over-day</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[#1e1e22] bg-[#101014]">
                <span className="text-[11px] text-zinc-500 block mb-0.5">Active Sessions</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-white font-mono">{todayMetric?.activeSessions ?? 7}</span>
                  <span className="text-xs text-zinc-400">concurrent</span>
                </div>
              </div>
            </div>

            {/* Visual Bar & Trend Chart */}
            <div className="p-6 rounded-xl border border-[#1e1e22] bg-[#08080a] relative">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-6">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>LLC User Activity & Forecast</span>
                </span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400" />
                    <span>Today / Recorded</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-blue-400" />
                    <span>Tomorrow / Projected</span>
                  </span>
                </div>
              </div>

              {/* Chart Grid */}
              <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-[#1f1f24] relative">
                {/* Horizontal reference grid lines */}
                <div className="absolute inset-x-0 top-6 border-b border-[#1a1a1f] border-dashed pointer-events-none" />
                <div className="absolute inset-x-0 top-1/2 border-b border-[#1a1a1f] border-dashed pointer-events-none" />

                {dailyUsers.map((item, idx) => {
                  const heightPercent = Math.max(16, Math.round((item.userCount / maxUserCount) * 100));
                  const isHovered = hoveredIndex === idx;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    >
                      {/* Hover Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-12 z-20 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-[11px] shadow-xl whitespace-nowrap animate-in fade-in duration-150">
                          <div className="font-semibold">{item.dayLabel}: {item.userCount} {item.userCount === 1 ? "user" : "users"}</div>
                          <div className="text-[10px] text-zinc-400">{item.activeSessions} active sessions &middot; {item.dateString}</div>
                        </div>
                      )}

                      {/* Number tag above bar */}
                      <span
                        className={`text-[11px] font-mono font-medium mb-2 transition-all ${
                          item.isToday
                            ? "text-emerald-400 scale-110 font-bold"
                            : item.isTomorrow
                            ? "text-blue-400 scale-110 font-bold"
                            : "text-zinc-500 group-hover:text-zinc-300"
                        }`}
                      >
                        {item.userCount} {item.userCount === 1 ? "usr" : "users"}
                      </span>

                      {/* Chart Bar */}
                      <div className="w-full max-w-[48px] h-full flex items-end">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 relative ${
                            item.isToday
                              ? "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                              : item.isTomorrow
                              ? "bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)]"
                              : isHovered
                              ? "bg-zinc-600"
                              : "bg-zinc-800 hover:bg-zinc-700"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-axis Labels */}
              <div className="flex items-center justify-between gap-2 sm:gap-4 pt-3 text-xs">
                {dailyUsers.map((item, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <span
                      className={`block text-[11px] font-medium transition-colors ${
                        item.isToday
                          ? "text-emerald-400 font-bold"
                          : item.isTomorrow
                          ? "text-blue-400 font-bold"
                          : "text-zinc-400"
                      }`}
                    >
                      {item.dayLabel}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono block">
                      {item.dateString.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footnote details */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-zinc-500 gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Today records <strong className="text-white">2 active users</strong> across registered corporate accounts.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Tomorrow projects <strong className="text-white">3 active users</strong> following planned onboarding.</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Monthly Revenue Flow Chart */}
        {activeTab === "revenue" && (
          <div className="pt-6 space-y-6">
            <div className="p-6 rounded-xl border border-[#1e1e22] bg-[#08080a]">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-6">
                <span>Monthly Aggregated Revenue Flow</span>
                <span className="font-mono text-emerald-400">Total: {formatCurrency(data?.totalRevenue ?? 0)}</span>
              </div>

              <div className="h-64 flex items-end justify-between gap-4 pt-6 pb-2 border-b border-[#1f1f24] relative">
                {monthlyRevenue.map((item, idx) => {
                  const heightPercent = Math.max(15, Math.round((item.amount / maxRevenue) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <span className="text-[11px] font-mono text-zinc-400 mb-2 group-hover:text-white">
                        ${(item.amount / 1000).toFixed(0)}k
                      </span>
                      <div className="w-full max-w-[48px] h-full flex items-end">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-emerald-700 to-emerald-400 rounded-t-md group-hover:brightness-110 transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-4 pt-3 text-xs text-zinc-400">
                {monthlyRevenue.map((item, idx) => (
                  <div key={idx} className="flex-1 text-center font-medium text-[11px]">
                    {item.month}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: State Jurisdiction Breakdown */}
        {activeTab === "states" && (
          <div className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data?.stateDistribution?.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#1e1e22] bg-[#08080a] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 block mb-1">State Jurisdiction</span>
                    <span className="text-base font-semibold text-white">{item.state}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-emerald-400">{item.count}</span>
                    <span className="text-[11px] text-zinc-500 block">LLC entities</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QUICK OVERVIEW & SHORTCUTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Operational Highlights */}
        <div className="lg:col-span-2 rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-white">Entity Portfolio Highlights</h3>
            </div>
            <Link
              href="/dashboard/llc-management"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View all entities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-lg border border-[#1b1b1e] bg-[#101014]">
              <span className="text-zinc-500 block text-[11px] mb-1">Active Status</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{data?.activeLLCs ?? 0}</span>
              <span className="text-[11px] text-zinc-400 block mt-1">In full compliance</span>
            </div>
            <div className="p-3.5 rounded-lg border border-[#1b1b1e] bg-[#101014]">
              <span className="text-zinc-500 block text-[11px] mb-1">Pending Approval</span>
              <span className="text-lg font-bold font-mono text-amber-400">{data?.pendingLLCs ?? 0}</span>
              <span className="text-[11px] text-zinc-400 block mt-1">Awaiting state notice</span>
            </div>
            <div className="p-3.5 rounded-lg border border-[#1b1b1e] bg-[#101014]">
              <span className="text-zinc-500 block text-[11px] mb-1">Suspended</span>
              <span className="text-lg font-bold font-mono text-red-400">{data?.suspendedLLCs ?? 0}</span>
              <span className="text-[11px] text-zinc-400 block mt-1">Requires review</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-[#1b1b1e] bg-[#101014] text-xs text-zinc-400 flex items-center justify-between">
            <div>
              <span className="text-white font-medium block">Ready to register or update company credentials?</span>
              <span className="text-[11px] text-zinc-500">Manage login credentials and entity details from LLC Management.</span>
            </div>
            <Link
              href="/dashboard/llc-management"
              className="px-3 py-1.5 rounded-md bg-white text-black font-medium text-xs hover:bg-zinc-200 transition-colors shrink-0"
            >
              Go to LLC Management
            </Link>
          </div>
        </div>

        {/* Right Col: Quick Access Links */}
        <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Direct Portal Links</h3>
          <div className="space-y-2 text-xs">
            <Link
              href="/dashboard/llc-management"
              className="flex items-center justify-between p-3 rounded-lg border border-[#1e1e22] bg-[#101014] hover:border-zinc-700 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span className="font-medium text-white">LLC Management</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white" />
            </Link>

            <Link
              href="/portal"
              target="_blank"
              className="flex items-center justify-between p-3 rounded-lg border border-[#1e1e22] bg-[#101014] hover:border-zinc-700 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span className="font-medium text-white">Client Portal Preview</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white" />
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between p-3 rounded-lg border border-[#1e1e22] bg-[#101014] hover:border-zinc-700 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span className="font-medium text-white">Platform Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

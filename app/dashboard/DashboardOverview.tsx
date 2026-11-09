"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowUpRight,
  RefreshCw,
  Activity,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Calendar,
} from "lucide-react";
import { LLCAnalyticsOverview, LLCTimelinePoint } from "@/lib/models/llc";

export default function DashboardOverview() {
  const [data, setData] = useState<LLCAnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const timeline: LLCTimelinePoint[] = data?.timeline && data.timeline.length > 0
    ? data.timeline
    : [
        {
          label: "Start",
          dateString: "Initial",
          registeredLLCs: 0,
          activeLLCs: 0,
          pendingLLCs: 0,
          suspendedLLCs: 0,
          isCurrent: false,
        },
        {
          label: "Apr '23",
          dateString: "2023-04-12",
          registeredLLCs: 1,
          activeLLCs: 1,
          pendingLLCs: 0,
          suspendedLLCs: 0,
          isCurrent: false,
        },
        {
          label: "Sep '23",
          dateString: "2023-09-18",
          registeredLLCs: 2,
          activeLLCs: 2,
          pendingLLCs: 0,
          suspendedLLCs: 0,
          isCurrent: false,
        },
        {
          label: "Feb '24",
          dateString: "2024-02-05",
          registeredLLCs: 3,
          activeLLCs: 2,
          pendingLLCs: 1,
          suspendedLLCs: 0,
          isCurrent: true,
        },
      ];

  const totalRegistered = data?.totalLLCs ?? (timeline.length > 0 ? timeline[timeline.length - 1].registeredLLCs : 0);
  const activeCount = data?.activeLLCs ?? (timeline.length > 0 ? timeline[timeline.length - 1].activeLLCs : 0);
  const pendingCount = data?.pendingLLCs ?? (timeline.length > 0 ? timeline[timeline.length - 1].pendingLLCs : 0);
  const suspendedCount = data?.suspendedLLCs ?? (timeline.length > 0 ? timeline[timeline.length - 1].suspendedLLCs : 0);

  const maxVal = Math.max(...timeline.map((d) => d.registeredLLCs), 4);
  const minVal = 0;

  // SVG Chart dimensions and coordinates
  const svgWidth = 700;
  const svgHeight = 260;
  const paddingX = 45;
  const paddingTop = 30;
  const paddingBottom = 40;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const points = timeline.map((item, idx) => {
    const denom = timeline.length > 1 ? timeline.length - 1 : 1;
    const x = paddingX + (idx / denom) * chartWidth;
    const yRange = maxVal - minVal;
    const y = paddingTop + chartHeight - ((item.registeredLLCs - minVal) / (yRange || 1)) * chartHeight;
    return { x, y, item, idx };
  });

  const linePathD = points.reduce((acc, curr, index) => {
    if (index === 0) return `M ${curr.x} ${curr.y}`;
    const prev = points[index - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, "");

  const areaPathD = `${linePathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  // Horizontal guide lines
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  const activeRatio = totalRegistered > 0 ? Math.round((activeCount / totalRegistered) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
            Real-time entity operations, LLC registration trajectory, and status management.
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

      {/* TOP CARD: TOTALLY REGISTERED USERS / LLC ENTITIES */}
      <div className="p-6 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-all relative overflow-hidden group shadow-lg">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
          <span className="text-sm font-medium text-zinc-300">Totally Registered LLCs</span>
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div className="text-4xl font-extrabold text-white tracking-tight font-mono">
          {isLoading ? (
            <span className="text-zinc-600">--</span>
          ) : (
            totalRegistered
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs pt-3 border-t border-[#18181b]">
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {activeCount} Active ({activeRatio}%)
            </span>
            <span className="text-amber-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {pendingCount} Pending
            </span>
            {suspendedCount > 0 && (
              <span className="text-red-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {suspendedCount} Suspended
              </span>
            )}
          </div>
          <span className="text-zinc-500 font-mono text-[11px]">
            Managed via LLC Management
          </span>
        </div>
      </div>

      {/* LINE CHART: LLCs' REAL MANAGEMENT ANALYTICS */}
      <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 shadow-2xl space-y-6">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1f1f22]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">LLCs&apos; Analytics</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Real LLC entity management and registration trajectory across all corporate records.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-zinc-400">Active Records ({activeCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              <span className="text-zinc-400">Pending Review ({pendingCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              <span className="text-zinc-400">Total Registered ({totalRegistered})</span>
            </div>
          </div>
        </div>

        {/* Line Chart Container */}
        <div className="p-6 rounded-xl border border-[#1e1e22] bg-[#08080a] relative">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Entity Management Trajectory Chart</span>
            </span>
            <span className="font-mono text-xs text-zinc-500">
              Peak: {maxVal} LLCs
            </span>
          </div>

          {/* Responsive SVG Line Chart */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 sm:h-72 select-none overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Area Gradient */}
                <linearGradient id="lineChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#08080a" stopOpacity="0" />
                </linearGradient>

                {/* Stroke Gradient */}
                <linearGradient id="lineStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="70%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>

                {/* Drop shadow for line glow */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#34d399" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Horizontal grid lines & Y labels */}
              {yTicks.map((val, idx) => {
                const y = paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal || 1)) * chartHeight;
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#1e1e24"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3}
                      fill="#71717a"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area under curve */}
              <path
                d={areaPathD}
                fill="url(#lineChartGradient)"
              />

              {/* Smooth Line Curve */}
              <path
                d={linePathD}
                fill="none"
                stroke="url(#lineStrokeGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              {/* Interactive Data Points on the line */}
              {points.map(({ x, y, item, idx }) => {
                const isHovered = hoveredIndex === idx;
                const pointColor = item.isCurrent
                  ? "#34d399"
                  : "#60a5fa";

                return (
                  <g key={idx} className="cursor-pointer">
                    {/* Hover column trigger */}
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={paddingTop + chartHeight}
                      stroke={isHovered ? "#3f3f46" : "transparent"}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />

                    {/* Outer ring on hover/current */}
                    {(isHovered || item.isCurrent) && (
                      <circle
                        cx={x}
                        y={y}
                        r={isHovered ? 8 : 6}
                        fill={item.isCurrent ? "#10b981" : "#3b82f6"}
                        fillOpacity="0.25"
                      />
                    )}

                    {/* Main point circle */}
                    <circle
                      cx={x}
                      y={y}
                      r={isHovered ? 5.5 : 4}
                      fill={pointColor}
                      stroke="#08080a"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />

                    {/* Hit area for easier hover */}
                    <circle
                      cx={x}
                      y={y}
                      r={20}
                      fill="transparent"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Floating tooltip when point is hovered */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <div
                className="absolute z-20 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs shadow-2xl pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                  top: `${(points[hoveredIndex].y / svgHeight) * 100}%`,
                  marginTop: "-12px",
                }}
              >
                <div className="font-semibold flex items-center gap-1.5 text-zinc-100">
                  <span>{points[hoveredIndex].item.label}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    ({points[hoveredIndex].item.dateString})
                  </span>
                </div>
                <div className="text-emerald-400 font-mono font-bold mt-0.5">
                  {points[hoveredIndex].item.registeredLLCs}{" "}
                  {points[hoveredIndex].item.registeredLLCs === 1 ? "LLC Registered" : "LLCs Registered"}
                </div>
                <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span className="text-emerald-400">{points[hoveredIndex].item.activeLLCs} active</span>
                  <span>&middot;</span>
                  <span className="text-amber-400">{points[hoveredIndex].item.pendingLLCs} pending</span>
                </div>
              </div>
            )}
          </div>

          {/* X-axis Labels */}
          <div className="flex items-center justify-between gap-2 pt-3 text-xs border-t border-[#1f1f24] mt-2">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex-1 text-center">
                <span
                  className={`block text-[11px] font-medium transition-colors ${
                    item.isCurrent
                      ? "text-emerald-400 font-bold"
                      : "text-zinc-400"
                  }`}
                >
                  {item.label}
                </span>
                <span className="text-[10px] text-zinc-600 font-mono block">
                  {item.dateString}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Real Status Breakdown Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-lg border border-[#1e1e24] bg-[#0a0a0c] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Active LLCs</div>
                <div className="text-[11px] text-zinc-500">Fully compliant & operational</div>
              </div>
            </div>
            <span className="font-mono text-base font-bold text-emerald-400">
              {activeCount}
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#1e1e24] bg-[#0a0a0c] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Pending Approval</div>
                <div className="text-[11px] text-zinc-500">Awaiting state confirmation</div>
              </div>
            </div>
            <span className="font-mono text-base font-bold text-amber-400">
              {pendingCount}
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#1e1e24] bg-[#0a0a0c] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Suspended LLCs</div>
                <div className="text-[11px] text-zinc-500">Requires administrative action</div>
              </div>
            </div>
            <span className="font-mono text-base font-bold text-zinc-300">
              {suspendedCount}
            </span>
          </div>
        </div>

        {/* Footnote details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-zinc-500 gap-2 px-1 pt-1 border-t border-[#1a1a1e]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Currently tracking <strong className="text-white">{totalRegistered} total corporate entities</strong> across Delaware, Wyoming, and Texas jurisdictions.</span>
          </div>
          <Link
            href="/dashboard/llc-management"
            className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
          >
            <span>Open LLC Management</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

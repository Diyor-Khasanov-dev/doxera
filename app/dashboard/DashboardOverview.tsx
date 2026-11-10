"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  ArrowUpRight,
  RefreshCw,
  Activity,
  Calendar,
} from "lucide-react";
import { LLCAnalyticsOverview } from "@/lib/models/llc";

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

  const activityList = data?.activityTimeline || data?.dailyUserAnalytics || [];

  // Determine peak LLC count for Y axis scale
  const rawMaxLLC = Math.max(
    ...activityList.map((d) => Math.max(d.totalLLCs ?? 0, d.activityCount ?? 0, d.activeLLCs ?? 0)),
    data?.totalLLCs ?? 0,
    3
  );
  const maxLLCCount = Math.max(rawMaxLLC, 4);
  const minLLCCount = 0;

  // SVG Chart dimensions and coordinates
  const svgWidth = 700;
  const svgHeight = 260;
  const paddingX = 45;
  const paddingTop = 30;
  const paddingBottom = 40;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const points = activityList.map((item, idx) => {
    const divisor = activityList.length > 1 ? activityList.length - 1 : 1;
    const x = paddingX + (idx / divisor) * chartWidth;
    const yRange = maxLLCCount - minLLCCount;
    const val = item.totalLLCs ?? 0;
    const y = paddingTop + chartHeight - ((val - minLLCCount) / (yRange || 1)) * chartHeight;
    return { x, y, item, idx };
  });

  const linePathD = points.length === 0
    ? `M ${paddingX} ${paddingTop + chartHeight} L ${paddingX + chartWidth} ${paddingTop + chartHeight}`
    : points.length === 1
    ? `M ${points[0].x} ${points[0].y} L ${points[0].x + chartWidth} ${points[0].y}`
    : points.reduce((acc, curr, index) => {
        if (index === 0) return `M ${curr.x} ${curr.y}`;
        const prev = points[index - 1];
        const cp1x = prev.x + (curr.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (curr.x - prev.x) / 2;
        const cp2y = curr.y;
        return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      }, "");

  const lastPointX = points.length > 0 ? points[points.length - 1].x : paddingX + chartWidth;
  const firstPointX = points.length > 0 ? points[0].x : paddingX;
  const areaPathD = `${linePathD} L ${lastPointX} ${paddingTop + chartHeight} L ${firstPointX} ${paddingTop + chartHeight} Z`;

  // Horizontal guide lines
  const midPoint = Math.ceil(maxLLCCount / 2);
  const yTicks = Array.from(new Set([0, midPoint, maxLLCCount])).sort((a, b) => a - b);

  const todayMetric = activityList.find((d) => d.isToday) || (activityList.length > 0 ? activityList[activityList.length - 1] : null);
  const totalRegisteredNow = data?.totalLLCs ?? 0;
  const totalActiveNow = data?.activeLLCs ?? 0;

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
            Real-time entity operations and LLC user trajectory.
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

      {/* TOP CARD: TOTALLY REGISTERED USERS */}
      <div className="p-6 rounded-xl border border-[#222222] bg-[#0c0c0e] hover:border-zinc-700 transition-all relative overflow-hidden group shadow-lg">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
          <span className="text-sm font-medium text-zinc-300">Totally Registered Users</span>
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="text-4xl font-extrabold text-white tracking-tight font-mono">
          {isLoading ? (
            <span className="text-zinc-600">--</span>
          ) : (
            data?.totalLLCs ?? 0
          )}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-[#18181b]">
          <span className="text-zinc-500">Active Status</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {data?.activeLLCs ?? 0} Active Registered Entities ({data?.totalLLCs ? Math.round(((data.activeLLCs ?? 0) / data.totalLLCs) * 100) : 0}%)
          </span>
        </div>
      </div>

      {/* LINE CHART: REAL LLCs' ACTIVITY */}
      <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 shadow-2xl space-y-6">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1f1f22]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">LLCs&apos; Activity Timeline</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Real LLC registrations and entity activity over time &middot; Current: {totalRegisteredNow} {totalRegisteredNow === 1 ? "LLC" : "LLCs"} ({totalActiveNow} active).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-zinc-400">Total Registered Entities</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              <span className="text-zinc-400">Active LLCs</span>
            </div>
          </div>
        </div>

        {/* Line Chart Container */}
        <div className="p-6 rounded-xl border border-[#1e1e22] bg-[#08080a] relative">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Entity Trajectory & Registration Timeline</span>
            </span>
            <span className="font-mono text-xs text-zinc-500">
              Peak: {maxLLCCount} LLCs
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
                const y = paddingTop + chartHeight - ((val - minLLCCount) / (maxLLCCount - minLLCCount || 1)) * chartHeight;
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
                const pointColor = item.isToday
                  ? "#34d399"
                  : (item.newRegistrations && item.newRegistrations > 0)
                  ? "#60a5fa"
                  : "#a1a1aa";

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

                    {/* Outer ring on hover/today */}
                    {(isHovered || item.isToday || (item.newRegistrations && item.newRegistrations > 0)) && (
                      <circle
                        cx={x}
                        y={y}
                        r={isHovered ? 8 : 6}
                        fill={item.isToday ? "#10b981" : "#3b82f6"}
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
                      className="transition-all duration-200 pointer-events-none"
                    />

                    {/* Hit area for easier hover */}
                    <circle
                      cx={x}
                      y={y}
                      r={20}
                      fill="transparent"
                      className="chart-hit-point cursor-pointer"
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
                className={`absolute z-20 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs shadow-2xl pointer-events-none transition-all duration-150 min-w-[170px] ${
                  hoveredIndex >= points.length - 2
                    ? "-translate-x-full -translate-y-full ml-[-12px]"
                    : hoveredIndex <= 1
                    ? "translate-x-0 -translate-y-full ml-3"
                    : "-translate-x-1/2 -translate-y-full"
                }`}
                style={{
                  left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                  top: `${Math.max(25, (points[hoveredIndex].y / svgHeight) * 100)}%`,
                  marginTop: "-12px",
                }}
              >
                <div className="font-semibold flex items-center justify-between gap-1.5 text-zinc-100 border-b border-zinc-800 pb-1 mb-1.5">
                  <span>{points[hoveredIndex].item.dayLabel}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {points[hoveredIndex].item.dateString}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-400">Total LLCs:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {points[hoveredIndex].item.totalLLCs}{" "}
                      {points[hoveredIndex].item.totalLLCs === 1 ? "LLC" : "LLCs"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-400">Active Entities:</span>
                    <span className="text-blue-400 font-mono font-medium">
                      {points[hoveredIndex].item.activeLLCs}
                    </span>
                  </div>
                  {points[hoveredIndex].item.newRegistrations > 0 && (
                    <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-zinc-800 text-amber-400">
                      <span className="text-[10px]">New Registrations:</span>
                      <span className="font-mono font-bold">+{points[hoveredIndex].item.newRegistrations}</span>
                    </div>
                  )}
                  {points[hoveredIndex].item.activityCount > 0 && (
                    <div className="text-[10px] text-zinc-400 pt-0.5 border-t border-zinc-800">
                      {points[hoveredIndex].item.activityCount} recorded {points[hoveredIndex].item.activityCount === 1 ? "action" : "actions"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* X-axis Labels */}
          <div className="flex items-center justify-between gap-2 pt-3 text-xs border-t border-[#1f1f24] mt-2">
            {activityList.map((item, idx) => (
              <div key={idx} className="flex-1 text-center">
                <span
                  className={`block text-[11px] font-medium transition-colors ${
                    item.isToday
                      ? "text-emerald-400 font-bold"
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
            <span>
              Real LLC record tally: <strong className="text-white">{todayMetric?.totalLLCs ?? totalRegisteredNow} registered entities</strong> ({todayMetric?.activeLLCs ?? totalActiveNow} in active standing).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>
              Activity timeline: <strong className="text-white">{todayMetric?.dateString || "Current"}</strong> records live LLC operations.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

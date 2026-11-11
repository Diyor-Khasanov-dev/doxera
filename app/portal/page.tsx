"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  DollarSign,
  FileText,
  Clock,
  TrendingUp,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { LLCItem } from "@/lib/models/llc";

export default function PortalDashboardPage() {
  const router = useRouter();
  const [llc, setLlc] = useState<LLCItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-white mb-3" />
        <p className="text-xs font-mono">Loading LLC Portal...</p>
      </div>
    );
  }

  if (!llc) {
    return null;
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Top Header displaying the page name: Dashboard */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Dashboard
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
              {llc.status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Overview and corporate health for <span className="text-white font-medium">{llc.companyName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-lg border border-[#222222] bg-[#0c0c0e] text-xs">
            <span className="text-zinc-500 block text-[10px]">Federal EIN</span>
            <span className="font-mono text-white font-medium">{llc.ein}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-[#222222] bg-[#0c0c0e] text-xs">
            <span className="text-zinc-500 block text-[10px]">Jurisdiction</span>
            <span className="font-mono text-white font-medium">{llc.state}</span>
          </div>
        </div>
      </div>

      {/* Analytics & Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Annual Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight font-mono">
            {formatCurrency(llc.revenue)}
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Financial filings up to date</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>State Compliance</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight font-mono">
            {llc.analytics?.complianceScore || 95}%
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Good standing in {llc.state}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Vault Documents</span>
            <FileText className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight font-mono">
            {llc.documentsCount} Files
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Articles, EIN confirmation & reports
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e]">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Active Filings</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight font-mono">
            {llc.analytics?.activeFilings || 1} Registered
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Registered agent service active
          </div>
        </div>
      </div>

      {/* Main Grid: Revenue Trajectory + Entity Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6">
            <h2 className="text-sm font-semibold text-white mb-4">
              Revenue & Performance Trajectory
            </h2>
            <div className="grid grid-cols-6 gap-2 h-32 items-end bg-[#08080a] p-4 rounded-xl border border-[#1f1f22]">
              {llc.analytics?.monthlyRevenue?.map((rev, idx) => {
                const maxRev = Math.max(...(llc.analytics?.monthlyRevenue || [1]), 1);
                const height = Math.max(15, Math.round((rev / maxRev) * 100));
                const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-zinc-400">
                      ${(rev / 1000).toFixed(0)}k
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-sm"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {months[idx] || `M${idx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Compliance & Audit Activity</h2>
            <div className="space-y-2 text-xs">
              {llc.analytics?.auditLogs?.map((log, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-[#1e1e22] bg-[#0a0a0c] flex items-center justify-between gap-4"
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
        </div>

        {/* Right column details */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 text-xs space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white">Entity Profile</h3>
            </div>
            <div className="space-y-2 pt-2 border-t border-[#1e1e24]">
              <div>
                <span className="text-zinc-500 block text-[10px]">Legal Name</span>
                <span className="text-white font-medium">{llc.companyName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Reference Identifier</span>
                <span className="text-zinc-300 font-mono">{llc.llcId}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Date of Formation</span>
                <span className="text-zinc-300">{llc.formationDate}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Primary Contact</span>
                <span className="text-zinc-300 font-mono">{llc.email}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Tier Plan</span>
                <span className="text-white font-medium">{llc.plan}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] p-6 text-xs space-y-3">
            <h3 className="font-semibold text-white">Registered Entity Support</h3>
            <p className="text-zinc-400">
              Need to amend corporate filings, add company officers, or request official certificates of good standing? Contact your assigned agent team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

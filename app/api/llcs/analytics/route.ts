import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken } from "@/lib/auth";
import { getAllLLCs } from "@/lib/llcStore";
import { LLCAnalyticsOverview } from "@/lib/models/llc";

// GET /api/llcs/analytics - Aggregated statistics across all LLCs
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || payload?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const llcs = await getAllLLCs();

  const totalLLCs = llcs.length;
  let activeLLCs = 0;
  let pendingLLCs = 0;
  let suspendedLLCs = 0;
  let totalRevenue = 0;
  let complianceSum = 0;
  let totalFilings = 0;

  const stateCounts: Record<string, number> = {};
  const planCounts: Record<string, number> = {};
  const monthlyRevenueAccumulator = [0, 0, 0, 0, 0, 0];

  for (const item of llcs) {
    if (item.status === "active") activeLLCs++;
    else if (item.status === "pending") pendingLLCs++;
    else if (item.status === "suspended") suspendedLLCs++;

    totalRevenue += item.revenue || 0;
    complianceSum += item.analytics?.complianceScore || 0;
    totalFilings += item.analytics?.activeFilings || 0;

    const state = item.state || "Other";
    stateCounts[state] = (stateCounts[state] || 0) + 1;

    const plan = item.plan || "Starter";
    planCounts[plan] = (planCounts[plan] || 0) + 1;

    if (item.analytics?.monthlyRevenue && Array.isArray(item.analytics.monthlyRevenue)) {
      item.analytics.monthlyRevenue.slice(-6).forEach((rev, idx) => {
        monthlyRevenueAccumulator[idx] = (monthlyRevenueAccumulator[idx] || 0) + rev;
      });
    }
  }

  const averageCompliance = totalLLCs > 0 ? Math.round(complianceSum / totalLLCs) : 0;

  const monthNames = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const monthlyRevenueTotals = monthNames.map((month, idx) => ({
    month,
    amount: monthlyRevenueAccumulator[idx] || 0,
  }));

  const stateDistribution = Object.entries(stateCounts).map(([state, count]) => ({
    state,
    count,
  }));

  const planDistribution = Object.entries(planCounts).map(([plan, count]) => ({
    plan,
    count,
  }));

  const overview: LLCAnalyticsOverview = {
    totalLLCs,
    activeLLCs,
    pendingLLCs,
    suspendedLLCs,
    totalRevenue,
    averageCompliance,
    totalFilings,
    stateDistribution,
    planDistribution,
    monthlyRevenueTotals,
  };

  return NextResponse.json({
    success: true,
    data: overview,
  });
}

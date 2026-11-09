import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken } from "@/lib/auth";
import { getAllLLCs } from "@/lib/llcStore";
import { LLCAnalyticsOverview, LLCTimelinePoint, LLCStatusDistribution } from "@/lib/models/llc";

// GET /api/llcs/analytics - Real aggregated LLC management statistics across all registered LLCs
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

  const statusDistribution: LLCStatusDistribution[] = [
    {
      status: "active",
      label: "Active Entities",
      count: activeLLCs,
      percentage: totalLLCs > 0 ? Math.round((activeLLCs / totalLLCs) * 100) : 0,
    },
    {
      status: "pending",
      label: "Pending Review",
      count: pendingLLCs,
      percentage: totalLLCs > 0 ? Math.round((pendingLLCs / totalLLCs) * 100) : 0,
    },
    {
      status: "suspended",
      label: "Suspended",
      count: suspendedLLCs,
      percentage: totalLLCs > 0 ? Math.round((suspendedLLCs / totalLLCs) * 100) : 0,
    },
  ];

  // Build real LLC management timeline from actual LLC createdAt registration timestamps
  // Sort entities chronologically ascending
  const sortedLLCs = [...llcs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const timeline: LLCTimelinePoint[] = [];

  if (sortedLLCs.length === 0) {
    const todayStr = new Date().toISOString().split("T")[0];
    timeline.push({
      label: "Today",
      dateString: todayStr,
      registeredLLCs: 0,
      activeLLCs: 0,
      pendingLLCs: 0,
      suspendedLLCs: 0,
      isCurrent: true,
    });
  } else {
    // Generate cumulative registration curve based on real entities
    let runningActive = 0;
    let runningPending = 0;
    let runningSuspended = 0;

    sortedLLCs.forEach((item, index) => {
      if (item.status === "active") runningActive++;
      else if (item.status === "pending") runningPending++;
      else if (item.status === "suspended") runningSuspended++;

      const dateObj = new Date(item.createdAt);
      const dateString = isNaN(dateObj.getTime())
        ? new Date().toISOString().split("T")[0]
        : dateObj.toISOString().split("T")[0];

      const monthName = isNaN(dateObj.getTime())
        ? "Entity"
        : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      timeline.push({
        label: `${monthName} (${item.llcId})`,
        dateString,
        registeredLLCs: index + 1,
        activeLLCs: runningActive,
        pendingLLCs: runningPending,
        suspendedLLCs: runningSuspended,
        isCurrent: index === sortedLLCs.length - 1,
      });
    });

    // If only 1 or 2 entities exist, prepend an origin point for clean line visualization
    if (timeline.length === 1) {
      timeline.unshift({
        label: "Start",
        dateString: "Initial",
        registeredLLCs: 0,
        activeLLCs: 0,
        pendingLLCs: 0,
        suspendedLLCs: 0,
        isCurrent: false,
      });
    }
  }

  // Recent LLCs for management reference
  const recentLLCs = sortedLLCs
    .slice()
    .reverse()
    .slice(0, 5)
    .map((item) => ({
      _id: item._id,
      companyName: item.companyName,
      llcId: item.llcId,
      status: item.status,
      createdAt: item.createdAt,
    }));

  const overview: LLCAnalyticsOverview = {
    totalLLCs,
    activeLLCs,
    pendingLLCs,
    suspendedLLCs,
    totalRevenue,
    averageCompliance,
    totalFilings,
    statusDistribution,
    timeline,
    stateDistribution,
    planDistribution,
    monthlyRevenueTotals,
    recentLLCs,
  };

  return NextResponse.json({
    success: true,
    data: overview,
  });
}

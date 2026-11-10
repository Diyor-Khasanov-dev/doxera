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

  // Calculate REAL daily LLC activity across registered LLC accounts
  // Tracks exactly when LLCs were registered or performed activities, and how many LLCs were active/registered
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate 7-day chronological historical timeline up to today (i = 6 down to 0)
  const activityTimeline = [];

  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - i);
    const dateString = targetDate.toISOString().split("T")[0];

    const isToday = i === 0;
    const isYesterday = i === 1;
    let dayLabel = dayNames[targetDate.getDay()];
    if (isYesterday) {
      dayLabel = "Yesterday";
    } else if (isToday) {
      dayLabel = "Today";
    }

    // Count real LLC registrations created on or before this day
    const endOfDayIso = `${dateString}T23:59:59.999Z`;

    const existingLLCsUpToDay = llcs.filter((item) => {
      if (!item.createdAt) return true;
      return item.createdAt <= endOfDayIso;
    });

    const activeLLCsUpToDay = existingLLCsUpToDay.filter(
      (item) => item.status === "active"
    ).length;

    // Real new LLC registrations created on this exact date
    const newRegistrationsList = llcs.filter((item) => {
      const createdDateOnly = item.createdAt ? item.createdAt.split("T")[0] : "";
      return createdDateOnly === dateString;
    });
    const newRegistrations = newRegistrationsList.length;

    // Real activity occurrences on this date (audit logs + profile updates + creations)
    const activities: { companyName: string; action: string; time?: string }[] = [];

    for (const item of llcs) {
      // Audit log entries matching this date
      if (item.analytics?.auditLogs && Array.isArray(item.analytics.auditLogs)) {
        for (const log of item.analytics.auditLogs) {
          const logDate = log.timestamp ? log.timestamp.split("T")[0] : "";
          if (logDate === dateString) {
            activities.push({
              companyName: item.companyName,
              action: log.action || "Audit activity recorded",
              time: log.timestamp.includes("T") ? log.timestamp.split("T")[1].slice(0, 5) : undefined,
            });
          }
        }
      }

      // New registration action
      if (item.createdAt && item.createdAt.split("T")[0] === dateString) {
        if (!activities.some((a) => a.companyName === item.companyName && a.action.includes("Created"))) {
          activities.push({
            companyName: item.companyName,
            action: "Entity Registered & Account Provisioned",
            time: item.createdAt.includes("T") ? item.createdAt.split("T")[1].slice(0, 5) : undefined,
          });
        }
      }
    }

    const activityCount = activities.length;
    const totalCount = existingLLCsUpToDay.length;

    activityTimeline.push({
      dayLabel,
      dateString,
      totalLLCs: totalCount,
      activeLLCs: activeLLCsUpToDay,
      newRegistrations,
      activityCount,
      isToday,
      activities,
      userCount: totalCount,
      activeSessions: activeLLCsUpToDay,
      isTomorrow: false,
    });
  }

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
    dailyUserAnalytics: activityTimeline,
    activityTimeline,
  };

  return NextResponse.json({
    success: true,
    data: overview,
  });
}

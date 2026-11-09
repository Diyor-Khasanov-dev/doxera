export interface LLCAnalytics {
  monthlyRevenue: number[]; // e.g. last 6 or 12 months
  activeFilings: number;
  complianceScore: number; // 0 - 100
  loginCount: number;
  lastLoginIp?: string;
  auditLogs: {
    action: string;
    timestamp: string;
    detail?: string;
  }[];
}

export interface LLCItem {
  _id?: string;
  companyName: string;
  llcId: string; // unique reference code, e.g. LLC-1092
  username: string; // unique login username
  passwordHash: string; // hashed password
  email: string;
  state: string; // e.g., Delaware, Wyoming, Texas, California
  formationDate: string; // YYYY-MM-DD
  ein: string; // XX-XXXXXXX
  plan: "Starter" | "Growth" | "Enterprise";
  status: "active" | "pending" | "suspended";
  revenue: number;
  documentsCount: number;
  notes?: string;
  analytics: LLCAnalytics;
  createdAt: string;
  updatedAt: string;
}

export type LLCSummary = Omit<LLCItem, "passwordHash">;

export interface LLCTimelinePoint {
  label: string; // e.g. "Q1 '24", "Mar 10", etc.
  dateString: string; // YYYY-MM-DD or readable date
  registeredLLCs: number; // cumulative or period total
  activeLLCs: number; // active entities up to this point
  pendingLLCs: number;
  suspendedLLCs: number;
  isCurrent?: boolean;
}

export interface LLCStatusDistribution {
  status: "active" | "pending" | "suspended";
  label: string;
  count: number;
  percentage: number;
}

export interface LLCAnalyticsOverview {
  totalLLCs: number;
  activeLLCs: number;
  pendingLLCs: number;
  suspendedLLCs: number;
  totalRevenue: number;
  averageCompliance: number;
  totalFilings: number;
  statusDistribution: LLCStatusDistribution[];
  timeline: LLCTimelinePoint[];
  stateDistribution: { state: string; count: number }[];
  planDistribution: { plan: string; count: number }[];
  monthlyRevenueTotals: { month: string; amount: number }[];
  recentLLCs?: {
    _id?: string;
    companyName: string;
    llcId: string;
    status: string;
    createdAt: string;
  }[];
}

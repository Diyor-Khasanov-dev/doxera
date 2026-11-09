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

export interface DailyUserMetric {
  dayLabel: string; // e.g. "Yesterday", "Today", "Tomorrow", "Thu", etc.
  dateString: string; // YYYY-MM-DD
  userCount: number; // e.g. 2, 3
  activeSessions: number;
  isToday?: boolean;
  isTomorrow?: boolean;
}

export interface LLCAnalyticsOverview {
  totalLLCs: number;
  activeLLCs: number;
  pendingLLCs: number;
  suspendedLLCs: number;
  totalRevenue: number;
  averageCompliance: number;
  totalFilings: number;
  stateDistribution: { state: string; count: number }[];
  planDistribution: { plan: string; count: number }[];
  monthlyRevenueTotals: { month: string; amount: number }[];
  dailyUserAnalytics: DailyUserMetric[];
}

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

export interface DailyLLCActivityMetric {
  dayLabel: string; // e.g. "Wed", "Yesterday", "Today"
  dateString: string; // YYYY-MM-DD
  totalLLCs: number; // Cumulative registered LLCs up to this date
  activeLLCs: number; // Active LLC entities up to this date
  newRegistrations: number; // How many new LLCs were registered on this date
  activityCount: number; // How many activities (filings, logs, updates) occurred on this date
  isToday?: boolean;
  activities?: {
    companyName: string;
    action: string;
    time?: string;
  }[];
}

// Retain DailyUserMetric alias for backward compatibility
export type DailyUserMetric = DailyLLCActivityMetric & {
  userCount: number;
  activeSessions: number;
  isTomorrow?: boolean;
};

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
  activityTimeline: DailyLLCActivityMetric[];
}

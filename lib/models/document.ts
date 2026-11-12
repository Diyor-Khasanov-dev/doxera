export type ExpirationType = "duration" | "endDate";

export type DocumentStatus = "active" | "warning" | "expired";

export interface LLCDocument {
  _id?: string;
  id?: string;
  llcId: string; // e.g. "LLC-8801" or LLC _id
  title: string;
  creationDate: string; // YYYY-MM-DD
  expirationType: ExpirationType;
  durationYears?: number; // e.g. 10
  endDate: string; // YYYY-MM-DD
  fileName?: string;
  fileSize?: string;
  fileFormat?: string;
  fileUrl?: string; // Data URL or storage URL
  createdAt: string;
  updatedAt: string;
}

export interface LLCDocumentWithComputedStatus extends LLCDocument {
  status: DocumentStatus;
  statusLabel: string;
  daysRemaining: number;
}

/**
 * Calculates document status based on endDate:
 * 1. If it is expired (endDate < today): expired
 * 2. From 3 months (today <= endDate <= 3 months ahead): expiring soon
 * 3. If it is not suitable for these two on top: active
 */
export function computeDocumentStatus(
  endDateStr: string,
  baseDate: Date = new Date()
): { status: DocumentStatus; statusLabel: string; daysRemaining: number } {
  if (!endDateStr) {
    return {
      status: "active",
      statusLabel: "Active",
      daysRemaining: 9999,
    };
  }

  // Parse YYYY-MM-DD
  const parts = endDateStr.split("-").map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return {
      status: "active",
      statusLabel: "Active",
      daysRemaining: 9999,
    };
  }

  const end = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);

  // 3 calendar months from today
  const threeMonthsAhead = new Date(today);
  threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

  const diffMs = end.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // If expired (end date is in the past)
  if (end.getTime() < today.getTime()) {
    return {
      status: "expired",
      statusLabel: "Expired",
      daysRemaining,
    };
  }

  // From 3 months (expiring within 3 months)
  if (end.getTime() <= threeMonthsAhead.getTime()) {
    return {
      status: "warning",
      statusLabel: "Expiring Soon",
      daysRemaining,
    };
  }

  // Otherwise active
  return {
    status: "active",
    statusLabel: "Active",
    daysRemaining,
  };
}

/**
 * Calculate endDate given creationDate (YYYY-MM-DD) and duration in years
 */
export function calculateEndDateFromDuration(creationDateStr: string, durationYears: number): string {
  const [year, month, day] = creationDateStr.split("-").map(Number);
  const calculatedYear = year + durationYears;

  // Handle Feb 29 leap year
  const date = new Date(calculatedYear, month - 1, day);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

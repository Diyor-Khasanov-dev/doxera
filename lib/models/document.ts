export type ExpirationType = "duration" | "endDate";

export type DocumentStatus = "active" | "warning" | "finished";

export interface LLCDocument {
  _id?: string;
  id?: string;
  llcId: string; // e.g. "LLC-8801" or LLC _id
  title: string;
  creationDate: string; // YYYY-MM-DD
  expirationType: ExpirationType;
  durationYears?: number; // e.g. 10
  endDate: string; // YYYY-MM-DD
  fileSize?: string;
  fileFormat?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LLCDocumentWithComputedStatus extends LLCDocument {
  status: DocumentStatus;
  statusLabel: string;
  daysRemaining: number;
}

/**
 * Calculates status based on endDate:
 * - If endDate < today (0 days or negative): finished (red badge)
 * - If endDate is within 3 months (approx 90 days / 3 calendar months): warning
 * - Otherwise: active
 */
export function computeDocumentStatus(
  endDateStr: string,
  baseDate: Date = new Date()
): { status: DocumentStatus; statusLabel: string; daysRemaining: number } {
  // Parse YYYY-MM-DD in UTC / local midnight
  const parts = endDateStr.split("-").map(Number);
  const end = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);

  // Set today to start of day
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);

  // 3 months from today:
  const threeMonthsAhead = new Date(today);
  threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

  const diffMs = end.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    return {
      status: "finished",
      statusLabel: "Finished",
      daysRemaining,
    };
  }

  if (end.getTime() <= threeMonthsAhead.getTime()) {
    return {
      status: "warning",
      statusLabel: "Expiring Soon",
      daysRemaining,
    };
  }

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

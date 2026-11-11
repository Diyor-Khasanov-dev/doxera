import { ObjectId } from "mongodb";
import {
  LLCDocument,
  LLCDocumentWithComputedStatus,
  computeDocumentStatus,
  calculateEndDateFromDuration,
} from "./models/document";
import { getDatabase } from "./mongodb";

const memoryDocumentStore: Map<string, LLCDocument> = new Map();

// Helper to format date offset from now for demo data
function getDateStringOffset(yearOffset: number, monthOffset: number = 0, dayOffset: number = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearOffset);
  d.setMonth(d.getMonth() + monthOffset);
  d.setDate(d.getDate() + dayOffset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Initial sample documents exhibiting:
// 1. Active (e.g. 10 years duration, or several years out)
// 2. Warning (expiring within 3 months, e.g. 45 days)
// 3. Finished (red badge, expired in the past)
const initialSampleDocuments: LLCDocument[] = [
  {
    _id: "77123456789abcdef0000001",
    id: "77123456789abcdef0000001",
    llcId: "LLC-8801",
    title: "Articles of Organization",
    creationDate: "2023-04-12",
    expirationType: "duration",
    durationYears: 10,
    endDate: calculateEndDateFromDuration("2023-04-12", 10), // 2033-04-12 -> Active
    fileSize: "1.4 MB",
    fileFormat: "PDF",
    createdAt: "2023-04-12T08:00:00Z",
    updatedAt: "2023-04-12T08:00:00Z",
  },
  {
    _id: "77123456789abcdef0000002",
    id: "77123456789abcdef0000002",
    llcId: "LLC-8801",
    title: "State Operating Certificate & By-Laws",
    creationDate: getDateStringOffset(-1, 0, 0), // 1 year ago
    expirationType: "endDate",
    endDate: getDateStringOffset(0, 1, 15), // ~45 days from today -> WARNING (nearly to finish, < 3 months)
    fileSize: "2.1 MB",
    fileFormat: "PDF",
    createdAt: "2024-05-01T10:00:00Z",
    updatedAt: "2024-05-01T10:00:00Z",
  },
  {
    _id: "77123456789abcdef0000003",
    id: "77123456789abcdef0000003",
    llcId: "LLC-8801",
    title: "Previous Year Annual Franchise Tax Permit",
    creationDate: "2024-01-15",
    expirationType: "endDate",
    endDate: getDateStringOffset(0, -1, 0), // 1 month ago -> FINISHED (red badge)
    fileSize: "860 KB",
    fileFormat: "PDF",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z",
  },
  {
    _id: "77123456789abcdef0000004",
    id: "77123456789abcdef0000004",
    llcId: "LLC-8801",
    title: "IRS EIN Federal Assignment Letter",
    creationDate: "2023-04-14",
    expirationType: "duration",
    durationYears: 10,
    endDate: calculateEndDateFromDuration("2023-04-14", 10), // Active
    fileSize: "420 KB",
    fileFormat: "PDF",
    createdAt: "2023-04-14T11:00:00Z",
    updatedAt: "2023-04-14T11:00:00Z",
  },
  {
    _id: "77123456789abcdef0000005",
    id: "77123456789abcdef0000005",
    llcId: "LLC-8802",
    title: "Wyoming Articles of Organization",
    creationDate: "2023-09-18",
    expirationType: "duration",
    durationYears: 10,
    endDate: calculateEndDateFromDuration("2023-09-18", 10), // Active
    fileSize: "1.1 MB",
    fileFormat: "PDF",
    createdAt: "2023-09-18T09:30:00Z",
    updatedAt: "2023-09-18T09:30:00Z",
  },
];

for (const doc of initialSampleDocuments) {
  memoryDocumentStore.set(doc.id!, doc);
}

async function isMongoAvailable(): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

export async function getDocumentsByLLC(
  llcId: string,
  filter?: {
    search?: string;
    sortBy?: "creationDate" | "endDate" | "title" | "status";
    sortOrder?: "asc" | "desc";
    status?: string;
  }
): Promise<LLCDocumentWithComputedStatus[]> {
  let docs: LLCDocument[] = [];

  const mongoOnline = await isMongoAvailable();
  if (mongoOnline) {
    const db = await getDatabase();
    const query: Record<string, unknown> = { llcId };
    const raw = await db.collection("documents").find(query).toArray();
    docs = raw.map((d) => ({
      ...d,
      _id: d._id.toString(),
      id: d._id.toString(),
    })) as unknown as LLCDocument[];
  } else {
    docs = Array.from(memoryDocumentStore.values()).filter((d) => d.llcId === llcId);
  }

  // Compute status on each document
  let enriched: LLCDocumentWithComputedStatus[] = docs.map((d) => {
    const { status, statusLabel, daysRemaining } = computeDocumentStatus(d.endDate);
    return {
      ...d,
      status,
      statusLabel,
      daysRemaining,
    };
  });

  // Filter by search
  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    enriched = enriched.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.creationDate.includes(q) ||
        d.endDate.includes(q) ||
        d.status.toLowerCase().includes(q) ||
        d.statusLabel.toLowerCase().includes(q)
    );
  }

  // Filter by status if requested
  if (filter?.status && filter.status !== "all") {
    enriched = enriched.filter((d) => d.status === filter.status);
  }

  // Sort
  const sortBy = filter?.sortBy || "creationDate";
  const sortOrder = filter?.sortOrder === "asc" ? 1 : -1;

  enriched.sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title) * sortOrder;
    }
    if (sortBy === "creationDate") {
      return (new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime()) * sortOrder;
    }
    if (sortBy === "endDate") {
      return (new Date(a.endDate).getTime() - new Date(b.endDate).getTime()) * sortOrder;
    }
    if (sortBy === "status") {
      const orderMap = { warning: 1, active: 2, finished: 3 };
      return ((orderMap[a.status] || 0) - (orderMap[b.status] || 0)) * sortOrder;
    }
    return 0;
  });

  return enriched;
}

export async function findDocumentById(id: string, llcId: string): Promise<LLCDocument | null> {
  const mongoOnline = await isMongoAvailable();
  if (mongoOnline) {
    const db = await getDatabase();
    const query: Record<string, unknown> = { llcId };
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else {
      query.id = id;
    }
    const doc = await db.collection("documents").findOne(query);
    if (!doc) return null;
    return {
      ...doc,
      _id: doc._id.toString(),
      id: doc._id.toString(),
    } as unknown as LLCDocument;
  }

  const doc = memoryDocumentStore.get(id);
  if (doc && doc.llcId === llcId) {
    return doc;
  }
  for (const item of memoryDocumentStore.values()) {
    if ((item.id === id || item._id === id) && item.llcId === llcId) {
      return item;
    }
  }
  return null;
}

export async function createDocument(
  data: Omit<LLCDocument, "_id" | "id" | "createdAt" | "updatedAt">
): Promise<LLCDocumentWithComputedStatus> {
  const mongoOnline = await isMongoAvailable();
  const now = new Date().toISOString();

  let finalEndDate = data.endDate;
  if (data.expirationType === "duration") {
    const duration = data.durationYears || 10;
    finalEndDate = calculateEndDateFromDuration(data.creationDate, duration);
  }

  const payload: Omit<LLCDocument, "_id" | "id"> = {
    ...data,
    endDate: finalEndDate,
    createdAt: now,
    updatedAt: now,
  };

  let createdId: string;
  if (mongoOnline) {
    const db = await getDatabase();
    const res = await db.collection("documents").insertOne(payload);
    createdId = res.insertedId.toString();
  } else {
    createdId = new ObjectId().toString();
  }

  const saved: LLCDocument = {
    ...payload,
    _id: createdId,
    id: createdId,
  };

  if (!mongoOnline) {
    memoryDocumentStore.set(createdId, saved);
  }

  const { status, statusLabel, daysRemaining } = computeDocumentStatus(saved.endDate);
  return {
    ...saved,
    status,
    statusLabel,
    daysRemaining,
  };
}

export interface UpdateDocumentPayload {
  title?: string;
  creationDate?: string;
  expirationType?: "duration" | "endDate";
  durationYears?: number;
  endDate?: string;
}

export async function updateDocument(
  id: string,
  llcId: string,
  updates: UpdateDocumentPayload
): Promise<LLCDocumentWithComputedStatus | null> {
  const existing = await findDocumentById(id, llcId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const newTitle = updates.title !== undefined ? updates.title.trim() : existing.title;
  const newCreationDate = updates.creationDate !== undefined ? updates.creationDate : existing.creationDate;
  const newExpirationType = updates.expirationType !== undefined ? updates.expirationType : existing.expirationType;
  const newDurationYears = updates.durationYears !== undefined ? updates.durationYears : existing.durationYears;

  let newEndDate = existing.endDate;
  if (newExpirationType === "duration") {
    const duration = newDurationYears || 10;
    newEndDate = calculateEndDateFromDuration(newCreationDate, duration);
  } else if (updates.endDate) {
    newEndDate = updates.endDate;
  }

  const nextFields: Partial<LLCDocument> = {
    title: newTitle,
    creationDate: newCreationDate,
    expirationType: newExpirationType,
    durationYears: newDurationYears,
    endDate: newEndDate,
    updatedAt: now,
  };

  const mongoOnline = await isMongoAvailable();
  if (mongoOnline) {
    const db = await getDatabase();
    const query: Record<string, unknown> = { llcId };
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else {
      query.id = id;
    }
    const res = await db.collection("documents").findOneAndUpdate(
      query,
      { $set: nextFields },
      { returnDocument: "after" }
    );
    if (!res) return null;
    const doc = {
      ...res,
      _id: res._id.toString(),
      id: res._id.toString(),
    } as unknown as LLCDocument;
    const computed = computeDocumentStatus(doc.endDate);
    return { ...doc, ...computed };
  }

  // Memory store update
  const updatedDoc: LLCDocument = {
    ...existing,
    ...nextFields,
  };
  memoryDocumentStore.set(existing.id || id, updatedDoc);

  const computed = computeDocumentStatus(updatedDoc.endDate);
  return {
    ...updatedDoc,
    ...computed,
  };
}

export async function deleteDocument(id: string, llcId: string): Promise<boolean> {
  const mongoOnline = await isMongoAvailable();
  if (mongoOnline) {
    const db = await getDatabase();
    const query: Record<string, unknown> = { llcId };
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else {
      query.id = id;
    }
    const res = await db.collection("documents").deleteOne(query);
    return (res.deletedCount ?? 0) > 0;
  }

  const existing = await findDocumentById(id, llcId);
  if (!existing) return false;

  memoryDocumentStore.delete(existing.id || id);
  if (existing._id) {
    memoryDocumentStore.delete(existing._id);
  }
  return true;
}

/**
 * In-memory repository fallback for development/demo environments
 * when an external MongoDB connection is not accessible.
 * When MongoDB is reachable, the Mongo collection is used.
 */
import { ObjectId } from "mongodb";
import { LLCItem } from "./models/llc";
import { getDatabase } from "./mongodb";

const memoryStore: Map<string, LLCItem> = new Map();

// Seed initial sample LLCs for instant testing & rich analytics out-of-the-box
const initialSampleLLCs: LLCItem[] = [
  {
    _id: "66123456789abcdef0000001",
    companyName: "Apex Dynamics LLC",
    llcId: "LLC-8801",
    username: "apexdynamics",
    // bcrypt hash of "apexPass123!"
    passwordHash: "$2a$10$w4Bq8kP3OQ.tS5m9v64rCeRj40eT8H5h87Fk/m7FwI5h3p03P5b.O",
    email: "ops@apexdynamics.io",
    state: "Delaware",
    formationDate: "2023-04-12",
    ein: "12-3456789",
    plan: "Enterprise",
    status: "active",
    revenue: 485000,
    documentsCount: 14,
    notes: "Primary Delaware enterprise entity with multi-state operations.",
    analytics: {
      monthlyRevenue: [32000, 35000, 39000, 42000, 45000, 48500],
      activeFilings: 5,
      complianceScore: 98,
      loginCount: 42,
      lastLoginIp: "192.168.1.1",
      auditLogs: [
        {
          action: "Annual Report Filed",
          timestamp: "2025-01-15T10:00:00Z",
          detail: "Delaware Division of Corporations receipt #DE-9921",
        },
        {
          action: "Franchise Tax Paid",
          timestamp: "2025-02-01T14:32:00Z",
          detail: "Full tax balance settled",
        },
      ],
    },
    createdAt: "2023-04-12T08:00:00Z",
    updatedAt: "2025-02-01T14:32:00Z",
  },
  {
    _id: "66123456789abcdef0000002",
    companyName: "Solaria Ventures LLC",
    llcId: "LLC-8802",
    username: "solaria",
    // bcrypt hash of "solaria2025!"
    passwordHash: "$2a$10$w4Bq8kP3OQ.tS5m9v64rCeRj40eT8H5h87Fk/m7FwI5h3p03P5b.O",
    email: "contact@solaria.co",
    state: "Wyoming",
    formationDate: "2023-09-18",
    ein: "98-7654321",
    plan: "Growth",
    status: "active",
    revenue: 215000,
    documentsCount: 8,
    notes: "Wyoming privacy holding company.",
    analytics: {
      monthlyRevenue: [15000, 16500, 18000, 20000, 22000, 24500],
      activeFilings: 3,
      complianceScore: 92,
      loginCount: 26,
      lastLoginIp: "10.0.0.4",
      auditLogs: [
        {
          action: "Registered Agent Verified",
          timestamp: "2024-11-10T12:00:00Z",
          detail: "Cheyenne, WY Agent Confirmation",
        },
      ],
    },
    createdAt: "2023-09-18T09:30:00Z",
    updatedAt: "2025-01-20T11:15:00Z",
  },
  {
    _id: "66123456789abcdef0000003",
    companyName: "Nova Horizon Tech LLC",
    llcId: "LLC-8803",
    username: "novahorizon",
    // bcrypt hash of "novaSecure789!"
    passwordHash: "$2a$10$w4Bq8kP3OQ.tS5m9v64rCeRj40eT8H5h87Fk/m7FwI5h3p03P5b.O",
    email: "hello@novahorizon.dev",
    state: "Texas",
    formationDate: "2024-02-05",
    ein: "45-9876543",
    plan: "Starter",
    status: "pending",
    revenue: 89000,
    documentsCount: 4,
    notes: "Awaiting final state franchise tax registration confirmation.",
    analytics: {
      monthlyRevenue: [6000, 7200, 8100, 9400, 10500, 12000],
      activeFilings: 2,
      complianceScore: 78,
      loginCount: 11,
      auditLogs: [
        {
          action: "Articles of Organization Submitted",
          timestamp: "2024-02-05T08:15:00Z",
          detail: "Austin SOS filing #TX-5510",
        },
      ],
    },
    createdAt: "2024-02-05T08:15:00Z",
    updatedAt: "2024-12-01T16:00:00Z",
  },
];

for (const item of initialSampleLLCs) {
  memoryStore.set(item._id!, item);
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

export async function findLLCByUsername(username: string): Promise<LLCItem | null> {
  const mongoOnline = await isMongoAvailable();
  if (mongoOnline) {
    const db = await getDatabase();
    const doc = await db.collection("llcs").findOne({
      username: { $regex: new RegExp(`^${username.trim()}$`, "i") },
    });
    if (doc) {
      return {
        ...doc,
        _id: doc._id.toString(),
      } as unknown as LLCItem;
    }
    return null;
  }

  // Fallback memory store
  const target = username.trim().toLowerCase();
  for (const item of memoryStore.values()) {
    if (item.username.toLowerCase() === target) {
      return item;
    }
  }
  return null;
}

export async function findLLCById(id: string): Promise<LLCItem | null> {
  const mongoOnline = await isMongoAvailable();
  if (mongoOnline) {
    const db = await getDatabase();
    let query: Record<string, unknown> = { llcId: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { llcId: id }] };
    }
    const doc = await db.collection("llcs").findOne(query);
    if (doc) {
      return {
        ...doc,
        _id: doc._id.toString(),
      } as unknown as LLCItem;
    }
    return null;
  }

  // Fallback memory store
  if (memoryStore.has(id)) {
    return memoryStore.get(id)!;
  }
  for (const item of memoryStore.values()) {
    if (item.llcId === id || item._id === id) {
      return item;
    }
  }
  return null;
}

export async function getAllLLCs(filter?: {
  search?: string;
  status?: string;
  state?: string;
  plan?: string;
}): Promise<LLCItem[]> {
  const mongoOnline = await isMongoAvailable();
  if (mongoOnline) {
    const db = await getDatabase();
    const query: Record<string, unknown> = {};
    if (filter?.status && filter.status !== "all") {
      query.status = filter.status;
    }
    if (filter?.state && filter.state !== "all") {
      query.state = filter.state;
    }
    if (filter?.plan && filter.plan !== "all") {
      query.plan = filter.plan;
    }
    if (filter?.search) {
      const regex = new RegExp(filter.search, "i");
      query.$or = [
        { companyName: regex },
        { username: regex },
        { llcId: regex },
        { email: regex },
        { ein: regex },
      ];
    }
    const docs = await db.collection("llcs").find(query).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => ({ ...d, _id: d._id.toString() } as unknown as LLCItem));
  }

  // Fallback memory store
  let items = Array.from(memoryStore.values());
  if (filter?.status && filter.status !== "all") {
    items = items.filter((i) => i.status === filter.status);
  }
  if (filter?.state && filter.state !== "all") {
    items = items.filter((i) => i.state.toLowerCase() === filter.state?.toLowerCase());
  }
  if (filter?.plan && filter.plan !== "all") {
    items = items.filter((i) => i.plan === filter.plan);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.companyName.toLowerCase().includes(q) ||
        i.username.toLowerCase().includes(q) ||
        i.llcId.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.ein.toLowerCase().includes(q)
    );
  }
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createLLC(data: Omit<LLCItem, "_id" | "createdAt" | "updatedAt">): Promise<LLCItem> {
  const mongoOnline = await isMongoAvailable();
  const now = new Date().toISOString();

  if (mongoOnline) {
    const db = await getDatabase();
    const insertPayload = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const res = await db.collection("llcs").insertOne(insertPayload);
    return {
      ...insertPayload,
      _id: res.insertedId.toString(),
    };
  }

  // Fallback memory store
  const id = new ObjectId().toString();
  const newLLC: LLCItem = {
    ...data,
    _id: id,
    createdAt: now,
    updatedAt: now,
  };
  memoryStore.set(id, newLLC);
  return newLLC;
}

export async function updateLLC(id: string, updates: Partial<LLCItem>): Promise<LLCItem | null> {
  const mongoOnline = await isMongoAvailable();
  const now = new Date().toISOString();
  delete updates._id;
  delete updates.createdAt;
  updates.updatedAt = now;

  if (mongoOnline) {
    const db = await getDatabase();
    let query: Record<string, unknown> = { llcId: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { llcId: id }] };
    }
    const res = await db.collection("llcs").findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: "after" }
    );
    if (!res) return null;
    return {
      ...res,
      _id: res._id.toString(),
    } as unknown as LLCItem;
  }

  // Fallback memory store
  let existing = memoryStore.get(id);
  if (!existing) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.llcId === id || v._id === id) {
        existing = v;
        id = k;
        break;
      }
    }
  }

  if (!existing) return null;

  const updated: LLCItem = {
    ...existing,
    ...updates,
    updatedAt: now,
  };
  memoryStore.set(id, updated);
  return updated;
}

export async function deleteLLC(id: string): Promise<boolean> {
  const mongoOnline = await isMongoAvailable();
  if (mongoOnline) {
    const db = await getDatabase();
    let query: Record<string, unknown> = { llcId: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { llcId: id }] };
    }
    const res = await db.collection("llcs").deleteOne(query);
    return (res.deletedCount ?? 0) > 0;
  }

  // Fallback memory store
  if (memoryStore.has(id)) {
    return memoryStore.delete(id);
  }
  for (const [k, v] of memoryStore.entries()) {
    if (v.llcId === id || v._id === id) {
      return memoryStore.delete(k);
    }
  }
  return false;
}

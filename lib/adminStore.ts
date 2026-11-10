import bcrypt from "bcryptjs";
import { getDatabase } from "./mongodb";

export interface AdminUser {
  _id?: string;
  username: string;
  name: string;
  passwordHash?: string;
  role: string;
  updatedAt?: string;
}

// In-memory fallback for admin profile
let memoryAdminUser: AdminUser = {
  username: process.env.ADMIN_USERNAME || "admin",
  name: "Admin User",
  // bcrypt hash of "admin123!"
  passwordHash: "$2b$10$vHkP33SbUPXMfE5wYXqPp.KrW68ytJVKSqEhskUGx8NYIeSeYO//e",
  role: "Administrator",
  updatedAt: new Date().toISOString(),
};

async function isMongoAvailable(): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

export async function getAdminUser(): Promise<AdminUser> {
  const mongoOnline = await isMongoAvailable();
  if (mongoOnline) {
    try {
      const db = await getDatabase();
      const doc = await db.collection("admins").findOne({ role: "Administrator" });
      if (doc) {
        return {
          _id: doc._id.toString(),
          username: doc.username,
          name: doc.name || "Admin User",
          passwordHash: doc.passwordHash,
          role: doc.role || "Administrator",
          updatedAt: doc.updatedAt,
        };
      } else {
        // Seed initial admin document into MongoDB
        const defaultHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123!", 10);
        const initialDoc = {
          username: process.env.ADMIN_USERNAME || "admin",
          name: "Admin User",
          passwordHash: defaultHash,
          role: "Administrator",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const insertRes = await db.collection("admins").insertOne(initialDoc);
        return {
          _id: insertRes.insertedId.toString(),
          ...initialDoc,
        };
      }
    } catch {
      // If collection error, proceed with memory fallback
    }
  }

  return { ...memoryAdminUser };
}

export async function updateAdminUser(updates: {
  username?: string;
  name?: string;
  password?: string;
}): Promise<AdminUser> {
  const now = new Date().toISOString();
  const mongoOnline = await isMongoAvailable();

  const updateFields: Partial<AdminUser> = {
    updatedAt: now,
  };

  if (updates.name && updates.name.trim()) {
    updateFields.name = updates.name.trim();
  }
  if (updates.username && updates.username.trim()) {
    updateFields.username = updates.username.trim();
  }
  if (updates.password && updates.password.trim()) {
    updateFields.passwordHash = await bcrypt.hash(updates.password.trim(), 10);
  }

  if (mongoOnline) {
    try {
      const db = await getDatabase();
      const existing = await getAdminUser();
      const res = await db.collection("admins").findOneAndUpdate(
        { role: "Administrator" },
        { $set: updateFields },
        { returnDocument: "after", upsert: true }
      );
      if (res) {
        return {
          _id: res._id?.toString() || existing._id,
          username: res.username || updateFields.username || existing.username,
          name: res.name || updateFields.name || existing.name,
          role: "Administrator",
          passwordHash: res.passwordHash || updateFields.passwordHash || existing.passwordHash,
          updatedAt: now,
        };
      }
    } catch {
      // Fall through to memory store update
    }
  }

  memoryAdminUser = {
    ...memoryAdminUser,
    ...updateFields,
  };

  return { ...memoryAdminUser };
}

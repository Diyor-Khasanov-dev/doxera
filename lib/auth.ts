import bcrypt from "bcryptjs";
import { findLLCByUsername } from "./llcStore";

export const DEMO_USER = {
  username: "admin",
  password: "admin123!",
  name: "Admin User",
  role: "Administrator",
};

export const AUTH_COOKIE_NAME = "doxera_auth_token";
export const SESSION_SECRET = process.env.SESSION_SECRET || "vercel_minimalism_secret_token_key_2025";

export interface SessionPayload {
  username: string;
  role: "admin" | "llc";
  llcId?: string;
  name?: string;
  companyName?: string;
}

// Token format: Base64Url(username:role:llcId:timestamp:signature)
export async function createSessionToken(
  username: string,
  role: "admin" | "llc" = "admin",
  llcId: string = ""
): Promise<string> {
  const timestamp = Date.now();
  const rawPayload = `${username}:${role}:${llcId}:${timestamp}`;
  const signature = await generateSignature(rawPayload);
  return Buffer.from(`${rawPayload}:${signature}`).toString("base64url");
}

export async function parseAndVerifySessionToken(
  token: string | undefined | null
): Promise<{ isValid: boolean; payload?: SessionPayload }> {
  if (!token) return { isValid: false };
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");

    // Backward compatibility with legacy 3-part token (username:timestamp:signature)
    if (parts.length === 3) {
      const [username, timestampStr, signature] = parts;
      const expected = await generateSignature(`${username}:${timestampStr}`);
      if (signature !== expected) return { isValid: false };

      const timestamp = parseInt(timestampStr, 10);
      if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) return { isValid: false };

      if (username === DEMO_USER.username) {
        return {
          isValid: true,
          payload: {
            username: DEMO_USER.username,
            role: "admin",
            name: DEMO_USER.name,
          },
        };
      }
      return { isValid: false };
    }

    // New format: username:role:llcId:timestamp:signature (5 parts)
    if (parts.length === 5) {
      const [username, role, llcId, timestampStr, signature] = parts;
      const expected = await generateSignature(`${username}:${role}:${llcId}:${timestampStr}`);
      if (signature !== expected) return { isValid: false };

      const timestamp = parseInt(timestampStr, 10);
      if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) return { isValid: false };

      if (role === "admin") {
        return {
          isValid: true,
          payload: {
            username,
            role: "admin",
            name: DEMO_USER.name,
          },
        };
      } else if (role === "llc") {
        return {
          isValid: true,
          payload: {
            username,
            role: "llc",
            llcId,
          },
        };
      }
    }

    return { isValid: false };
  } catch {
    return { isValid: false };
  }
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const result = await parseAndVerifySessionToken(token);
  return result.isValid;
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  // If the hash is an existing plain string during test or bcrypt hash
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    return bcrypt.compare(plainText, hash);
  }
  return plainText === hash;
}

async function generateSignature(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function authenticateCredentials(
  usernameInput: string,
  passwordInput: string
): Promise<{
  success: boolean;
  role?: "admin" | "llc";
  user?: {
    username: string;
    name: string;
    role: string;
    llcId?: string;
    companyName?: string;
  };
  error?: string;
}> {
  const username = usernameInput.trim();
  const password = passwordInput;

  // 1. Check Admin Credentials
  const adminUsername = process.env.ADMIN_USERNAME || DEMO_USER.username;
  const adminPassword = process.env.ADMIN_PASSWORD || DEMO_USER.password;

  if (username === adminUsername && password === adminPassword) {
    return {
      success: true,
      role: "admin",
      user: {
        username: adminUsername,
        name: DEMO_USER.name,
        role: "Administrator",
      },
    };
  }

  // 2. Check LLC Credentials in Database
  const llc = await findLLCByUsername(username);
  if (llc) {
    if (llc.status === "suspended") {
      return {
        success: false,
        error: "This LLC account has been suspended. Please contact administrative support.",
      };
    }

    const isMatch = await verifyPassword(password, llc.passwordHash);
    if (isMatch) {
      return {
        success: true,
        role: "llc",
        user: {
          username: llc.username,
          name: llc.companyName,
          role: "LLC Representative",
          llcId: llc.llcId,
          companyName: llc.companyName,
        },
      };
    }
  }

  return {
    success: false,
    error: "Invalid username or password. Please try again.",
  };
}

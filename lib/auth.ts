export const DEMO_USER = {
  username: "admin",
  password: "admin123!",
  name: "Admin User",
  role: "Administrator",
};

export const AUTH_COOKIE_NAME = "doxera_auth_token";
export const SESSION_SECRET = "vercel_minimalism_secret_token_key_2025";

// Simple stateless token format: Base64(username:timestamp:signature)
export async function createSessionToken(username: string): Promise<string> {
  const timestamp = Date.now();
  const rawPayload = `${username}:${timestamp}`;
  const signature = await generateSignature(rawPayload);
  return Buffer.from(`${rawPayload}:${signature}`).toString("base64url");
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;
    const [username, timestampStr, signature] = parts;
    const expectedSignature = await generateSignature(`${username}:${timestampStr}`);
    if (signature !== expectedSignature) return false;

    // Token expires after 7 days
    const timestamp = parseInt(timestampStr, 10);
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) return false;

    return username === DEMO_USER.username;
  } catch {
    return false;
  }
}

async function generateSignature(data: string): Promise<string> {
  // Use Web Crypto API which is natively available in Next.js Edge and Node runtimes
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

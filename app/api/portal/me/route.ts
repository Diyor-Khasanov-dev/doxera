import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  parseAndVerifySessionToken,
  hashPassword,
  createSessionToken,
} from "@/lib/auth";
import { findLLCById, findLLCByUsername, updateLLC } from "@/lib/llcStore";
import { LLCItem } from "@/lib/models/llc";

// GET /api/portal/me - Details of currently logged-in LLC company
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || !payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If admin is browsing the portal endpoint, allow viewing default or preview
  let llc: LLCItem | null = null;
  if (payload.role === "llc") {
    if (payload.llcId) {
      llc = await findLLCById(payload.llcId);
    }
    if (!llc) {
      llc = await findLLCByUsername(payload.username);
    }
  } else {
    // Admin viewing portal preview
    llc = (await findLLCById("LLC-8801")) || (await findLLCByUsername("apexdynamics"));
  }

  if (!llc) {
    return NextResponse.json({ error: "Company profile not found." }, { status: 404 });
  }

  const sanitized = { ...llc };
  delete (sanitized as { passwordHash?: string }).passwordHash;
  return NextResponse.json({
    success: true,
    data: sanitized,
    role: payload.role,
  });
}

// PUT /api/portal/me - LLC can change its name, login and password and CANNOT do anything else
export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || !payload || payload.role !== "llc") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let llc: LLCItem | null = null;
  if (payload.llcId) {
    llc = await findLLCById(payload.llcId);
  }
  if (!llc) {
    llc = await findLLCByUsername(payload.username);
  }

  if (!llc) {
    return NextResponse.json({ error: "Company profile not found." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updates: Partial<LLCItem> = {};

    // 1. Strict Company Name update
    if (typeof body.companyName === "string") {
      const trimmedName = body.companyName.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { error: "Company name cannot be empty." },
          { status: 400 }
        );
      }
      updates.companyName = trimmedName;
    }

    // 2. Strict Login (username) update
    if (typeof body.username === "string") {
      const trimmedUsername = body.username.trim().toLowerCase();
      if (!trimmedUsername) {
        return NextResponse.json(
          { error: "Login username cannot be empty." },
          { status: 400 }
        );
      }
      if (trimmedUsername.length < 3) {
        return NextResponse.json(
          { error: "Login username must be at least 3 characters." },
          { status: 400 }
        );
      }

      // If username has changed, ensure it's not taken by another LLC
      if (trimmedUsername !== llc.username.toLowerCase()) {
        const existing = await findLLCByUsername(trimmedUsername);
        if (
          existing &&
          existing.llcId !== llc.llcId &&
          (existing._id ? existing._id !== llc._id : true)
        ) {
          return NextResponse.json(
            { error: "This login username is already taken by another entity." },
            { status: 409 }
          );
        }
        updates.username = trimmedUsername;
      }
    }

    // 3. Strict Password update (optional in PUT, but if provided must be >= 6 chars)
    if (body.password !== undefined && body.password !== null && body.password !== "") {
      if (typeof body.password !== "string" || body.password.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      updates.passwordHash = await hashPassword(body.password);
    }

    // Strictly ensure no other fields can be updated by LLC.
    // Notice: body.email, body.role, body.plan, body.status, body.ein, body.state, etc. are NOT accepted!

    // Audit log
    const auditLogs = [
      ...(llc.analytics?.auditLogs || []),
      {
        action: "LLC Credentials Updated by Member",
        timestamp: new Date().toISOString(),
        detail: "Name, login, or password updated from self-service portal settings",
      },
    ];

    updates.analytics = {
      ...llc.analytics,
      auditLogs,
    };

    const targetId = llc._id || llc.llcId;
    const updated = await updateLLC(targetId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
    }

    const sanitized = { ...updated };
    delete (sanitized as { passwordHash?: string }).passwordHash;

    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      data: sanitized,
    });

    // Re-issue session token so the session reflects the new username seamlessly
    const activeUsername = updated.username || llc.username;
    const activeLLCId = updated.llcId || llc.llcId;
    const newToken = await createSessionToken(activeUsername, "llc", activeLLCId);

    response.cookies.set(AUTH_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

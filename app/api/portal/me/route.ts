import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken, hashPassword } from "@/lib/auth";
import { findLLCById, findLLCByUsername, updateLLC } from "@/lib/llcStore";

// GET /api/portal/me - Details of currently logged-in LLC company
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || !payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If admin is browsing the portal endpoint, allow viewing default or preview
  let llc = null;
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

// PUT /api/portal/me - LLC changing their own password or email
export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || !payload || payload.role !== "llc") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let llc = null;
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
    const updates: Record<string, unknown> = {};

    if (body.email) {
      updates.email = body.email.trim().toLowerCase();
    }

    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      updates.passwordHash = await hashPassword(body.password);
    }

    // Add audit log entry
    const auditLogs = [
      ...(llc.analytics?.auditLogs || []),
      {
        action: "LLC Credentials Updated by Member",
        timestamp: new Date().toISOString(),
        detail: "Password/profile updated from self-service portal",
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
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      data: sanitized,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken, hashPassword } from "@/lib/auth";
import { findLLCById, updateLLC, deleteLLC, findLLCByUsername } from "@/lib/llcStore";

// GET /api/llcs/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const llc = await findLLCById(id);

  if (!llc) {
    return NextResponse.json({ error: "LLC not found" }, { status: 404 });
  }

  // Non-admins can only view their own LLC
  if (payload?.role === "llc" && payload.llcId !== llc.llcId && payload.username !== llc.username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sanitized = { ...llc };
  delete (sanitized as { passwordHash?: string }).passwordHash;
  return NextResponse.json({ success: true, data: sanitized });
}

// PUT /api/llcs/[id] - Update LLC details or reset password
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || payload?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findLLCById(id);
  if (!existing) {
    return NextResponse.json({ error: "LLC not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.companyName && body.companyName.trim()) {
      updates.companyName = body.companyName.trim();
    }
    if (body.email && body.email.trim()) updates.email = body.email.trim().toLowerCase();
    if (body.state && body.state.trim()) updates.state = body.state.trim();
    if (body.plan) updates.plan = body.plan;
    if (body.status && (body.status === "active" || body.status === "pending" || body.status === "suspended")) {
      updates.status = body.status;
    }
    if (body.ein && body.ein.trim()) updates.ein = body.ein.trim();
    if (body.formationDate) updates.formationDate = body.formationDate;
    if (body.revenue !== undefined && body.revenue !== "") updates.revenue = Number(body.revenue);
    if (body.documentsCount !== undefined && body.documentsCount !== "") updates.documentsCount = Number(body.documentsCount);
    if (body.notes !== undefined) updates.notes = body.notes;

    // Check if updating username
    if (body.username && body.username.trim() && body.username.trim().toLowerCase() !== existing.username.toLowerCase()) {
      const conflict = await findLLCByUsername(body.username);
      if (conflict && conflict.llcId !== existing.llcId && conflict._id !== existing._id) {
        return NextResponse.json(
          { error: "Username is already taken by another entity." },
          { status: 409 }
        );
      }
      updates.username = body.username.trim().toLowerCase();
    }

    // Check if updating password
    if (body.password && body.password.trim()) {
      if (body.password.trim().length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      updates.passwordHash = await hashPassword(body.password.trim());
    }

    // Append audit log
    const updatedAuditLogs = [
      ...(existing.analytics?.auditLogs || []),
      {
        action: "Profile / Credentials Updated",
        timestamp: new Date().toISOString(),
        detail: `Updated by administrator (${payload.username})`,
      },
    ];

    updates.analytics = {
      ...existing.analytics,
      auditLogs: updatedAuditLogs,
    };

    const targetId = existing._id || existing.llcId;
    const updated = await updateLLC(targetId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update LLC" }, { status: 500 });
    }

    const sanitized = { ...updated };
    delete (sanitized as { passwordHash?: string }).passwordHash;
    return NextResponse.json({
      success: true,
      message: "LLC updated successfully",
      data: sanitized,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update LLC";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/llcs/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || payload?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findLLCById(id);
  if (!existing) {
    return NextResponse.json({ error: "LLC not found" }, { status: 404 });
  }

  const targetId = existing._id || existing.llcId;
  const deleted = await deleteLLC(targetId);
  if (!deleted) {
    return NextResponse.json({ error: "Failed to delete LLC" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `LLC ${existing.companyName} deleted successfully.`,
  });
}

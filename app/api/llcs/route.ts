import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken, hashPassword } from "@/lib/auth";
import { getAllLLCs, createLLC, findLLCByUsername } from "@/lib/llcStore";
import { LLCItem } from "@/lib/models/llc";

// GET /api/llcs - List all LLCs with filtering and search (Admin only)
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || payload?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const state = searchParams.get("state") || undefined;
  const plan = searchParams.get("plan") || undefined;

  const llcs = await getAllLLCs({ search, status, state, plan });

  // Exclude password hashes from response
  const sanitized = llcs.map((item) => {
    const copy = { ...item };
    delete (copy as { passwordHash?: string }).passwordHash;
    return copy;
  });

  return NextResponse.json({
    success: true,
    data: sanitized,
    total: sanitized.length,
  });
}

// POST /api/llcs - Create a new LLC with login credentials
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || payload?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      companyName,
      username,
      password,
      email,
      state,
      plan = "Starter",
      status = "active",
      ein,
      revenue = 0,
      documentsCount = 1,
      notes = "",
    } = body;

    // Validation
    if (!companyName || !username || !password) {
      return NextResponse.json(
        { error: "Company name, login username, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Check duplicate username
    const existing = await findLLCByUsername(username);
    if (existing) {
      return NextResponse.json(
        { error: "An LLC with this username already exists. Please choose a different username." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const llcId = `LLC-${randomCode}`;

    const finalEmail = (email && email.trim()) ? email.trim().toLowerCase() : `${username.trim().toLowerCase()}@portal.local`;
    const finalState = (state && state.trim()) ? state.trim() : "Delaware";

    const newLLCPayload: Omit<LLCItem, "_id" | "createdAt" | "updatedAt"> = {
      companyName: companyName.trim(),
      llcId,
      username: username.trim().toLowerCase(),
      passwordHash,
      email: finalEmail,
      state: finalState,
      formationDate: body.formationDate || new Date().toISOString().split("T")[0],
      ein: ein ? ein.trim() : `${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000000 + Math.random() * 8999999)}`,
      plan,
      status: (status === "active" || status === "pending" || status === "suspended") ? status : "active",
      revenue: Number(revenue) || 0,
      documentsCount: Number(documentsCount) || 1,
      notes: notes || "",
      analytics: {
        monthlyRevenue: [
          Math.round(revenue * 0.6),
          Math.round(revenue * 0.7),
          Math.round(revenue * 0.8),
          Math.round(revenue * 0.85),
          Math.round(revenue * 0.95),
          revenue,
        ],
        activeFilings: status === "active" ? 2 : 1,
        complianceScore: status === "active" ? 95 : 75,
        loginCount: 0,
        auditLogs: [
          {
            action: "LLC Account Created",
            timestamp: new Date().toISOString(),
            detail: `Created by administrator (${payload.username})`,
          },
        ],
      },
    };

    const created = await createLLC(newLLCPayload);
    const sanitized = { ...created };
    delete (sanitized as { passwordHash?: string }).passwordHash;

    return NextResponse.json(
      {
        success: true,
        message: "LLC created successfully",
        data: sanitized,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create LLC";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

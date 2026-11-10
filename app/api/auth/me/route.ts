import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken } from "@/lib/auth";
import { findLLCById, findLLCByUsername } from "@/lib/llcStore";
import { getAdminUser } from "@/lib/adminStore";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const { isValid, payload } = await parseAndVerifySessionToken(token);
  if (!isValid || !payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (payload.role === "admin") {
    const admin = await getAdminUser();
    return NextResponse.json({
      authenticated: true,
      role: "admin",
      user: {
        username: admin.username || payload.username,
        name: admin.name || payload.name || "Admin User",
        role: "Administrator",
      },
    });
  }

  // LLC User
  let llc = null;
  if (payload.llcId) {
    llc = await findLLCById(payload.llcId);
  }
  if (!llc) {
    llc = await findLLCByUsername(payload.username);
  }

  return NextResponse.json({
    authenticated: true,
    role: "llc",
    user: {
      username: payload.username,
      name: llc?.companyName || payload.username,
      role: "LLC Representative",
      llcId: llc?.llcId || payload.llcId,
      companyName: llc?.companyName,
      status: llc?.status,
      plan: llc?.plan,
    },
  });
}

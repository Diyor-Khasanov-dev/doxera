import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  parseAndVerifySessionToken,
  createSessionToken,
} from "@/lib/auth";
import { getAdminUser, updateAdminUser } from "@/lib/adminStore";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const { isValid, payload } = await parseAndVerifySessionToken(token);
  if (!isValid || payload?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const admin = await getAdminUser();

  return NextResponse.json({
    success: true,
    user: {
      username: admin.username,
      name: admin.name,
      role: admin.role,
    },
  });
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    const { isValid, payload } = await parseAndVerifySessionToken(token);
    if (!isValid || payload?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, password } = body;

    const updates: { name?: string; username?: string; password?: string } = {};

    if (name !== undefined) {
      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Name cannot be empty." },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (username !== undefined) {
      if (!username || typeof username !== "string" || !username.trim()) {
        return NextResponse.json(
          { error: "Login username cannot be empty." },
          { status: 400 }
        );
      }
      if (username.trim().length < 3) {
        return NextResponse.json(
          { error: "Login username must be at least 3 characters." },
          { status: 400 }
        );
      }
      updates.username = username.trim();
    }

    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters." },
          { status: 400 }
        );
      }
      updates.password = password;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No changes provided." },
        { status: 400 }
      );
    }

    const updatedAdmin = await updateAdminUser(updates);

    // Create response with updated user information
    const response = NextResponse.json({
      success: true,
      message: "Admin settings updated successfully.",
      user: {
        username: updatedAdmin.username,
        name: updatedAdmin.name,
        role: updatedAdmin.role,
      },
    });

    // Refresh the authentication session cookie so the session stays active with updated username
    const newToken = await createSessionToken(updatedAdmin.username, "admin", "");
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, authenticateCredentials, createSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const authResult = await authenticateCredentials(username, password);

    if (!authResult.success || !authResult.user || !authResult.role) {
      return NextResponse.json(
        { error: authResult.error || "Invalid username or password. Please try again." },
        { status: 401 }
      );
    }

    const { role, user } = authResult;
    const token = await createSessionToken(user.username, role, user.llcId || "");

    const redirectTo = role === "admin" ? "/dashboard" : "/portal";

    const response = NextResponse.json({
      success: true,
      role,
      user,
      redirectTo,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

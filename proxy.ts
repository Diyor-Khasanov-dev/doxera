import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);
  const isAuthenticated = isValid && Boolean(payload);

  // If user accesses top-level /llc-management or /settings, redirect to /dashboard/llc-management or /dashboard/settings
  if (pathname === "/llc-management" || pathname.startsWith("/llc-management/")) {
    const targetUrl = new URL(pathname.replace(/^\/llc-management/, "/dashboard/llc-management"), request.url);
    targetUrl.search = request.nextUrl.search;
    return NextResponse.redirect(targetUrl);
  }

  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    const targetUrl = new URL(pathname.replace(/^\/settings/, "/dashboard/settings"), request.url);
    targetUrl.search = request.nextUrl.search;
    return NextResponse.redirect(targetUrl);
  }

  // If requesting dashboard route and not authenticated as admin
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // If logged in as an LLC user and trying to access admin dashboard, redirect to LLC portal
    if (payload?.role === "llc") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  // If requesting LLC portal route and not authenticated
  if (pathname.startsWith("/portal")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and trying to access /login or root /
  if (pathname === "/login" || pathname === "/") {
    if (isAuthenticated) {
      if (payload?.role === "llc") {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (they manage their own auth responses)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

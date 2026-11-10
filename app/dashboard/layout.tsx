import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken } from "@/lib/auth";
import { getAdminUser } from "@/lib/adminStore";
import DashboardLayoutClient from "./DashboardLayoutClient";

async function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || payload?.role !== "admin") {
    redirect("/login");
  }

  const admin = await getAdminUser();

  return (
    <DashboardLayoutClient
      user={{
        username: admin.username || payload.username,
        name: admin.name || payload.name || "Admin User",
        role: admin.role || "Administrator",
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
          Loading...
        </div>
      }
    >
      <ProtectedDashboardLayout>{children}</ProtectedDashboardLayout>
    </Suspense>
  );
}

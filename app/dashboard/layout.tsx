import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, DEMO_USER, verifySessionToken } from "@/lib/auth";
import DashboardLayoutClient from "./DashboardLayoutClient";

async function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifySessionToken(token);

  if (!isAuthenticated) {
    redirect("/login");
  }

  return (
    <DashboardLayoutClient
      user={{
        username: DEMO_USER.username,
        name: DEMO_USER.name,
        role: DEMO_USER.role,
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

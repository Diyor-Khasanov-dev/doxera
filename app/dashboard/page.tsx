import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, DEMO_USER, verifySessionToken } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard - Doxera",
  description: "Protected Vercel-style Admin Dashboard",
};

async function ProtectedDashboardContent() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifySessionToken(token);

  if (!isAuthenticated) {
    redirect("/login");
  }

  return (
    <DashboardClient
      user={{
        username: DEMO_USER.username,
        name: DEMO_USER.name,
        role: DEMO_USER.role,
      }}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
          Loading dashboard...
        </div>
      }
    >
      <ProtectedDashboardContent />
    </Suspense>
  );
}

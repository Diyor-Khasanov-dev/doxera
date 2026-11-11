import { Suspense, ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, parseAndVerifySessionToken } from "@/lib/auth";
import PortalLayoutClient from "./PortalLayoutClient";

async function ProtectedPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { isValid, payload } = await parseAndVerifySessionToken(token);

  if (!isValid || !payload || payload.role !== "llc") {
    redirect("/login");
  }

  return (
    <PortalLayoutClient user={payload}>
      {children}
    </PortalLayoutClient>
  );
}

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
          Loading portal layout...
        </div>
      }
    >
      <ProtectedPortalLayout>{children}</ProtectedPortalLayout>
    </Suspense>
  );
}

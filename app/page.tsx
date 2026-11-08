import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

async function HomeRedirect(): Promise<React.ReactNode> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifySessionToken(token);

  if (isAuthenticated) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }

  return null;
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeRedirect />
    </Suspense>
  );
}

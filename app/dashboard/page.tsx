import { Suspense } from "react";
import DashboardOverview from "./DashboardOverview";

export const metadata = {
  title: "Dashboard - Doxera",
  description: "Enterprise Executive Overview & LLC Analytics",
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center text-zinc-500 font-mono text-xs">
          Loading dashboard analytics...
        </div>
      }
    >
      <DashboardOverview />
    </Suspense>
  );
}

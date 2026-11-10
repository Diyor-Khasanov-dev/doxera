import { Suspense } from "react";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings - Doxera",
  description: "Manage administrative profile, login credentials, and account settings.",
};

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-zinc-500 font-mono text-xs">
          Loading settings...
        </div>
      }
    >
      <SettingsClient />
    </Suspense>
  );
}

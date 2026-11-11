"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Building2,
  ChevronRight,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { SessionPayload } from "@/lib/auth";

interface PortalLayoutClientProps {
  children: ReactNode;
  user: SessionPayload & { plan?: string };
}

const navItems = [
  {
    name: "Dashboard",
    href: "/portal",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Documents",
    href: "/portal/documents",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/portal/settings",
    icon: Settings,
  },
];

export default function PortalLayoutClient({
  children,
  user,
}: PortalLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const isLinkActive = (itemHref: string, exact?: boolean) => {
    if (exact || itemHref === "/portal") {
      return pathname === "/portal" || pathname === "/portal/dashboard";
    }
    return pathname.startsWith(itemHref);
  };

  return (
    <div className="min-h-screen bg-black text-[#ededed] flex flex-col md:flex-row font-sans selection:bg-white selection:text-black">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between border-b border-[#222222] bg-[#0a0a0c]/90 backdrop-blur-md px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <svg
            className="w-5 h-5 text-white fill-current"
            viewBox="0 0 75 65"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M37.5 0L75 65H0L37.5 0Z" />
          </svg>
          <span className="font-bold text-sm text-white tracking-tight">
            {user.companyName || user.username}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg border border-[#222222] text-zinc-400 hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-[#1e1e24] bg-[#09090b] flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col">
          <div className="h-16 border-b border-[#1e1e24] px-5 flex items-center gap-3">
            <svg
              className="w-5 h-5 text-white fill-current shrink-0"
              viewBox="0 0 75 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M37.5 0L75 65H0L37.5 0Z" />
            </svg>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white tracking-tight truncate">
                {user.companyName || user.username}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {user.plan || "Enterprise"}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono truncate">
                  {user.llcId}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3">
            <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              LLC Portal
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isLinkActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? "bg-white text-black shadow-sm font-semibold"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          active ? "text-black" : "text-zinc-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-black" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section: LLC Profile Details + Logout Button */}
        <div className="p-3 border-t border-[#1e1e24] bg-[#0c0c0e]/60 space-y-2">
          {/* Active Entity Info */}
          <div className="p-2.5 rounded-lg border border-[#1e1e24] bg-[#121216] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 text-zinc-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-white truncate">
                {user.username}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Entity</span>
              </div>
            </div>
          </div>

          {/* Bottom Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a30] bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-900 hover:border-zinc-700 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-black">
        {children}
      </div>
    </div>
  );
}

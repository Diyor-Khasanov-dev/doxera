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
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTheme } from "@/lib/theme/ThemeContext";

interface PortalLayoutClientProps {
  children: ReactNode;
  user: SessionPayload & { plan?: string };
}

export default function PortalLayoutClient({
  children,
  user,
}: PortalLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { t } = useLanguage();
  const { theme } = useTheme();

  const navItems = [
    {
      name: t.dashboard,
      href: "/portal",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: t.documents,
      href: "/portal/documents",
      icon: FileText,
    },
    {
      name: t.settings,
      href: "/portal/settings",
      icon: Settings,
    },
  ];

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
    <div
      className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors ${
        theme === "dark"
          ? "bg-black text-[#ededed] selection:bg-white selection:text-black"
          : "bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white"
      }`}
    >
      {/* Mobile Header Bar */}
      <div
        className={`md:hidden flex items-center justify-between border-b px-4 py-3 sticky top-0 z-40 backdrop-blur-md ${
          theme === "dark"
            ? "border-[#222222] bg-[#0a0a0c]/90 text-white"
            : "border-slate-200 bg-white/90 text-slate-900 shadow-xs"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <svg
            className={`w-5 h-5 fill-current ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            viewBox="0 0 75 65"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M37.5 0L75 65H0L37.5 0Z" />
          </svg>
          <span className="font-bold text-sm tracking-tight truncate max-w-[140px]">
            {user.companyName || user.username}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-1.5 rounded-lg border ${
              theme === "dark"
                ? "border-[#222222] text-zinc-400 hover:text-white"
                : "border-slate-300 text-slate-600 hover:text-slate-900"
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          theme === "dark"
            ? "border-[#1e1e24] bg-[#09090b] text-[#ededed]"
            : "border-slate-200 bg-white text-slate-900 shadow-xs"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col">
          <div
            className={`h-16 border-b px-5 flex items-center justify-between ${
              theme === "dark" ? "border-[#1e1e24]" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <svg
                className={`w-5 h-5 fill-current shrink-0 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                viewBox="0 0 75 65"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M37.5 0L75 65H0L37.5 0Z" />
              </svg>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold tracking-tight truncate">
                  {user.companyName || user.username}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${
                      theme === "dark"
                        ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {user.plan || "Enterprise"}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono truncate">
                    {user.llcId}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls Bar: Theme & Language */}
          <div
            className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 ${
              theme === "dark" ? "border-[#1e1e24] bg-[#0c0c0e]/50" : "border-slate-100 bg-slate-50/80"
            }`}
          >
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              {t.settings}
            </span>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3">
            <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              {t.portal}
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
                        ? theme === "dark"
                          ? "bg-white text-black shadow-sm font-semibold"
                          : "bg-slate-900 text-white shadow-xs font-semibold"
                        : theme === "dark"
                        ? "text-zinc-400 hover:text-white hover:bg-zinc-900/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          active
                            ? theme === "dark"
                              ? "text-black"
                              : "text-white"
                            : "text-zinc-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {active && (
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${theme === "dark" ? "text-black" : "text-white"}`}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section: LLC Profile Details + Logout Button */}
        <div
          className={`p-3 border-t space-y-2 ${
            theme === "dark"
              ? "border-[#1e1e24] bg-[#0c0c0e]/60"
              : "border-slate-200 bg-slate-50/70"
          }`}
        >
          {/* Active Entity Info */}
          <div
            className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
              theme === "dark"
                ? "border-[#1e1e24] bg-[#121216]"
                : "border-slate-200 bg-white shadow-xs"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                theme === "dark"
                  ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                  : "bg-slate-100 border-slate-300 text-slate-700"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium truncate">
                {user.username}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t.activeEntity}</span>
              </div>
            </div>
          </div>

          {/* Bottom Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
              theme === "dark"
                ? "border-[#2a2a30] bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-900 hover:border-zinc-700"
                : "border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-xs"
            }`}
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span>{isLoggingOut ? t.loggingOut : t.logout}</span>
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
      <div
        className={`flex-1 min-w-0 flex flex-col transition-colors ${
          theme === "dark" ? "bg-black text-[#ededed]" : "bg-slate-50 text-slate-900"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

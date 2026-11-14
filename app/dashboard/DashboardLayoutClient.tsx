"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Settings as SettingsIcon,
  LogOut,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTheme } from "@/lib/theme/ThemeContext";

interface UserProfile {
  username: string;
  name: string;
  role: string;
}

export default function DashboardLayoutClient({
  user,
  children,
}: {
  user: UserProfile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { t } = useLanguage();
  const { theme } = useTheme();

  const navItems = [
    {
      name: t.dashboard,
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: t.llcManagement,
      href: "/dashboard/llc-management",
      icon: Building2,
    },
    {
      name: t.settings,
      href: "/dashboard/settings",
      icon: SettingsIcon,
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

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors ${
        theme === "dark"
          ? "bg-black text-[#ededed] selection:bg-white selection:text-black"
          : "bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white"
      }`}
    >
      {/* Mobile Top Header */}
      <div
        className={`md:hidden flex items-center justify-between px-4 py-3 border-b ${
          theme === "dark"
            ? "border-[#222222] bg-[#0a0a0a] text-white"
            : "border-slate-200 bg-white text-slate-900 shadow-xs"
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
          <span className="font-semibold text-sm tracking-tight">Doxera</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-1.5 rounded-lg border ${
              theme === "dark"
                ? "border-[#333333] text-zinc-400 hover:text-white"
                : "border-slate-300 text-slate-600 hover:text-slate-900"
            }`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 border-r flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          theme === "dark"
            ? "bg-[#0a0a0a] border-[#222222] text-[#ededed]"
            : "bg-white border-slate-200 text-slate-900 shadow-xs"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col flex-1">
          {/* Brand header */}
          <div
            className={`px-6 py-5 border-b flex items-center justify-between ${
              theme === "dark" ? "border-[#222222]" : "border-slate-200"
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
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight">Doxera</span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded border ${
                    theme === "dark"
                      ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  {t.panel}
                </span>
              </div>
            </div>
            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-zinc-400 hover:text-white"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation links */}
          <nav aria-label="Sidebar Navigation" className="p-4 space-y-1.5 flex-1">
            <div className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? theme === "dark"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "bg-slate-900 text-white font-semibold shadow-xs"
                      : theme === "dark"
                      ? "text-zinc-400 hover:text-white hover:bg-zinc-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? theme === "dark"
                          ? "text-black"
                          : "text-white"
                        : "text-zinc-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Log out in sidebar footer */}
        <div
          className={`p-4 border-t ${
            theme === "dark" ? "border-[#222222] bg-[#0c0c0e]" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`h-8 w-8 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 ${
                theme === "dark"
                  ? "bg-zinc-900 border-zinc-700 text-white"
                  : "bg-white border-slate-300 text-slate-800 shadow-xs"
              }`}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate">{user.username}</span>
              <span className="text-[11px] text-zinc-500 truncate">{user.role}</span>
            </div>
          </div>

          <button
            id="sidebar-logout-button"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer disabled:opacity-50 ${
              theme === "dark"
                ? "border-[#333333] hover:border-zinc-500 hover:bg-zinc-900 text-zinc-300 hover:text-white"
                : "border-slate-300 bg-white hover:bg-slate-100 hover:border-slate-400 text-slate-700 hover:text-slate-900 shadow-xs"
            }`}
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>{isLoggingOut ? t.loggingOut : t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

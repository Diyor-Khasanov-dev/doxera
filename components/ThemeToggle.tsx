"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? t.themeLight : t.themeDark}
      className={`relative inline-flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
        theme === "dark"
          ? "border-[#27272a] bg-[#141418] text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
          : "border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-400 shadow-xs"
      } ${className}`}
      aria-label={t.themeToggle}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}

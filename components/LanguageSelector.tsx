"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Language } from "@/lib/i18n/translations";
import { useTheme } from "@/lib/theme/ThemeContext";

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
          theme === "dark"
            ? "border-[#27272a] bg-[#141418] text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
            : "border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-400 shadow-xs"
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-zinc-400" />
        <span className="font-mono uppercase font-bold text-[11px]">{current.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-1.5 w-36 rounded-xl border shadow-xl z-50 py-1 overflow-hidden transition-all ${
            theme === "dark"
              ? "border-[#27272a] bg-[#121216] text-zinc-200"
              : "border-slate-200 bg-white text-slate-800 shadow-lg"
          }`}
        >
          {LANGUAGES.map((item) => {
            const isSelected = item.code === lang;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLang(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                  theme === "dark"
                    ? isSelected
                      ? "bg-zinc-800 text-white font-semibold"
                      : "hover:bg-zinc-800/60 text-zinc-300 hover:text-white"
                    : isSelected
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.flag}</span>
                  <span>{item.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

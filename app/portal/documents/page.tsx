"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Download,
  Search,
  FileCheck,
  Loader2,
} from "lucide-react";
import { LLCItem } from "@/lib/models/llc";

export default function PortalDocumentsPage() {
  const router = useRouter();
  const [llc, setLlc] = useState<LLCItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadPortalData() {
      try {
        const res = await fetch("/api/portal/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const body = await res.json();
        if (body.success && body.data) {
          setLlc(body.data);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }
    loadPortalData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-white mb-3" />
        <p className="text-xs font-mono">Loading corporate documents...</p>
      </div>
    );
  }

  const documents = [
    {
      id: "doc-1",
      title: "Articles of Organization",
      category: "Formation",
      description: "Original state-stamped certificate of organization filing",
      date: llc?.formationDate || "2023-04-12",
      size: "1.4 MB",
      format: "PDF",
      badge: "State Certified",
      badgeColor: "emerald",
    },
    {
      id: "doc-2",
      title: "IRS EIN Confirmation Letter (CP-575)",
      category: "Tax ID",
      description: "Official federal employer identification number notice",
      date: llc?.formationDate || "2023-04-14",
      size: "420 KB",
      format: "PDF",
      badge: "Federal",
      badgeColor: "blue",
    },
    {
      id: "doc-3",
      title: "Operating Agreement & Company By-Laws",
      category: "Governance",
      description: "Executed member ownership and governance protocol",
      date: "2023-05-01",
      size: "2.1 MB",
      format: "PDF",
      badge: "Executed",
      badgeColor: "purple",
    },
    {
      id: "doc-4",
      title: "Certificate of Good Standing",
      category: "Compliance",
      description: "State department verification of active proxy standing",
      date: "2024-05-10",
      size: "860 KB",
      format: "PDF",
      badge: "Active Verification",
      badgeColor: "teal",
    },
    {
      id: "doc-5",
      title: "Annual Franchise Tax & Report Filing Receipt",
      category: "Tax Filing",
      description: "State division receipt for annual maintenance compliance",
      date: "2025-01-15",
      size: "340 KB",
      format: "PDF",
      badge: "Filing Receipt",
      badgeColor: "amber",
    },
  ];

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Top Header displaying the page name: Documents */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#222222]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Documents
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Corporate archive and official filings repository for <span className="text-white font-medium">{llc?.companyName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-lg border border-[#26262b] bg-[#0f0f12] text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-500 w-56 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Document Vault List */}
      <div className="rounded-xl border border-[#222222] bg-[#0c0c0e] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1e1e24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Entity Document Vault</h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            Encrypted Storage
          </span>
        </div>

        <div className="divide-y divide-[#1e1e24]">
          {filteredDocs.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No corporate documents found matching your search term.
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#111115] transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-zinc-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">
                        {doc.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {doc.badge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {doc.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-500 font-mono">
                      <span>Date: {doc.date}</span>
                      <span>&bull;</span>
                      <span>Size: {doc.size}</span>
                      <span>&bull;</span>
                      <span>Format: {doc.format}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Downloading ${doc.title} (${doc.format})`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2c2c34] bg-[#16161a] hover:bg-zinc-800 hover:text-white text-xs text-zinc-300 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

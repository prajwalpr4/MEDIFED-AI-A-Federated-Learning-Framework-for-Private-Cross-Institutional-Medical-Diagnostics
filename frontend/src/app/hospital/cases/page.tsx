"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import casesStore from "@/lib/cases-store";
import { DiagnosticCase } from "@/lib/types";
import { fetchHospitalCases } from "@/lib/supabase-service";
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Calendar,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

export default function HospitalCasesPage() {
  const { hospital } = useAuth();
  const [cases, setCases] = useState<DiagnosticCase[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<"ALL" | "NORMAL" | "PNEUMONIA">("ALL");
  const [loading, setLoading] = useState(true);

  const loadCases = async () => {
    setLoading(true);
    try {
      const live = await fetchHospitalCases(hospital?.id);
      if (live !== undefined && live !== null) {
        setCases(live);
      } else {
        setCases(casesStore.getCases(hospital?.id));
      }
    } catch {
      setCases(casesStore.getCases(hospital?.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [hospital?.id]);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.case_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      filterClass === "ALL" ? true : c.predicted_class === filterClass;

    return matchesSearch && matchesFilter;
  });

  return (
    <AuthGuard requiredRole="hospital_user">
      <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                {hospital?.code || "HOSPITAL"}
              </span>
              <span className="text-xs text-slate-500">Multi-Tenant Isolated Case Registry</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#102A43] mt-1">
              Clinical Case Registry
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Secure patient archive for {hospital?.name}. Cross-institutional access is restricted via Row-Level Security.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={loadCases}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
              title="Refresh from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : "text-slate-500"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/hospital/analyze"
              className="px-4 py-2.5 rounded-xl bg-[#102A43] hover:bg-[#16324F] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-200" />
              <span>Analyze New Radiograph</span>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case code or findings..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* Classification Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setFilterClass("ALL")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-bold transition-all ${
                filterClass === "ALL"
                  ? "bg-white text-[#102A43] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({cases.length})
            </button>
            <button
              onClick={() => setFilterClass("PNEUMONIA")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-bold transition-all ${
                filterClass === "PNEUMONIA"
                  ? "bg-red-50 text-red-700 border border-red-200 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pneumonia ({cases.filter((c) => c.predicted_class === "PNEUMONIA").length})
            </button>
            <button
              onClick={() => setFilterClass("NORMAL")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-bold transition-all ${
                filterClass === "NORMAL"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Normal ({cases.filter((c) => c.predicted_class === "NORMAL").length})
            </button>
          </div>
        </div>

        {/* Case Cards Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-teal-600 animate-spin" />
            <span>Loading cases from {hospital?.name || "hospital"} isolated storage...</span>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No cases found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No diagnostic cases are recorded in this hospital repository yet. Upload a chest radiograph to perform ResNet-50 inference and save to this hospital.
            </p>
            <Link
              href="/hospital/analyze"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F766E] text-white text-xs font-semibold hover:bg-[#0d635c] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              <span>Analyze Radiograph</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCases.map((c) => {
              const isPneumonia = c.predicted_class === "PNEUMONIA";
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    {/* Top Row: Code & Diagnosis Tag */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#102A43]">
                        {c.case_code}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPneumonia
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {c.predicted_class}
                      </span>
                    </div>

                    {/* Dual Thumbnail Comparison Preview */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="aspect-square rounded-lg overflow-hidden bg-black border border-slate-200">
                          <img
                            src={c.original_image_url}
                            alt="Original Radiograph"
                            onError={(e) => {
                              if (c.gradcam_image_url && e.currentTarget.src !== c.gradcam_image_url) {
                                e.currentTarget.src = c.gradcam_image_url;
                              }
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block text-center">
                          Raw Radiograph
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="aspect-square rounded-lg overflow-hidden bg-black border border-slate-200">
                          {c.gradcam_image_url ? (
                            <img
                              src={c.gradcam_image_url}
                              alt="Grad-CAM Heatmap"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                              No Heatmap
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-teal-600 font-medium block text-center">
                          Grad-CAM Heatmap
                        </span>
                      </div>
                    </div>

                    {/* Metric Indicators */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Confidence</span>
                        <div className="font-bold text-slate-800">
                          {(c.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Inference Time</span>
                        <div className="font-mono text-slate-700 text-[11px]">
                          {c.inference_time_ms ? `${c.inference_time_ms}ms` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Clinical Note Snippet */}
                    {c.notes && (
                      <p className="text-xs text-slate-600 line-clamp-2 italic">
                        &ldquo;{c.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/hospital/cases/${c.id}/explain`}
                        className="px-2.5 py-1 rounded bg-[#102A43] text-teal-300 hover:bg-[#16324F] font-semibold text-[11px] transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        AI Lens
                      </Link>
                      <Link
                        href={`/hospital/cases/${c.id}/report`}
                        className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Report
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
    </AuthGuard>
  );
}

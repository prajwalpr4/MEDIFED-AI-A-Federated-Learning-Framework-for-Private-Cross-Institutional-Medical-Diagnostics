"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import casesStore from "@/lib/cases-store";
import { DiagnosticCase, RESEARCH_HOSPITALS } from "@/lib/types";
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
  RefreshCw,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

export default function AdminAllCasesPage() {
  const [cases, setCases] = useState<DiagnosticCase[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<string>("ALL");
  const [selectedOutcome, setSelectedOutcome] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const loadCases = async () => {
    setLoading(true);
    try {
      const live = await fetchHospitalCases(null);
      if (live && live.length > 0) {
        setCases(live);
      } else {
        setCases(casesStore.getCases());
      }
    } catch {
      setCases(casesStore.getCases());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const filtered = cases.filter((c) => {
    const matchesSearch =
      c.case_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.hospital_name && c.hospital_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesHospital =
      selectedHospital === "ALL" ? true : c.hospital_id === selectedHospital;

    const matchesOutcome =
      selectedOutcome === "ALL" ? true : c.predicted_class === selectedOutcome;

    return matchesSearch && matchesHospital && matchesOutcome;
  });

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                GLOBAL REGISTRY
              </span>
              <span className="text-xs text-slate-500">Cross-Institutional Aggregation</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#102A43] mt-1">
              All Inferences Across Platform
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Comprehensive registry of diagnostic inferences across Hospital A, Hospital B, and Hospital C.
            </p>
          </div>

          <button
            onClick={loadCases}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 self-start md:self-auto"
            title="Refresh from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : "text-slate-500"}`} />
            <span>Refresh All Silos</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case code, hospital, or finding..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Hospital Filter */}
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 outline-none bg-white"
            >
              <option value="ALL">All Hospitals (Cross-Institutional)</option>
              {RESEARCH_HOSPITALS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            {/* Outcome Filter */}
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 outline-none bg-white"
            >
              <option value="ALL">All Diagnoses</option>
              <option value="PNEUMONIA">Pneumonia Only</option>
              <option value="NORMAL">Normal Only</option>
            </select>
          </div>
        </div>

        {/* Global Cases Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case Code</th>
                  <th className="py-3 px-4">Scan</th>
                  <th className="py-3 px-4">Hospital Silo</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Inference Time</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 text-teal-600 animate-spin" />
                        <span>Querying cases across all hospital silos from Supabase...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No diagnostic cases found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        No cases have been uploaded to any hospital silo yet.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const isPneumonia = c.predicted_class === "PNEUMONIA";
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#102A43]">
                          {c.case_code}
                        </td>
                      <td className="py-3.5 px-4">
                        <img
                          src={c.original_image_url}
                          alt="Scan"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-black"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {c.hospital_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            isPneumonia
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {c.predicted_class}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {(c.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {c.inference_time_ms ? `${c.inference_time_ms}ms` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          href={`/hospital/cases/${c.id}/explain`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 text-[#0F766E] hover:bg-teal-100 font-semibold text-[11px]"
                        >
                          <Eye className="w-3 h-3" />
                          Lens
                        </Link>
                        <Link
                          href={`/hospital/cases/${c.id}/report`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-[11px]"
                        >
                          <FileText className="w-3 h-3" />
                          Report
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </AuthGuard>
  );
}

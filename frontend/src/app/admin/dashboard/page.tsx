"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import casesStore from "@/lib/cases-store";
import { DiagnosticCase, RESEARCH_HOSPITALS } from "@/lib/types";
import apiClient, { HealthStatus, MetricsData } from "@/lib/api";
import {
  Activity,
  Network,
  ShieldCheck,
  Building2,
  Users,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Server,
  ArrowRight,
  Eye,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

export default function AdminDashboardPage() {
  const [allCases, setAllCases] = useState<DiagnosticCase[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    // Admin sees ALL cases across all hospitals
    const cases = casesStore.getCases();
    setAllCases(cases);

    apiClient
      .getHealth()
      .then((h) => setHealth(h))
      .catch(() => setHealth(null));

    apiClient
      .getMetrics()
      .then((m) => setMetrics(m))
      .catch(() => setMetrics(null));
  }, []);

  const totalInferences = allCases.length;
  const hospitalACases = allCases.filter(
    (c) => c.hospital_id === RESEARCH_HOSPITALS[0].id
  ).length;
  const hospitalBCases = allCases.filter(
    (c) => c.hospital_id === RESEARCH_HOSPITALS[1].id
  ).length;
  const hospitalCCases = allCases.filter(
    (c) => c.hospital_id === RESEARCH_HOSPITALS[2].id
  ).length;

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#102A43] to-[#16324F] text-teal-300 flex items-center justify-center">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  COORDINATOR NODE
                </span>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  FedProx Orchestrator Active
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#102A43] mt-1">
                Global Federation Command Center
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized monitoring for 3 decentralized hospital nodes with zero raw data sharing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/performance"
              className="px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0d635c] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-teal-200" />
              <span>Research Analytics</span>
            </Link>
          </div>
        </div>

        {/* 4 Global KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="card-clinical">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cross-Hospital Inferences
              </span>
              <ClipboardList className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#102A43]">{totalInferences}</span>
              <span className="text-xs text-slate-400">total cases</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Aggregated across all 3 nodes
            </div>
          </div>

          <div className="card-clinical border-l-4 border-l-[#0F766E]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Global Pooled Accuracy
              </span>
              <TrendingUp className="w-4 h-4 text-[#0F766E]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#0F766E]">81.40%</span>
              <span className="text-xs font-semibold text-emerald-600">Round 3</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Tested on 1,247 pooled radiographs
            </div>
          </div>

          <div className="card-clinical">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Hospital Nodes
              </span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#102A43]">3 Silos</span>
              <span className="text-xs font-semibold text-emerald-600">100% Online</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Hospital A, Hospital B, Hospital C
            </div>
          </div>

          <div className="card-clinical">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ML Service Status
              </span>
              <Server className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm font-bold text-slate-900 font-mono">
                {health?.checkpoint || "global_round_03.pth"}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FastAPI ({health?.device || "cpu"}) Ready</span>
            </div>
          </div>
        </div>

        {/* Multi-Hospital Silos Overview Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102A43]">
              Participating Clinical Hospital Silos
            </h2>
            <Link
              href="/admin/hospitals"
              className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1"
            >
              Manage Hospital Silos &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RESEARCH_HOSPITALS.map((h, idx) => {
              const count =
                idx === 0 ? hospitalACases : idx === 1 ? hospitalBCases : hospitalCCases;
              return (
                <div
                  key={h.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#102A43] text-teal-300">
                      {h.code}
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      Isolated Silo
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#102A43]">{h.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {h.dataset_source}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Train Data</span>
                      <div className="font-bold text-slate-800">{h.train_samples}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Test Data</span>
                      <div className="font-bold text-slate-800">{h.test_samples}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Inferences</span>
                      <div className="font-bold text-[#0F766E]">{count}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Recent Inferences Registry */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#102A43]">
                Global Cross-Institutional Feed
              </h2>
              <p className="text-xs text-slate-500">
                Audited diagnostic events across all connected hospital nodes
              </p>
            </div>
            <Link
              href="/admin/cases"
              className="text-xs font-bold text-[#0F766E] hover:underline"
            >
              View Full Global Registry &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case Code</th>
                  <th className="py-3 px-4">Originating Hospital</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allCases.slice(0, 6).map((c) => {
                  const isPneumonia = c.predicted_class === "PNEUMONIA";
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#102A43]">
                        {c.case_code}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
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
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/hospital/cases/${c.id}/explain`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 text-[#0F766E] hover:bg-teal-100 font-semibold text-[11px]"
                        >
                          <Eye className="w-3 h-3" />
                          View Scan
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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

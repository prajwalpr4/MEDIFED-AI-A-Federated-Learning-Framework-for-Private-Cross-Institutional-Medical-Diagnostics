"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import casesStore from "@/lib/cases-store";
import { fetchHospitalCases } from "@/lib/supabase-service";
import { DiagnosticCase } from "@/lib/types";
import apiClient, { HealthStatus } from "@/lib/api";
import {
  Activity,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Clock,
  Eye,
  FileText,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

export default function HospitalDashboardPage() {
  const { user, hospital, role } = useAuth();
  const [cases, setCases] = useState<DiagnosticCase[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    if (!hospital?.id) return;
    let isMounted = true;

    // Strict Multi-Tenant Silo: Query only this specific hospital's database table
    fetchHospitalCases(hospital.id)
      .then((live) => {
        if (isMounted) {
          setCases(live || []);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch hospital cases from cloud:", err);
        if (isMounted) {
          setCases(casesStore.getCases(hospital.id));
        }
      });

    apiClient
      .getHealth()
      .then((h) => {
        if (isMounted) setHealth(h);
      })
      .catch(() => {
        if (isMounted) setHealth(null);
      });

    return () => {
      isMounted = false;
    };
  }, [hospital?.id]);

  const totalCases = cases.length;
  const pneumoniaCases = cases.filter((c) => c.predicted_class === "PNEUMONIA").length;
  const normalCases = cases.filter((c) => c.predicted_class === "NORMAL").length;
  const pneumoniaPct = totalCases > 0 ? ((pneumoniaCases / totalCases) * 100).toFixed(1) : "0";

  return (
    <AuthGuard requiredRole="hospital_user">
      <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hospital Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#102A43] text-teal-300">
                  {hospital?.code || "CLIENT_NODE"}
                </span>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Silo Connected
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#102A43] mt-1">
                {hospital?.name || "Private Hospital Workspace"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {hospital?.dataset_source || "Decentralized Clinical Cohort"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/hospital/analyze"
              className="px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0d635c] text-white text-xs font-bold transition-all shadow-md shadow-teal-900/10 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-200" />
              <span>New Radiograph Inference</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="card-clinical">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Silo Inferences
              </span>
              <ClipboardList className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#102A43]">{totalCases}</span>
              <span className="text-xs text-slate-400">cases logged</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Isolated in {hospital?.code || "Current Silo"}
            </div>
          </div>

          <div className="card-clinical border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pneumonia Positives
              </span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-600">{pneumoniaCases}</span>
              <span className="text-xs text-red-600 font-semibold">{pneumoniaPct}% rate</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Verified with Grad-CAM overlays
            </div>
          </div>

          <div className="card-clinical border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Normal Diagnoses
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">{normalCases}</span>
              <span className="text-xs text-emerald-600 font-semibold">
                {totalCases > 0 ? (100 - Number(pneumoniaPct)).toFixed(1) : 0}%
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Clear pulmonary markings
            </div>
          </div>

          <div className="card-clinical">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Model Checkpoint
              </span>
              <Activity className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm font-bold text-slate-900 font-mono">
                {health?.checkpoint || "global_round_03.pth"}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ResNet-50 ({health?.device || "cpu"}) Online</span>
            </div>
          </div>
        </div>

        {/* Recent Cases Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#102A43]">
                Recent Inferences in {hospital?.name}
              </h2>
              <p className="text-xs text-slate-500">
                Filtered strictly to this hospital node under Supabase Row-Level Security
              </p>
            </div>
            <Link
              href="/hospital/cases"
              className="text-xs text-[#0F766E] font-bold hover:underline flex items-center gap-1"
            >
              View All Registry Cases &rarr;
            </Link>
          </div>

          {cases.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No diagnostic cases found in this hospital silo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Case Code</th>
                    <th className="py-3 px-4">Scan</th>
                    <th className="py-3 px-4">Diagnosis</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Inference Time</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.slice(0, 5).map((c) => {
                    const isPneumonia = c.predicted_class === "PNEUMONIA";
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#102A43]">
                          {c.case_code}
                        </td>
                        <td className="py-3.5 px-4">
                          <img
                            src={c.original_image_url}
                            alt="Scan thumbnail"
                            onError={(e) => {
                              if (c.gradcam_image_url && e.currentTarget.src !== c.gradcam_image_url) {
                                e.currentTarget.src = c.gradcam_image_url;
                              }
                            }}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-black"
                          />
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
                          {new Date(c.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <Link
                            href={`/hospital/cases/${c.id}/explain`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 text-[#0F766E] hover:bg-teal-100 font-semibold text-[11px] transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            Lens
                          </Link>
                          <Link
                            href={`/hospital/cases/${c.id}/report`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-[11px] transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            Report
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
    </AuthGuard>
  );
}

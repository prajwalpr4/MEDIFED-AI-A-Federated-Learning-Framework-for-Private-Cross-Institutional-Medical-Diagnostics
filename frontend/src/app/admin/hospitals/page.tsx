"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { RESEARCH_HOSPITALS, DEMO_PROFILES } from "@/lib/types";
import {
  Building2,
  ShieldCheck,
  Database,
  Users,
  Lock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

export default function AdminHospitalsPage() {
  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                CLINICAL NODES
              </span>
              <span className="text-xs text-slate-500">Multi-Institutional Tenant Registry</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#102A43] mt-1">
              Participating Hospital Silos
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Strict multi-tenant isolation enforced via Supabase Row-Level Security and partitioned private storage buckets.
            </p>
          </div>
        </div>

        {/* Hospital Node Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RESEARCH_HOSPITALS.map((h) => {
            const clinicians = DEMO_PROFILES.filter(
              (p) => p.hospital_id === h.id
            );
            return (
              <div
                key={h.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#102A43] text-teal-300">
                      {h.code}
                    </span>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Isolated Silo
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#102A43]">{h.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{h.location}</p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {h.dataset_source}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">
                        Training Set
                      </span>
                      <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                        {h.train_samples}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">
                        Testing Set
                      </span>
                      <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                        {h.test_samples}
                      </div>
                    </div>
                  </div>

                  {/* Authorized Clinicians */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Authorized Node Clinicians
                    </span>
                    {clinicians.map((c) => (
                      <div
                        key={c.id}
                        className="text-xs flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100"
                      >
                        <span className="font-medium text-slate-800">{c.full_name}</span>
                        <span className="text-[10px] text-slate-400">{c.email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-600" />
                  <span>RLS Filter: <code>hospital_id = {h.id.slice(0, 8)}...</code></span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
    </AuthGuard>
  );
}

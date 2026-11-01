"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HeroLens } from "@/components/hero-lens";
import { ArchitectureFlow } from "@/components/architecture-flow";
import { ResearchGallery } from "@/components/research-gallery";
import { useAuth } from "@/lib/auth-context";
import {
  Activity,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  Building2,
  BarChart3,
  Network,
} from "lucide-react";

export default function HomePage() {
  const { user, role } = useAuth();
  const isHospital = user && role === "hospital_user";
  const isAdmin = user && role === "admin";

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white text-slate-900 pt-10 pb-16 lg:py-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Academic Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                <span className="font-bold text-teal-800">Federated Learning Research</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">Consortium for Federated Healthcare Intelligence</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Federated Medical Intelligence for{" "}
                <span className="text-[#0F766E]">
                  Private Cross-Institutional
                </span>{" "}
                Diagnostics
              </h1>

              {/* Value Proposition */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                A generalized federated learning framework enabling distributed hospital networks (Hospital A, Hospital B, and Hospital C) to collaboratively detect pulmonary pneumonia via PyTorch ResNet-50 without exposing raw patient radiographs.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                {!user ? (
                  <>
                    <Link
                      href="/auth/sign-in"
                      className="px-6 py-3.5 rounded-xl bg-[#102A43] hover:bg-[#16324F] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 group"
                    >
                      <Lock className="w-4 h-4 text-teal-300" />
                      <span>Sign In to Clinical Portal</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </>
                ) : isHospital ? (
                  <>
                    <Link
                      href="/hospital/analyze"
                      className="px-6 py-3.5 rounded-xl bg-[#102A43] hover:bg-[#16324F] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 group"
                    >
                      <Sparkles className="w-4 h-4 text-teal-300 group-hover:rotate-12 transition-transform" />
                      <span>Analyze Chest Radiograph</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/hospital/dashboard"
                      className="px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all border border-slate-300 shadow-sm flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4 text-slate-500" />
                      <span>Hospital Dashboard</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/admin/dashboard"
                      className="px-6 py-3.5 rounded-xl bg-[#102A43] hover:bg-[#16324F] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 group"
                    >
                      <BarChart3 className="w-4 h-4 text-teal-300" />
                      <span>Coordinator Command Center</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/admin/performance"
                      className="px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all border border-slate-300 shadow-sm flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4 text-slate-500" />
                      <span>Research Metrics</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Quick Stats Pill */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-200 text-xs">
                <div>
                  <div className="text-slate-500 font-medium">Pooled Test Acc</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">81.40%</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Global Recall</div>
                  <div className="text-xl font-extrabold text-[#0F766E] mt-0.5">80.20%</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Hospital Nodes</div>
                  <div className="text-xl font-extrabold text-[#102A43] mt-0.5">3 Silos</div>
                </div>
              </div>
            </div>

            {/* Right Hero: Live Interactive Lens Preview */}
            <div className="lg:col-span-6">
              <HeroLens />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Architectural Pillars Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
            Key Diagnostic & Privacy Capabilities
          </h2>
          <p className="text-sm text-slate-600">
            Engineered to overcome domain shift, clinical heterogeneity, and patient privacy barriers in medical AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-clinical">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#102A43] mb-1.5">
              Decentralized Privacy
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Patient radiographs never leave hospital grounds. FedProx aggregates gradient weights using proximal term &mu;=0.01 to safeguard against data leakage.
            </p>
          </div>

          <div className="card-clinical">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#102A43] mb-1.5">
              Grad-CAM Transparency
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No black-box predictions. Layer4 gradient hooks project exact anatomical attention maps so radiologists can inspect pulmonary consolidations directly.
            </p>
          </div>

          <div className="card-clinical">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#102A43] mb-1.5">
              Adaptive CLAHE Normalization
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              OpenCV CLAHE preprocessing normalizes varying tube voltages and acquisition hardware across different hospital radiograph machines before inference.
            </p>
          </div>

          <div className="card-clinical">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#102A43] mb-1.5">
              Multi-Tenant Isolation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Supabase Row-Level Security ensures Hospital A clinicians can never view Hospital B records, while providing the global coordinator cross-institutional metrics.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive System Pipeline */}
      <ArchitectureFlow />

      {/* Research Visualization Exhibits Gallery */}
      <ResearchGallery />

      {/* Institutional Nodes Section */}
      <section className="py-16 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              <span>PARTICIPATING RESEARCH COHORTS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
              Cross-Institutional Hospital Silos
            </h2>
            <p className="text-sm text-slate-600">
              Three geographically separated client cohorts united under the FedProx learning protocol.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  NODE 1
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#102A43]">
                Hospital A
              </h3>
              <p className="text-xs text-slate-600">
                Pediatric radiograph cohort aged 1–5 years with high baseline sensitivity.
              </p>
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 text-xs">
                <div>
                  <span className="text-slate-400">Training Scans:</span>
                  <div className="font-bold text-slate-800">3,892</div>
                </div>
                <div>
                  <span className="text-slate-400">Test Scans:</span>
                  <div className="font-bold text-slate-800">624</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  NODE 2
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#102A43]">
                Hospital B
              </h3>
              <p className="text-xs text-slate-600">
                Adult clinical radiograph cohort with varied radiographic acquisition settings.
              </p>
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 text-xs">
                <div>
                  <span className="text-slate-400">Training Scans:</span>
                  <div className="font-bold text-slate-800">332</div>
                </div>
                <div>
                  <span className="text-slate-400">Test Scans:</span>
                  <div className="font-bold text-slate-800">110</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  NODE 3
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#102A43]">
                Hospital C
              </h3>
              <p className="text-xs text-slate-600">
                Digital clinical cohort providing diverse validation across adult patient demographics.
              </p>
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 text-xs">
                <div>
                  <span className="text-slate-400">Training Scans:</span>
                  <div className="font-bold text-slate-800">902</div>
                </div>
                <div>
                  <span className="text-slate-400">Test Scans:</span>
                  <div className="font-bold text-slate-800">513</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 bg-slate-50 border-y border-slate-200 text-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Ready to test live chest radiograph inference?
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Sign in to your clinical hospital node to upload radiographs and experience real-time ResNet-50 classification with layer4 Grad-CAM synthesis.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5 pt-3">
            {!user ? (
              <Link
                href="/auth/sign-in"
                className="px-6 py-3 rounded-xl bg-[#102A43] hover:bg-[#16324F] text-white font-bold text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-teal-300" />
                <span>Sign In to Access Portal</span>
              </Link>
            ) : isHospital ? (
              <Link
                href="/hospital/analyze"
                className="px-6 py-3 rounded-xl bg-[#102A43] hover:bg-[#16324F] text-white font-bold text-sm transition-all shadow-sm"
              >
                Launch Radiograph Analyzer
              </Link>
            ) : (
              <Link
                href="/admin/dashboard"
                className="px-6 py-3 rounded-xl bg-[#102A43] hover:bg-[#16324F] text-white font-bold text-sm transition-all shadow-sm"
              >
                Admin Command Center
              </Link>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import casesStore from "@/lib/cases-store";
import { fetchHospitalCases } from "@/lib/supabase-service";
import { DiagnosticCase } from "@/lib/types";
import {
  Eye,
  Layers,
  ArrowLeft,
  Sparkles,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Info,
  Building2,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

export default function CaseExplainPage() {
  const params = useParams();
  const router = useRouter();
  const { hospital } = useAuth();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<DiagnosticCase | null>(null);
  const [blendOpacity, setBlendOpacity] = useState<number>(70);
  const [viewMode, setViewMode] = useState<"blend" | "side_by_side" | "raw">("blend");

  useEffect(() => {
    // 1. Check local cache
    const found = casesStore.getCaseById(caseId);
    if (found) {
      setCaseData(found);
    }

    // 2. Query cloud database for authoritative case record
    fetchHospitalCases(hospital?.id || null)
      .then((cases) => {
        const live = cases.find((c) => c.id === caseId || c.case_code === caseId);
        if (live) {
          setCaseData(live);
        }
      })
      .catch((err) => console.warn("Live case fetch notice:", err));
  }, [caseId, hospital?.id]);

  const isPneumonia = caseData?.predicted_class === "PNEUMONIA";

  return (
    <AuthGuard>
      {!caseData ? (
        <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
            <p className="text-sm text-slate-500">Loading diagnostic case data...</p>
            <Link
              href="/hospital/cases"
              className="text-xs text-[#0F766E] font-bold hover:underline"
            >
              &larr; Back to Case Registry
            </Link>
          </div>
          <Footer />
        </div>
      ) : (
        <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
          <Navbar />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/hospital/cases"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">
                  {caseData.case_code}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-[#0F766E] font-semibold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {caseData.hospital_name}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#102A43] mt-0.5">
                AI Diagnostic Lens — PyTorch Grad-CAM
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/hospital/cases/${caseData.id}/report`}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Formal Medical Report</span>
            </Link>
          </div>
        </div>

        {/* Diagnostic Outcome Strip */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Classification</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
                  isPneumonia
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {isPneumonia ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
                {caseData.predicted_class}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Confidence Score</span>
            <div className="text-lg font-black text-[#102A43] mt-0.5">
              {(caseData.confidence * 100).toFixed(2)}%
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Model Checkpoint</span>
            <div className="text-xs font-mono font-bold text-slate-800 mt-1">
              {caseData.model_checkpoint}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Inference Time</span>
            <div className="text-xs font-mono text-slate-700 mt-1">
              {caseData.inference_time_ms ? `${caseData.inference_time_ms} ms` : "—"}
            </div>
          </div>
        </div>

        {/* Main Explainability Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Visual Inspection */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0F766E]" />
                <h3 className="text-sm font-bold text-[#102A43]">
                  Interactive Radiological Spatial Overlay
                </h3>
              </div>

              {/* View Mode Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setViewMode("blend")}
                  className={`px-2.5 py-1 rounded transition-all ${
                    viewMode === "blend"
                      ? "bg-white text-[#102A43] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Overlay Blend
                </button>
                <button
                  onClick={() => setViewMode("side_by_side")}
                  className={`px-2.5 py-1 rounded transition-all ${
                    viewMode === "side_by_side"
                      ? "bg-white text-[#102A43] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setViewMode("raw")}
                  className={`px-2.5 py-1 rounded transition-all ${
                    viewMode === "raw"
                      ? "bg-white text-[#102A43] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Raw Scan
                </button>
              </div>
            </div>

            {/* Display Area based on View Mode */}
            {viewMode === "blend" && (
              <div className="space-y-4">
                <div className="relative w-full aspect-square max-w-[460px] mx-auto rounded-2xl overflow-hidden bg-black border border-slate-300 shadow-md">
                  <img
                    src={caseData.original_image_url}
                    alt="Original Chest Radiograph"
                    onError={(e) => {
                      if (caseData.gradcam_image_url && e.currentTarget.src !== caseData.gradcam_image_url) {
                        e.currentTarget.src = caseData.gradcam_image_url;
                      }
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {caseData.gradcam_image_url && (
                    <img
                      src={caseData.gradcam_image_url}
                      alt="Grad-CAM Layer4 Heatmap"
                      style={{ opacity: blendOpacity / 100 }}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none transition-opacity duration-150"
                    />
                  )}
                </div>

                {/* Opacity Slider */}
                <div className="max-w-[460px] mx-auto bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">Grad-CAM Heatmap Blend:</span>
                    <span className="text-[#0F766E] font-mono font-bold">
                      {blendOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={blendOpacity}
                    onChange={(e) => setBlendOpacity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>0% (Raw Radiograph)</span>
                    <span>100% (Pure Activation Heatmap)</span>
                  </div>
                </div>
              </div>
            )}

            {viewMode === "side_by_side" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="aspect-square rounded-xl overflow-hidden bg-black border border-slate-300">
                    <img
                      src={caseData.original_image_url}
                      alt="Raw Radiograph"
                      onError={(e) => {
                        if (caseData.gradcam_image_url && e.currentTarget.src !== caseData.gradcam_image_url) {
                          e.currentTarget.src = caseData.gradcam_image_url;
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 text-center block">
                    Original Radiograph
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="aspect-square rounded-xl overflow-hidden bg-black border border-slate-300">
                    <img
                      src={caseData.gradcam_image_url || caseData.original_image_url}
                      alt="Grad-CAM Heatmap"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#0F766E] text-center block">
                    Layer4 Grad-CAM Heatmap
                  </span>
                </div>
              </div>
            )}

            {viewMode === "raw" && (
              <div className="relative w-full aspect-square max-w-[460px] mx-auto rounded-2xl overflow-hidden bg-black border border-slate-300 shadow-md">
                <img
                  src={caseData.original_image_url}
                  alt="Raw Radiograph"
                  onError={(e) => {
                    if (caseData.gradcam_image_url && e.currentTarget.src !== caseData.gradcam_image_url) {
                      e.currentTarget.src = caseData.gradcam_image_url;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Right: Technical Explanation & Radiologist Context */}
          <div className="lg:col-span-5 space-y-6">
            {/* Scientific Activation Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>Feature Activation Mechanism</span>
              </div>
              <h3 className="text-base font-bold text-[#102A43]">
                PyTorch ResNet-50 Layer4 Back-Projection
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The heatmap represents gradients of the diagnostic classification score back-propagated into the final 2048-channel residual bottleneck block (<code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800">model.layer4[-1]</code>).
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Clinical Correlation:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {isPneumonia
                    ? "Maximal activation focuses over regions of pulmonary parenchymal opacification, lobar consolidation, and air bronchograms."
                    : "No high-gradient focal clustering observed across the pulmonary lobes. Markings indicate normal bronchovascular distribution."}
                </p>
              </div>

              {caseData.ai_explanation && (
                <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200 text-xs space-y-2">
                  <div className="font-semibold text-[#102A43] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>AI Radiologic Interpretation & Grad-CAM Correlation:</span>
                  </div>
                  <div className="text-[11.5px] leading-relaxed text-slate-700 whitespace-pre-line pl-3 border-l-2 border-teal-300">
                    {caseData.ai_explanation}
                  </div>
                </div>
              )}

              {caseData.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Clinician Recorded Notes
                  </span>
                  <p className="text-xs text-slate-700 mt-1 italic">
                    &ldquo;{caseData.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Actions Card */}
            <div className="bg-gradient-to-br from-[#102A43] to-[#16324F] rounded-2xl p-6 text-white space-y-4 shadow-sm">
              <h4 className="text-sm font-bold text-teal-300">
                Diagnostic Documentation
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Export an official diagnostic report containing the original radiograph, Grad-CAM visualization, and mathematical confidence metrics.
              </p>

              <div className="pt-2 space-y-2">
                <Link
                  href={`/hospital/cases/${caseData.id}/report`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0d635c] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Diagnostic Report (PDF)</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
      )}
    </AuthGuard>
  );
}

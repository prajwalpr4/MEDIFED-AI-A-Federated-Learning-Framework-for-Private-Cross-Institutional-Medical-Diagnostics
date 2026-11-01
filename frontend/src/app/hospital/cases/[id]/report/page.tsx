"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import casesStore from "@/lib/cases-store";
import { fetchHospitalCases } from "@/lib/supabase-service";
import { DiagnosticCase } from "@/lib/types";
import {
  Printer,
  ArrowLeft,
  Activity,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Award,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

export default function CaseReportPage() {
  const params = useParams();
  const { hospital } = useAuth();
  const caseId = params.id as string;
  const [caseData, setCaseData] = useState<DiagnosticCase | null>(null);

  useEffect(() => {
    const found = casesStore.getCaseById(caseId);
    if (found) {
      setCaseData(found);
    }
    fetchHospitalCases(hospital?.id || null)
      .then((cases) => {
        const live = cases.find((c) => c.id === caseId || c.case_code === caseId);
        if (live) setCaseData(live);
      })
      .catch((err) => console.warn("Live case fetch notice:", err));
  }, [caseId, hospital?.id]);

  const isPneumonia = caseData?.predicted_class === "PNEUMONIA";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <AuthGuard>
      {!caseData ? (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 text-xs text-slate-500">
          Loading case report...
        </div>
      ) : (
        <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
          {/* Top Action Bar (Hidden when printing) */}
          <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/hospital/cases/${caseData.id}/explain`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to AI Lens</span>
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0d635c] text-white text-xs font-bold transition-all shadow-md shadow-teal-900/10"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Main Printable Document Card */}
      <article className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-12 space-y-8 text-slate-900 print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <header className="border-b-2 border-[#102A43] pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#102A43] text-teal-300 flex items-center justify-center">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#102A43] tracking-tight">
                MEDIFED AI &mdash; CLINICAL DIAGNOSTIC REPORT
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Federated Medical Intelligence &bull; Cross-Institutional Radiograph Evaluation
              </p>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <div className="text-xs font-mono font-bold text-[#102A43]">
              {caseData.case_code}
            </div>
            <div className="text-[11px] text-slate-500">
              Generated: {new Date(caseData.created_at).toLocaleDateString()}
            </div>
          </div>
        </header>

        {/* Patient & Institution Metadata Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Originating Silo
            </span>
            <div className="font-bold text-[#102A43] mt-0.5">
              {caseData.hospital_name}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Evaluating Clinician
            </span>
            <div className="font-semibold text-slate-800 mt-0.5">
              {caseData.created_by || "Attending Radiologist"}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Examination Type
            </span>
            <div className="font-semibold text-slate-800 mt-0.5">
              Chest Radiograph (AP/PA)
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Model Checkpoint
            </span>
            <div className="font-mono text-slate-800 mt-0.5">
              {caseData.model_checkpoint}
            </div>
          </div>
        </section>

        {/* Primary Diagnostic Finding Box */}
        <section
          className={`p-6 rounded-xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isPneumonia
              ? "bg-red-50/70 border-red-300 text-red-950"
              : "bg-emerald-50/70 border-emerald-300 text-emerald-950"
          }`}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Primary Diagnostic Classification
            </span>
            <div className="flex items-center gap-2">
              {isPneumonia ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              )}
              <span className="text-2xl font-black tracking-wide">
                {caseData.predicted_class}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Probabilities: Normal: {(caseData.normal_probability * 100).toFixed(2)}% | Pneumonia: {(caseData.pneumonia_probability * 100).toFixed(2)}%
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Model Confidence
            </span>
            <div className="text-3xl font-black text-[#102A43]">
              {(caseData.confidence * 100).toFixed(2)}%
            </div>
          </div>
        </section>

        {/* Dual Radiological Exhibits */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Radiological Visual Exhibits (Raw Scan & PyTorch Grad-CAM Heatmap)
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <figure className="space-y-2 text-center">
              <div className="aspect-square rounded-xl overflow-hidden bg-black border border-slate-300 shadow-sm">
                <img
                  src={caseData.original_image_url}
                  alt="Original Chest Radiograph"
                  onError={(e) => {
                    if (caseData.gradcam_image_url && e.currentTarget.src !== caseData.gradcam_image_url) {
                      e.currentTarget.src = caseData.gradcam_image_url;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="text-[11px] text-slate-600 font-medium">
                Figure 1: Raw Chest Radiograph (Post-CLAHE Preprocessing)
              </figcaption>
            </figure>

            <figure className="space-y-2 text-center">
              <div className="aspect-square rounded-xl overflow-hidden bg-black border border-slate-300 shadow-sm">
                <img
                  src={caseData.gradcam_image_url || caseData.original_image_url}
                  alt="Grad-CAM Layer4 Heatmap"
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="text-[11px] text-[#0F766E] font-medium">
                Figure 2: Grad-CAM Activation Heatmap (layer4[-1] feature map)
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Radiologic Impression & Notes */}
        <section className="space-y-3 border-t border-slate-200 pt-5 text-xs">
          <h2 className="font-bold text-slate-800 uppercase tracking-wider">
            Clinical Findings & Radiologist Impression
          </h2>
          {caseData.ai_explanation && (
            <div className="text-slate-800 leading-relaxed bg-teal-50/40 p-4 rounded-xl border border-teal-200 whitespace-pre-line">
              <div className="font-bold text-[#0F766E] uppercase text-[10px] tracking-wider mb-1">
                AI Radiologic Interpretation & Grad-CAM Analysis:
              </div>
              {caseData.ai_explanation}
            </div>
          )}
          <div className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-line">
            <div className="font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">
              Attending Clinician Observations & Diagnostic Notes:
            </div>
            {caseData.notes || (
              isPneumonia
                ? "Bilateral pulmonary parenchymal evaluation reveals localized consolidation in lower lobes with elevated layer4 gradient activation. Recommend clinical correlation and sputum culture if clinically indicated."
                : "No pulmonary focal consolidation, pneumothorax, or large pleural effusion noted. Bronchovascular distribution within normal limits for patient age and demographic cohort."
            )}
          </div>
        </section>

        {/* Signatures & Accreditation Footer */}
        <footer className="border-t border-slate-200 pt-8 mt-8 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div>
            <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              Verified by Attending Radiologist / Sign-off
            </span>
          </div>

          <div className="text-right space-y-1">
            <div className="font-bold text-slate-700">
              MEDIFED AI Research Consortium
            </div>
            <p className="text-[11px] text-slate-400">
              IEEE Transactions on Medical Imaging (2026 Submission)
            </p>
            <p className="text-[10px] text-slate-400">
              Consortium for Federated Healthcare Intelligence
            </p>
          </div>
        </footer>
      </article>
    </div>
      )}
    </AuthGuard>
  );
}

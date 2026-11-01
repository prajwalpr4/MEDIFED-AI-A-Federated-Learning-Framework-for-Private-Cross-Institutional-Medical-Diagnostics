"use client";

import React from "react";
import { CheckCircle2, TrendingUp, AlertTriangle, Shield, Award } from "lucide-react";

export function ResearchBenchmarks() {
  return (
    <section id="benchmarks" className="py-16 bg-white border-y border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200">
            <Award className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>VERIFIED RESEARCH BENCHMARKS</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#102A43] tracking-tight">
            Published Multi-Institutional Evaluation
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Empirical results achieved after Round 3 convergence of FedProx on the pooled multi-hospital test set (1,247 radiograph images across 3 non-IID clinical silos).
          </p>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <div className="card-clinical border-l-4 border-l-[#0F766E]">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pooled Accuracy
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#102A43]">81.40%</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +2.1% (R1&rarr;R3)
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              1,015 / 1,247 correct classifications
            </p>
          </div>

          <div className="card-clinical border-l-4 border-l-[#16324F]">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pooled Precision
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#102A43]">86.25%</span>
              <span className="text-xs font-medium text-emerald-600">Optimal PPV</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              High positive predictive certainty
            </p>
          </div>

          <div className="card-clinical border-l-4 border-l-teal-600">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pooled Recall (Sensitivity)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#102A43]">80.20%</span>
              <span className="text-xs font-medium text-slate-500">571 / 712 TP</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Pathology identification sensitivity
            </p>
          </div>

          <div className="card-clinical border-l-4 border-l-amber-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pooled F1-Score
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#102A43]">83.11%</span>
              <span className="text-xs font-medium text-teal-700">Balanced Harmonic</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Robust across severe class imbalance
            </p>
          </div>
        </div>

        {/* Confusion Matrix & Non-IID Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Empirical Confusion Matrix Table */}
          <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#102A43]">
                  Empirical Confusion Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Global Model Evaluation on N=1,247 Test Patients
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-teal-100/70 text-teal-800">
                Round 3
              </span>
            </div>

            {/* Matrix Visual Grid */}
            <div className="mt-4 overflow-hidden border border-slate-300 rounded-xl bg-white shadow-sm">
              <div className="grid grid-cols-3 text-center text-xs font-semibold text-slate-600 border-b border-slate-200 bg-slate-100 py-2.5">
                <div>Truth \ Predicted</div>
                <div className="text-emerald-700">PRED: NORMAL</div>
                <div className="text-red-700">PRED: PNEUMONIA</div>
              </div>

              {/* Row 1: Actually Normal */}
              <div className="grid grid-cols-3 text-center border-b border-slate-200 divide-x divide-slate-200">
                <div className="py-4 px-2 text-xs font-bold text-slate-700 bg-slate-50 flex items-center justify-center">
                  ACTUAL: NORMAL (535)
                </div>
                <div className="py-4 px-2 bg-emerald-50/70 flex flex-col justify-center items-center">
                  <span className="text-xl font-extrabold text-emerald-800">444</span>
                  <span className="text-[10px] font-semibold text-emerald-700">
                    TN (True Negative)
                  </span>
                </div>
                <div className="py-4 px-2 bg-amber-50/70 flex flex-col justify-center items-center">
                  <span className="text-xl font-extrabold text-amber-800">91</span>
                  <span className="text-[10px] font-semibold text-amber-700">
                    FP (Type I Error)
                  </span>
                </div>
              </div>

              {/* Row 2: Actually Pneumonia */}
              <div className="grid grid-cols-3 text-center divide-x divide-slate-200">
                <div className="py-4 px-2 text-xs font-bold text-slate-700 bg-slate-50 flex items-center justify-center">
                  ACTUAL: PNEUMONIA (712)
                </div>
                <div className="py-4 px-2 bg-red-50/70 flex flex-col justify-center items-center">
                  <span className="text-xl font-extrabold text-red-800">141</span>
                  <span className="text-[10px] font-semibold text-red-700">
                    FN (Type II Error)
                  </span>
                </div>
                <div className="py-4 px-2 bg-teal-50/80 flex flex-col justify-center items-center">
                  <span className="text-xl font-extrabold text-teal-800">571</span>
                  <span className="text-[10px] font-semibold text-teal-700">
                    TP (True Positive)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                <span className="text-slate-500 font-medium">Specificity (TN Rate)</span>
                <p className="text-lg font-bold text-[#102A43] mt-0.5">83.00%</p>
                <span className="text-[10px] text-slate-400">444 / 535 healthy cases</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                <span className="text-slate-500 font-medium">Sensitivity (TP Rate)</span>
                <p className="text-lg font-bold text-[#102A43] mt-0.5">80.20%</p>
                <span className="text-[10px] text-slate-400">571 / 712 pneumonia cases</span>
              </div>
            </div>
          </div>

          {/* Client-Wise Breakdown & Non-IID Analysis */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#102A43]">
                Client-Wise Heterogeneity Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Evaluation across individual silo test partitions revealing domain shift
              </p>
            </div>

            {/* Client 1 Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-[#102A43]">
                  Hospital A (Client 1, N=624)
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  85.42% Acc
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500">Precision:</span>{" "}
                  <strong className="text-slate-800">81.21%</strong>
                </div>
                <div>
                  <span className="text-slate-500">Recall:</span>{" "}
                  <strong className="text-slate-800">99.74%</strong>
                </div>
                <div>
                  <span className="text-slate-500">F1:</span>{" "}
                  <strong className="text-slate-800">89.53%</strong>
                </div>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#0F766E] h-full rounded-full" style={{ width: "85.42%" }} />
              </div>
            </div>

            {/* Client 2 Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-[#102A43] flex items-center gap-1.5">
                  Hospital B (Client 2, N=110)
                  <span title="Domain shift observed in manuscript">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  45.45% Acc
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500">Precision:</span>{" "}
                  <strong className="text-slate-800">100.0%</strong>
                </div>
                <div>
                  <span className="text-slate-500">Recall:</span>{" "}
                  <strong className="text-slate-800">9.09%</strong>
                </div>
                <div>
                  <span className="text-slate-500">F1:</span>{" "}
                  <strong className="text-slate-800">16.67%</strong>
                </div>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "45.45%" }} />
              </div>
              <p className="text-[11px] text-slate-500 italic">
                *Research note: Demographic domain shift and smaller training sample size at Hospital B (332 train) caused conservative sensitivity.
              </p>
            </div>

            {/* Client 3 Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-[#102A43]">
                  Hospital C (Client 3, N=513)
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  84.21% Acc
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500">Precision:</span>{" "}
                  <strong className="text-slate-800">99.44%</strong>
                </div>
                <div>
                  <span className="text-slate-500">Recall:</span>{" "}
                  <strong className="text-slate-800">68.75%</strong>
                </div>
                <div>
                  <span className="text-slate-500">F1:</span>{" "}
                  <strong className="text-slate-800">81.29%</strong>
                </div>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#0F766E] h-full rounded-full" style={{ width: "84.21%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

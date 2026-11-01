"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  TrendingUp,
  Activity,
  Award,
  AlertTriangle,
  CheckCircle2,
  Layers,
  BookOpen,
  ArrowRight,
  BarChart2,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

interface RoundMetric {
  round: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  valAccuracy: number;
}

const ROUND_DATA: RoundMetric[] = [
  { round: "Round 1", accuracy: 79.31, precision: 84.12, recall: 77.81, f1: 80.84, valAccuracy: 86.4 },
  { round: "Round 2", accuracy: 80.51, precision: 85.34, recall: 79.02, f1: 82.06, valAccuracy: 88.7 },
  { round: "Round 3", accuracy: 81.40, precision: 86.25, recall: 80.20, f1: 83.11, valAccuracy: 90.04 },
];

export default function AdminPerformancePage() {
  const [selectedRound, setSelectedRound] = useState<number>(2); // Default to Round 3 (0-indexed: 2)

  const active = ROUND_DATA[selectedRound];

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
                PAPER BENCHMARKS
              </span>
              <span className="text-xs text-slate-500">IEEE Transactions on Medical Imaging</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#102A43] mt-1">
              Federated Learning Empirical Performance
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Verified experimental evaluation metrics across 3 global communication rounds on N=1,247 test radiographs.
            </p>
          </div>

          {/* Round Selector Buttons */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {ROUND_DATA.map((r, idx) => (
              <button
                key={r.round}
                onClick={() => setSelectedRound(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedRound === idx
                    ? "bg-[#102A43] text-teal-300 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r.round} {idx === 2 ? "(Converged)" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Metric Cards for Selected Round */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="card-clinical border-l-4 border-l-[#0F766E]">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pooled Test Accuracy
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#102A43]">{active.accuracy}%</span>
              <span className="text-xs font-semibold text-emerald-600">
                Val: {active.valAccuracy}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {ROUND_DATA[selectedRound].round} Global ResNet-50
            </p>
          </div>

          <div className="card-clinical border-l-4 border-l-[#16324F]">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Positive Predictive Value
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#102A43]">{active.precision}%</span>
              <span className="text-xs text-slate-500">Precision</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Low false positive rate in triage
            </p>
          </div>

          <div className="card-clinical border-l-4 border-l-teal-600">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Diagnostic Sensitivity
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#102A43]">{active.recall}%</span>
              <span className="text-xs text-slate-500">Recall</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              True Positive detection rate
            </p>
          </div>

          <div className="card-clinical border-l-4 border-l-amber-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Harmonic Mean (F1)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#102A43]">{active.f1}%</span>
              <span className="text-xs text-amber-600 font-semibold">Balanced</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Robust across class imbalance
            </p>
          </div>
        </div>

        {/* Training Progression Across Rounds Visualizer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#102A43] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0F766E]" />
                Federated Learning Convergence Across Rounds
              </h2>
              <p className="text-xs text-slate-500">
                Progression of global ResNet-50 weights under FedProx (&mu;=0.01, local epochs E=1)
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-teal-50 text-teal-800">
              AdamW (lr=1e-4)
            </span>
          </div>

          {/* Comparative Progress Bars */}
          <div className="space-y-4 pt-2">
            {ROUND_DATA.map((r, idx) => {
              const isSelected = selectedRound === idx;
              return (
                <div
                  key={r.round}
                  onClick={() => setSelectedRound(idx)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#0F766E] bg-teal-50/20 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#102A43]">{r.round}</span>
                      {idx === 2 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                          Production Checkpoint
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-800">
                      Acc: {r.accuracy}% | F1: {r.f1}%
                    </div>
                  </div>

                  {/* Dual multi-color progress tracks */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#0F766E] h-full transition-all duration-500"
                        style={{ width: `${r.accuracy}%` }}
                        title={`Accuracy: ${r.accuracy}%`}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Precision: {r.precision}%</span>
                      <span>Recall: {r.recall}%</span>
                      <span>Validation Acc: {r.valAccuracy}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empirical Confusion Matrix & Academic Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Confusion Matrix */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#102A43]">
                  Empirical Confusion Matrix (Round 3)
                </h3>
                <p className="text-xs text-slate-500">
                  Pooled Test Radiographs: N=1,247 cases
                </p>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                ResNet-50
              </span>
            </div>

            <div className="overflow-hidden border border-slate-300 rounded-xl bg-white shadow-sm mt-3">
              <div className="grid grid-cols-3 text-center text-xs font-semibold text-slate-600 border-b border-slate-200 bg-slate-100 py-2.5">
                <div>Ground Truth</div>
                <div className="text-emerald-700">PRED: NORMAL</div>
                <div className="text-red-700">PRED: PNEUMONIA</div>
              </div>

              <div className="grid grid-cols-3 text-center border-b border-slate-200 divide-x divide-slate-200">
                <div className="py-4 px-2 text-xs font-bold text-slate-700 bg-slate-50 flex items-center justify-center">
                  NORMAL (535)
                </div>
                <div className="py-4 px-2 bg-emerald-50/80 flex flex-col justify-center items-center">
                  <span className="text-2xl font-black text-emerald-800">444</span>
                  <span className="text-[10px] font-bold text-emerald-700">TN (True Neg)</span>
                </div>
                <div className="py-4 px-2 bg-amber-50/80 flex flex-col justify-center items-center">
                  <span className="text-2xl font-black text-amber-800">91</span>
                  <span className="text-[10px] font-bold text-amber-700">FP (Type I)</span>
                </div>
              </div>

              <div className="grid grid-cols-3 text-center divide-x divide-slate-200">
                <div className="py-4 px-2 text-xs font-bold text-slate-700 bg-slate-50 flex items-center justify-center">
                  PNEUMONIA (712)
                </div>
                <div className="py-4 px-2 bg-red-50/80 flex flex-col justify-center items-center">
                  <span className="text-2xl font-black text-red-800">141</span>
                  <span className="text-[10px] font-bold text-red-700">FN (Type II)</span>
                </div>
                <div className="py-4 px-2 bg-teal-50 flex flex-col justify-center items-center">
                  <span className="text-2xl font-black text-teal-800">571</span>
                  <span className="text-[10px] font-bold text-teal-700">TP (True Pos)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-slate-500 font-medium">Specificity (TN Rate)</span>
                <p className="text-lg font-bold text-[#102A43] mt-0.5">83.00%</p>
                <span className="text-[10px] text-slate-400">444 / 535 healthy cases</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-slate-500 font-medium">Sensitivity (TP Rate)</span>
                <p className="text-lg font-bold text-[#102A43] mt-0.5">80.20%</p>
                <span className="text-[10px] text-slate-400">571 / 712 pneumonia cases</span>
              </div>
            </div>
          </div>

          {/* Client-Wise Heterogeneity Analysis */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#102A43]">
                Client-Wise Heterogeneity & Non-IID Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Breakdown of individual test set evaluations from Section V
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-[#102A43]">
                    Hospital A (Client 1, N=624)
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    85.42% Acc
                  </span>
                </div>
                <div className="grid grid-cols-3 text-xs text-slate-600">
                  <div>Precision: <strong>81.21%</strong></div>
                  <div>Recall: <strong>99.74%</strong></div>
                  <div>F1-Score: <strong>89.53%</strong></div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-[#102A43] flex items-center gap-1.5">
                    Hospital B (Client 2, N=110)
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    45.45% Acc
                  </span>
                </div>
                <div className="grid grid-cols-3 text-xs text-slate-600">
                  <div>Precision: <strong>100.0%</strong></div>
                  <div>Recall: <strong>9.09%</strong></div>
                  <div>F1-Score: <strong>16.67%</strong></div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  *Domain shift: Smaller training sample size at Hospital B (332) and adult radiograph demographic differences caused conservative sensitivity.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-[#102A43]">
                    Hospital C (Client 3, N=513)
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    84.21% Acc
                  </span>
                </div>
                <div className="grid grid-cols-3 text-xs text-slate-600">
                  <div>Precision: <strong>99.44%</strong></div>
                  <div>Recall: <strong>68.75%</strong></div>
                  <div>F1-Score: <strong>81.29%</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </AuthGuard>
  );
}

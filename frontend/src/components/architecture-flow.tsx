"use client";

import React, { useState } from "react";
import { Lock, Eye, Network, Cpu, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

interface Step {
  num: string;
  title: string;
  icon: any;
  summary: string;
  details: string[];
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Client-Side Ingestion & PHI Masking",
    icon: Lock,
    summary: "Radiographs are ingested locally behind each hospital firewall without raw data sharing.",
    details: [
      "Automated EasyOCR detects and zeroes patient metadata in header/margin regions",
      "DICOM & standard formats standardized to 224x224 grayscale tensors",
      "Strict data sovereignty: zero raw images ever leave hospital storage",
    ],
  },
  {
    num: "02",
    title: "CLAHE Contrast Normalization",
    icon: Cpu,
    summary: "Contrast Limited Adaptive Histogram Equalization compensates for non-standardized X-ray equipment.",
    details: [
      "OpenCV CLAHE transform configured with clipLimit=2.0, tileGridSize=(8,8)",
      "Normalizes varying radiographic tube voltages across different hospital machines",
      "Enhances pulmonary parenchymal detail and peribronchial opacities",
    ],
  },
  {
    num: "03",
    title: "Local ResNet-50 Gradient Optimization",
    icon: Cpu,
    summary: "Each hospital client trains a local ResNet-50 copy with PyTorch on local patients.",
    details: [
      "AdamW optimizer with weight decay 1e-4 and learning rate 1e-4",
      "Local epoch E=1 prevents catastrophic overfitting to small client cohorts",
      "Extracts deep convolutional representations from layer4 residual blocks",
    ],
  },
  {
    num: "04",
    title: "FedProx Global Aggregation",
    icon: Network,
    summary: "Coordinator aggregates model weights using proximal regularization to stabilize non-IID drift.",
    details: [
      "FedProx parameter μ=0.01 penalizes local weight drift from the global checkpoint",
      "Safeguards against client divergence caused by disparate sample distributions (3,892 vs 332 vs 902)",
      "Communication rounds execute in under 2 minutes per round",
    ],
  },
  {
    num: "05",
    title: "Explainable Grad-CAM Synthesis",
    icon: Eye,
    summary: "Global model outputs spatial attention heatmaps to give clinicians transparent diagnostic evidence.",
    details: [
      "Hooks layer4[-1] gradient activations back-projected onto input radiograph",
      "Highlights pulmonary infiltrates and consolidation zones in real time",
      "Clinicians can toggle blend opacity from 0% to 100% overlay",
    ],
  },
];

export function ArchitectureFlow() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200">
            <Network className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>SYSTEM ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#102A43] tracking-tight">
            Decentralized Privacy & Inference Pipeline
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            From local hospital radiograph ingestion to decentralized global parameter aggregation and layer4 explainability.
          </p>
        </div>

        {/* Step Navigation Pills */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.num}
                onClick={() => setActiveStep(idx)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isActive
                    ? "bg-[#102A43] text-white border-[#102A43] shadow-md"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isActive ? "text-teal-300" : "text-slate-400"
                    }`}
                  >
                    {step.num}
                  </span>
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-teal-400" : "text-slate-400"
                    }`}
                  />
                </div>
                <div className="text-xs font-semibold leading-tight line-clamp-1">
                  {step.title.split("&")[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                <span>STAGE {STEPS[activeStep].num} OF 05</span>
              </div>
              <h3 className="text-2xl font-bold text-[#102A43]">
                {STEPS[activeStep].title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {STEPS[activeStep].summary}
              </p>

              <div className="space-y-2.5 pt-2">
                {STEPS[activeStep].details.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 bg-gradient-to-br from-[#102A43] to-[#16324F] p-6 rounded-xl text-white space-y-4">
              <div className="text-xs font-semibold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Security & Integrity Guarantee
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Raw medical imaging data never crosses firewall boundaries. Each hospital node operates independently under strict Supabase Row-Level Security and private object storage paths.
              </p>
              <div className="p-3 bg-black/30 rounded-lg border border-slate-700/60 font-mono text-[11px] text-teal-200">
                <code>
                  Federation Algorithm: FedProx(E=1, &mu;=0.01)<br />
                  Global Checkpoint: global_round_03.pth
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

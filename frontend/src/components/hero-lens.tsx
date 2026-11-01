"use client";

import React, { useState } from "react";
import { Eye, Layers, ShieldCheck, Sparkles, Zap, Activity } from "lucide-react";

interface SamplePreview {
  id: string;
  title: string;
  label: "PNEUMONIA" | "NORMAL";
  confidence: number;
  originalUrl: string;
  gradcamUrl: string;
  cohort: string;
  finding: string;
}

const SAMPLES: SamplePreview[] = [
  {
    id: "s1",
    title: "Hospital A Lobar Infiltrate",
    label: "PNEUMONIA",
    confidence: 0.9999,
    originalUrl: "/samples/kaggle_pneumonia_1.jpeg",
    gradcamUrl: "/samples/kaggle_pneumonia_1_gradcam.jpeg",
    cohort: "Hospital A",
    finding: "Maximal gradient attention focused on right middle/lower lung consolidation.",
  },
  {
    id: "s2",
    title: "Hospital A Clear Parenchyma",
    label: "NORMAL",
    confidence: 0.618,
    originalUrl: "/samples/kaggle_normal_1.jpeg",
    gradcamUrl: "/samples/kaggle_normal_1_gradcam.jpeg",
    cohort: "Hospital A",
    finding: "Diffuse non-focal activations; no localized pulmonary consolidations detected.",
  },
  {
    id: "s3",
    title: "Hospital C Peribronchial Infiltrate",
    label: "PNEUMONIA",
    confidence: 0.9929,
    originalUrl: "/samples/bhopal_sample_1.jpeg",
    gradcamUrl: "/samples/bhopal_sample_1_gradcam.jpeg",
    cohort: "Hospital C",
    finding: "Layer4 spatial activation over left peribronchial thickening and opacification.",
  },
];

export function HeroLens() {
  const [selectedSample, setSelectedSample] = useState<SamplePreview>(SAMPLES[0]);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(65);
  const [viewMode, setViewMode] = useState<"blend" | "side_by_side" | "original">("blend");

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-5 shadow-md text-slate-900">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Explainable AI Lens
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                PyTorch Grad-CAM (layer4)
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Interactive spatial heatmaps generated from ResNet-50 weights
            </p>
          </div>
        </div>

        {/* Sample Selector Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          {SAMPLES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setSelectedSample(s)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                selectedSample.id === s.id
                  ? "bg-[#102A43] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Scan {idx + 1}: {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Visual Display */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Interactive Image Container */}
        <div className="md:col-span-7 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[380px] rounded-xl overflow-hidden bg-black border border-slate-200 shadow-md group">
            {/* Base Chest Radiograph */}
            <img
              src={selectedSample.originalUrl}
              alt="Chest Radiograph Original"
              className="absolute inset-0 w-full h-full object-cover select-none"
            />

            {/* Grad-CAM Heatmap Layer with Opacity Slider */}
            {viewMode !== "original" && (
              <img
                src={selectedSample.gradcamUrl}
                alt="Grad-CAM Layer4 Heatmap"
                style={{
                  opacity: viewMode === "side_by_side" ? 1 : overlayOpacity / 100,
                }}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-150 mix-blend-screen pointer-events-none"
              />
            )}

            {/* In-Image Status Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase shadow-md flex items-center gap-1.5 backdrop-blur-md ${
                  selectedSample.label === "PNEUMONIA"
                    ? "bg-red-600/90 text-white"
                    : "bg-emerald-600/90 text-white"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                {selectedSample.label}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-800 backdrop-blur-md border border-slate-200 shadow-sm">
                {(selectedSample.confidence * 100).toFixed(1)}% Confidence
              </span>
            </div>

            <div className="absolute bottom-3 right-3 text-[10px] px-2 py-1 rounded bg-black/75 text-white backdrop-blur-md border border-slate-700">
              {viewMode === "original"
                ? "Original X-Ray"
                : `Heatmap Blend: ${overlayOpacity}%`}
            </div>
          </div>

          {/* Opacity Slider Control */}
          <div className="w-full max-w-[380px] mt-3.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-teal-700" />
                Grad-CAM Heatmap Intensity
              </span>
              <span className="text-teal-800 font-mono font-bold">
                {overlayOpacity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={overlayOpacity}
              onChange={(e) => {
                setOverlayOpacity(Number(e.target.value));
                if (viewMode === "original") setViewMode("blend");
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#102A43]"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>0% (Raw Radiograph)</span>
              <span>50% (Balanced Overlay)</span>
              <span>100% (High Activation)</span>
            </div>
          </div>
        </div>

        {/* Radiologic Diagnostic Interpretation Panel */}
        <div className="md:col-span-5 space-y-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="text-xs uppercase tracking-wider text-teal-800 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Clinical Finding
            </div>
            <h4 className="text-base font-extrabold text-slate-900 leading-snug">
              {selectedSample.title}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedSample.finding}
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Source:</span>
              <span className="text-[#102A43] font-bold">{selectedSample.cohort}</span>
            </div>
          </div>

          {/* Research Architecture Callout */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 space-y-1.5 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Zero Leakage
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Trained via <strong>FedProx (&mu;=0.01)</strong> across 3 cross-continental hospital silos. Model weights converged in Round 3 without exchanging raw patient radiographs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

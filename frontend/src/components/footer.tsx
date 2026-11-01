"use client";

import React from "react";
import Link from "next/link";
import { Activity, ShieldCheck, BookOpen, Cpu, Award } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 mt-auto">
      {/* Upper Footer: Academic Citation & Research Provenance */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#102A43] flex items-center justify-center text-teal-300 shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-[#102A43]">
                  MEDIFED<span className="text-[#0F766E]">.AI</span>
                </span>
                <p className="text-[11px] text-slate-500 font-medium tracking-wider uppercase">
                  Federated Medical Intelligence
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              An enterprise web implementation of the academic research manuscript:{" "}
              <span className="text-slate-800 font-semibold italic">
                &ldquo;A Generalized Federated Learning Framework for Private Cross-Institutional Medical Diagnostics&rdquo;
              </span>
              . Designed for decentralized chest radiograph pneumonia screening preserving patient privacy.
            </p>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 text-teal-800 font-bold text-[11px]">
                <Award className="w-3.5 h-3.5" />
                FEDERATED LEARNING RESEARCH CONSORTIUM
              </div>
              <p className="text-slate-800 font-medium">
                Cross-Institutional Clinical Diagnostic Initiative
              </p>
              <p className="text-slate-500 text-[11px]">
                Multi-Center Diagnostic Framework &bull; IEEE Transactions Submission (2026)
              </p>
            </div>
          </div>

          {/* Technical Specs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-700" /> Core Architecture
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                PyTorch ResNet-50 Classifier
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                Layer4 Grad-CAM Activation Heatmaps
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                FedProx Decentralized Protocol (&mu;=0.01)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                CLAHE Contrast Normalization
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                EasyOCR PHI De-Identification
              </li>
            </ul>
          </div>

          {/* Verified Institutional Nodes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" /> Research Cohorts
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <div className="font-semibold text-slate-800">Hospital A</div>
                <div className="text-[11px] text-slate-500">3,892 Train | 624 Test (Clinical Node A)</div>
              </li>
              <li>
                <div className="font-semibold text-slate-800">Hospital B</div>
                <div className="text-[11px] text-slate-500">332 Train | 110 Test (Clinical Node B)</div>
              </li>
              <li>
                <div className="font-semibold text-slate-800">Hospital C</div>
                <div className="text-[11px] text-slate-500">902 Train | 513 Test (Clinical Node C)</div>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory & Diagnostic Disclaimer */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="leading-relaxed text-center md:text-left">
            <strong className="text-amber-700 font-semibold">RESEARCH & CLINICAL DISCLAIMER:</strong> MEDIFED AI is a research demonstration system for federated learning in medical imaging. Not FDA/CE cleared as an independent diagnostic medical device. Diagnostic outputs require confirmation by board-certified radiologists.
          </p>
          <div className="text-slate-500 text-xs shrink-0 font-medium">
            &copy; 2026 MEDIFED AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

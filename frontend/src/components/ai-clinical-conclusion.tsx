"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PredictionResult } from "@/lib/api";
import {
  Sparkles,
  RefreshCw,
  Stethoscope,
  Microscope,
  FileCheck,
} from "lucide-react";

interface AiClinicalConclusionProps {
  prediction: PredictionResult;
  selectedFile?: File | null;
  onExplanationGenerated?: (conclusion: string) => void;
}

export function AiClinicalConclusion({
  prediction,
  onExplanationGenerated,
}: AiClinicalConclusionProps) {
  const [conclusion, setConclusion] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [source, setSource] = useState<string | null>(null);

  const generateConclusion = useCallback(async () => {
    setLoading(true);

    const activeKey =
      (typeof window !== "undefined"
        ? localStorage.getItem("medifed_gemini_key") || ""
        : "") ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    try {
      const payload = {
        predicted_class: prediction.predicted_class,
        confidence: prediction.confidence,
        normal_probability: prediction.probabilities.NORMAL,
        pneumonia_probability: prediction.probabilities.PNEUMONIA,
        imageBase64: prediction.gradcam_base64 || prediction.original_base64,
        clientApiKey: activeKey.trim() || undefined,
      };

      const res = await fetch("/api/ai/clinical-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setConclusion(data.conclusion);
        setSource(data.source);
        if (data.conclusion && onExplanationGenerated) {
          onExplanationGenerated(data.conclusion);
        }
      } else {
        throw new Error(`Endpoint returned status ${res.status}`);
      }
    } catch (err: any) {
      console.warn("AI Conclusion fetch error:", err);
      setSource("clinical_synthesizer");
    } finally {
      setLoading(false);
    }
  }, [prediction, onExplanationGenerated]);

  // Auto-generate whenever a new prediction is received
  useEffect(() => {
    generateConclusion();
  }, [prediction.predicted_class, prediction.confidence, generateConclusion]);

  // Split conclusion into visual sections if standard markers exist
  const parseSections = (text: string) => {
    const sections: { title: string; content: string; icon: any }[] = [];
    const lines = text.split("\n");

    let currentTitle = "Diagnostic Findings";
    let currentLines: string[] = [];
    let currentIcon = Stethoscope;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.includes("PRIMARY DIAGNOSTIC IMPRESSION")) {
        if (currentLines.length > 0) {
          sections.push({ title: currentTitle, content: currentLines.join("\n"), icon: currentIcon });
          currentLines = [];
        }
        currentTitle = "Primary Diagnostic Impression";
        currentIcon = Stethoscope;
      } else if (line.includes("RADIOLOGICAL & GRAD-CAM CORRELATION") || line.includes("HEATMAP CORRELATION")) {
        if (currentLines.length > 0) {
          sections.push({ title: currentTitle, content: currentLines.join("\n"), icon: currentIcon });
          currentLines = [];
        }
        currentTitle = "Radiological & Grad-CAM Spatial Correlation";
        currentIcon = Microscope;
      } else if (line.includes("RECOMMENDED CLINICAL NEXT STEPS") || line.includes("NEXT STEPS")) {
        if (currentLines.length > 0) {
          sections.push({ title: currentTitle, content: currentLines.join("\n"), icon: currentIcon });
          currentLines = [];
        }
        currentTitle = "Recommended Clinical Next Steps";
        currentIcon = FileCheck;
      } else {
        currentLines.push(rawLine);
      }
    }

    if (currentLines.length > 0) {
      sections.push({ title: currentTitle, content: currentLines.join("\n"), icon: currentIcon });
    }

    return sections;
  };

  const parsedSections = conclusion ? parseSections(conclusion) : [];

  return (
    <div className="space-y-3 pt-3 border-t border-slate-100">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800">
            AI Diagnostic Conclusion & Radiologic Impression
          </span>
        </div>

        {/* Source Badge & Regenerate Control */}
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
              source === "gemini"
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                : "bg-teal-50 text-teal-800 border border-teal-200"
            }`}
          >
            {source === "gemini" ? "✨ Gemini 1.5 Flash" : "⚡ ResNet-50 Synthesis"}
          </span>

          <button
            type="button"
            onClick={() => generateConclusion()}
            disabled={loading}
            title="Regenerate Conclusion"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Conclusion Display */}
      {loading ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 animate-pulse">
          <div className="flex items-center gap-2 text-teal-800 font-semibold">
            <Sparkles className="w-4 h-4 animate-spin text-teal-600" />
            <span>Synthesizing radiological conclusion from ResNet-50 & Layer4 Grad-CAM...</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 bg-slate-200 rounded w-full" />
            <div className="h-2 bg-slate-200 rounded w-5/6" />
            <div className="h-2 bg-slate-200 rounded w-4/6" />
          </div>
        </div>
      ) : conclusion ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          {/* Formatted Content Cards */}
          <div className="p-3.5 space-y-3 bg-slate-50/70 text-xs">
            {parsedSections.length > 1 ? (
              parsedSections.map((sec, idx) => {
                const IconComponent = sec.icon;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#102A43] uppercase tracking-wide">
                      <IconComponent className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>{sec.title}</span>
                    </div>
                    <div className="text-slate-700 leading-relaxed text-[11.5px] whitespace-pre-line pl-5 border-l-2 border-teal-200">
                      {sec.content.trim()}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 rounded-lg bg-white border border-slate-200/80 text-slate-700 leading-relaxed text-xs whitespace-pre-line">
                {conclusion}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

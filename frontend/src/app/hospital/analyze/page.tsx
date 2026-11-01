"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import casesStore from "@/lib/cases-store";
import apiClient, { PredictionResult } from "@/lib/api";
import {
  UploadCloud,
  FileImage,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  ArrowRight,
  Eye,
  RefreshCw,
  Check,
  Building2,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { saveCaseToHospitalTable } from "@/lib/supabase-service";
import { AiClinicalConclusion } from "@/components/ai-clinical-conclusion";

interface SamplePreset {
  id: string;
  name: string;
  label: string;
  url: string;
  cohort: string;
}

const PRESET_SAMPLES: SamplePreset[] = [
  {
    id: "p1",
    name: "Hospital A Scan 1",
    label: "PNEUMONIA",
    url: "/samples/kaggle_pneumonia_1.jpeg",
    cohort: "Hospital A",
  },
  {
    id: "p2",
    name: "Hospital A Scan 2",
    label: "NORMAL",
    url: "/samples/kaggle_normal_1.jpeg",
    cohort: "Hospital A",
  },
  {
    id: "p3",
    name: "Hospital B Scan 1",
    label: "NORMAL",
    url: "/samples/chittagong_sample_1.jpeg",
    cohort: "Hospital B",
  },
  {
    id: "p4",
    name: "Hospital C Scan 1",
    label: "PNEUMONIA",
    url: "/samples/bhopal_sample_1.jpeg",
    cohort: "Hospital C",
  },
];

export default function AnalyzePage() {
  const router = useRouter();
  const { hospital, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<number>(0);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null);
  const [blendOpacity, setBlendOpacity] = useState<number>(65);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setAiExplanation(null);
      setSavedCaseId(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setAiExplanation(null);
      setSavedCaseId(null);
      setError(null);
    }
  };

  const loadPreset = async (preset: SamplePreset) => {
    try {
      setError(null);
      setResult(null);
      setAiExplanation(null);
      setSavedCaseId(null);
      const res = await fetch(preset.url);
      const blob = await res.blob();
      const file = new File([blob], `${preset.id}.jpeg`, { type: "image/jpeg" });
      setSelectedFile(file);
      setPreviewUrl(preset.url);
    } catch (err: any) {
      setError("Failed to load preset image");
    }
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setError(null);
    setAnalysisStage(1);

    try {
      // Step simulation for visual feedback
      setTimeout(() => setAnalysisStage(2), 250);
      setTimeout(() => setAnalysisStage(3), 500);

      const prediction = await apiClient.predict(selectedFile);
      setResult(prediction);
      setAnalysisStage(4);
    } catch (err: any) {
      setError(err.message || "ML microservice inference failed. Ensure FastAPI is running on port 8000.");
    } finally {
      setAnalyzing(false);
    }
  };

  const [saving, setSaving] = useState(false);

  const saveToRegistry = async () => {
    if (!result || !hospital) return;
    setSaving(true);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const case_code = `CASE-${dateStr}-${randomSuffix}`;

    // Read selectedFile as true Base64 Data URI so it never passes a transient blob: URL
    let originalBase64 = result.original_base64;
    if (selectedFile) {
      try {
        originalBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      } catch {
        originalBase64 = result.original_base64;
      }
    }

    const gradcamUrl = result.gradcam_base64;
    const diagnosisLabel = result.predicted_class === "PNEUMONIA" ? "PNEUMONIA POSITIVE" : "NORMAL (NO PNEUMONIA)";
    const caseNotes = notes
      ? `[${diagnosisLabel}] ${notes}`
      : aiExplanation
      ? `[${diagnosisLabel}]\n${aiExplanation}`
      : `Diagnostic Result: ${diagnosisLabel} with ${(result.confidence * 100).toFixed(1)}% confidence`;

    try {
      // 1. Upload to dedicated hospital bucket & insert into dedicated hospital table
      const cloudResult = await saveCaseToHospitalTable({
        case_code,
        hospital_id: hospital.id,
        created_by: user?.full_name || hospital.name,
        original_image_url: originalBase64,
        gradcam_image_url: gradcamUrl,
        predicted_class: result.predicted_class,
        normal_probability: result.probabilities.NORMAL,
        pneumonia_probability: result.probabilities.PNEUMONIA,
        confidence: result.confidence,
        model_checkpoint: result.model_checkpoint,
        inference_time_ms: result.inference_time_ms,
        notes: caseNotes,
        ai_explanation: aiExplanation || undefined,
      });

      // 2. Also keep local store synced with the persistent cloud URLs
      const newCase = casesStore.addCase({
        case_code,
        hospital_id: hospital.id,
        created_by: user?.full_name || hospital.name,
        original_image_url: cloudResult.originalCloudUrl || originalBase64,
        gradcam_image_url: cloudResult.gradcamCloudUrl || gradcamUrl,
        predicted_class: result.predicted_class,
        normal_probability: result.probabilities.NORMAL,
        pneumonia_probability: result.probabilities.PNEUMONIA,
        confidence: result.confidence,
        model_checkpoint: result.model_checkpoint,
        inference_time_ms: result.inference_time_ms,
        notes: caseNotes,
        ai_explanation: aiExplanation || undefined,
      });

      setSavedCaseId(newCase.id);
    } catch (err: any) {
      console.warn("Failed to upload/save to Supabase dedicated table:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard requiredRole="hospital_user">
      <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                {hospital?.code || "HOSPITAL"}
              </span>
              <span className="text-xs text-slate-500">Live Radiograph Analysis Engine</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#102A43] mt-1">
              Analyze Chest Radiograph
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Execute live PyTorch ResNet-50 inference and synthesize Layer4 Grad-CAM activation heatmaps.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <div className="font-bold">Inference Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Quick Sample Presets Bar */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <FileImage className="w-4 h-4 text-[#0F766E]" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1-Click Research Test Scans:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_SAMPLES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-xs font-medium text-slate-700 transition-all flex items-center gap-2"
              >
                <span>{preset.name}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    preset.label === "PNEUMONIA"
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Work Area: Upload vs Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload / Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#102A43] uppercase tracking-wider flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#0F766E]" />
                Chest Radiograph Ingestion
              </h2>

              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  previewUrl
                    ? "border-teal-300 bg-teal-50/20"
                    : "border-slate-300 hover:border-teal-500 bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Selected Chest X-ray"
                      className="max-h-64 mx-auto rounded-lg shadow-sm border border-slate-200 object-contain bg-black"
                    />
                    <p className="text-xs text-slate-500">
                      Click or drag a new image to replace
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Drop chest radiograph here, or{" "}
                        <span className="text-[#0F766E]">browse</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports standard DICOM export formats: JPEG, PNG (max 15MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <button
                onClick={runAnalysis}
                disabled={!selectedFile || analyzing}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                  !selectedFile || analyzing
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-[#102A43] hover:bg-[#16324F] text-white shadow-sm"
                }`}
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-300" />
                    <span>Executing CLAHE + ResNet-50 + Grad-CAM...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-teal-300" />
                    <span>Run Federated Model Inference</span>
                  </>
                )}
              </button>

              {/* Progress Steps during Analysis */}
              {analyzing && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-[11px] text-teal-300 font-mono">
                    <span>STATUS: PROCESSING PIPELINE</span>
                    <span>STAGE {analysisStage}/4</span>
                  </div>
                  <div className="space-y-1.5 text-slate-300 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      1. Applying CLAHE (clipLimit=2.0, tileGridSize=8x8)
                    </div>
                    {analysisStage >= 2 && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        2. PyTorch ResNet-50 Forward Pass (weights: global_round_03.pth)
                      </div>
                    )}
                    {analysisStage >= 3 && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        3. Backward gradient pass on layer4[-1] for Grad-CAM
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Results Display */}
          <div className="lg:col-span-6 space-y-4">
            {result ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
                {/* Result Title & Diagnostic Outcome Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Diagnostic Finding
                    </span>
                    <h3 className="text-xl font-black text-[#102A43]">
                      ResNet-50 Classification
                    </h3>
                  </div>

                  <span
                    className={`px-4 py-1.5 rounded-xl text-sm font-extrabold tracking-wide uppercase shadow-sm flex items-center gap-2 ${
                      result.predicted_class === "PNEUMONIA"
                        ? "bg-red-50 text-red-700 border border-red-300 ring-2 ring-red-100"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-100"
                    }`}
                  >
                    {result.predicted_class === "PNEUMONIA" ? (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {result.predicted_class}
                  </span>
                </div>

                {/* Probabilities Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Pneumonia Probability:</span>
                    <span className="font-bold text-red-700 font-mono">
                      {(result.probabilities.PNEUMONIA * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${result.probabilities.PNEUMONIA * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-semibold text-slate-700">Normal Probability:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {(result.probabilities.NORMAL * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${result.probabilities.NORMAL * 100}%` }}
                    />
                  </div>
                </div>

                {/* Grad-CAM Interactive Preview */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-[#0F766E]" />
                      PyTorch Grad-CAM Spatial Heatmap
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Inference: {result.inference_time_ms}ms
                    </span>
                  </div>

                  {/* Dual Layer View Container */}
                  <div className="relative w-full aspect-square max-w-[340px] mx-auto rounded-xl overflow-hidden bg-black border border-slate-300 shadow-inner">
                    <img
                      src={previewUrl || result.original_base64}
                      alt="Original Scan"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <img
                      src={result.gradcam_base64}
                      alt="Grad-CAM Layer4 Overlay"
                      style={{ opacity: blendOpacity / 100 }}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none transition-opacity"
                    />
                  </div>

                  {/* Slider Control */}
                  <div className="space-y-1.5 max-w-[340px] mx-auto">
                    <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                      <span>Heatmap Overlay Blend:</span>
                      <span className="font-bold text-[#0F766E]">{blendOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={blendOpacity}
                      onChange={(e) => setBlendOpacity(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
                    />
                  </div>
                </div>

                {/* AI Diagnostic Conclusion & Radiologic Impression */}
                <AiClinicalConclusion
                  prediction={result}
                  selectedFile={selectedFile}
                  onExplanationGenerated={(exp) => setAiExplanation(exp)}
                />

                {/* Clinical Notes Input */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700">
                    Clinician Impression & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter observations, radiologic findings, or patient correlation..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Save and Actions */}
                <div className="space-y-2 pt-2">
                  {savedCaseId ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Case successfully saved to {hospital?.name} registry</span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={() => router.push(`/hospital/cases/${savedCaseId}/explain`)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700"
                        >
                          Open Deep Lens
                        </button>
                        <button
                          onClick={() => router.push(`/hospital/cases/${savedCaseId}/report`)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold text-[11px] hover:bg-emerald-100"
                        >
                          Print Clinical Report
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={saveToRegistry}
                      className="w-full py-3 px-4 rounded-xl bg-[#102A43] hover:bg-[#16324F] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-teal-300" />
                      <span>Save Diagnostic Case to Hospital Registry</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Awaiting Radiograph Input
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload a chest radiograph or choose one of the preset sample scans above, then click &ldquo;Run Federated Model Inference&rdquo;.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </AuthGuard>
  );
}

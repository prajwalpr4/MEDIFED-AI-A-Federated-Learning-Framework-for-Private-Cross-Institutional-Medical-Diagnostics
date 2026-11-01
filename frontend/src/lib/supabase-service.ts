/**
 * MEDIFED AI — Dedicated Supabase Service
 * Handles multi-tenant storage in separate hospital buckets and separate hospital tables.
 */

import { createClient, isSupabaseConfigured } from "./supabase/client";
import { DiagnosticCase, RESEARCH_HOSPITALS } from "./types";

export function getHospitalBucket(hospitalCodeOrId?: string | null): string {
  if (!hospitalCodeOrId) return "hospital-a-cases";
  if (hospitalCodeOrId.includes("B") || hospitalCodeOrId === "22222222-2222-2222-2222-222222222222") {
    return "hospital-b-cases";
  }
  if (hospitalCodeOrId.includes("C") || hospitalCodeOrId === "33333333-3333-3333-3333-333333333333") {
    return "hospital-c-cases";
  }
  return "hospital-a-cases";
}

export function getHospitalTable(hospitalCodeOrId?: string | null): string {
  if (!hospitalCodeOrId) return "cases_hospital_a";
  if (hospitalCodeOrId.includes("B") || hospitalCodeOrId === "22222222-2222-2222-2222-222222222222") {
    return "cases_hospital_b";
  }
  if (hospitalCodeOrId.includes("C") || hospitalCodeOrId === "33333333-3333-3333-3333-333333333333") {
    return "cases_hospital_c";
  }
  return "cases_hospital_a";
}

function base64ToBlob(base64Data: string, contentType = "image/jpeg"): Blob {
  const base64 = base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data;
  const byteCharacters = atob(base64);
  const byteArrays: Uint8Array<ArrayBuffer>[] = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

export async function uploadImageToHospitalBucket(
  hospitalCodeOrId: string,
  path: string,
  imageData: Blob | File | string
): Promise<string> {
  if (!isSupabaseConfigured()) return typeof imageData === "string" ? imageData : "";
  const supabase = createClient();
  const bucket = getHospitalBucket(hospitalCodeOrId);

  let uploadPayload: Blob | File;
  if (typeof imageData === "string") {
    if (imageData.startsWith("data:") || (!imageData.startsWith("/") && !imageData.startsWith("http"))) {
      uploadPayload = base64ToBlob(imageData);
    } else {
      try {
        const res = await fetch(imageData);
        uploadPayload = await res.blob();
      } catch {
        return imageData;
      }
    }
  } else {
    uploadPayload = imageData;
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, uploadPayload, { upsert: true, contentType: "image/jpeg" });

  if (error) {
    console.warn(`Storage upload to ${bucket} error:`, error.message);
    return typeof imageData === "string" ? imageData : "";
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicData.publicUrl;
}

export async function saveCaseToHospitalTable(caseData: {
  case_code: string;
  hospital_id: string;
  created_by?: string;
  original_image_url: string;
  gradcam_image_url?: string;
  predicted_class: "NORMAL" | "PNEUMONIA";
  normal_probability: number;
  pneumonia_probability: number;
  confidence: number;
  model_checkpoint: string;
  inference_time_ms: number;
  notes?: string;
  ai_explanation?: string;
}) {
  // First attempt: Server API Route (authorized via SUPABASE_SERVICE_ROLE_KEY)
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/cases/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return {
          data: json.case,
          error: null,
          originalCloudUrl: json.originalCloudUrl || caseData.original_image_url,
          gradcamCloudUrl: json.gradcamCloudUrl || caseData.gradcam_image_url,
        };
      } else {
        console.warn("Server save notice, attempting client fallback:", json.error);
      }
    } catch (apiErr) {
      console.warn("Save API route unreachable, attempting direct client fallback:", apiErr);
    }
  }

  if (!isSupabaseConfigured()) {
    return { data: null, error: null, originalCloudUrl: caseData.original_image_url, gradcamCloudUrl: caseData.gradcam_image_url };
  }

  const supabase = createClient();
  const table = getHospitalTable(caseData.hospital_id);

  // 1. Upload original radiograph to designated hospital bucket
  let originalCloudUrl = caseData.original_image_url;
  try {
    originalCloudUrl = await uploadImageToHospitalBucket(
      caseData.hospital_id,
      `xrays/${caseData.case_code}_original.jpeg`,
      caseData.original_image_url
    );
  } catch (e) {
    console.warn("Could not upload original radiograph to bucket:", e);
  }

  // 2. Upload Grad-CAM heatmap to designated hospital bucket
  let gradcamCloudUrl = caseData.gradcam_image_url;
  if (caseData.gradcam_image_url) {
    try {
      gradcamCloudUrl = await uploadImageToHospitalBucket(
        caseData.hospital_id,
        `gradcam/${caseData.case_code}_gradcam.jpeg`,
        caseData.gradcam_image_url
      );
    } catch (e) {
      console.warn("Could not upload gradcam to bucket:", e);
    }
  }

  // Embed AI explanation in notes for full compatibility
  let combinedNotes = caseData.notes || "";
  if (caseData.ai_explanation && !combinedNotes.includes(caseData.ai_explanation)) {
    combinedNotes = combinedNotes
      ? `[AI EXPLANATION]\n${caseData.ai_explanation}\n\n[CLINICIAN NOTES]\n${combinedNotes}`
      : `[AI EXPLANATION]\n${caseData.ai_explanation}`;
  }

  // 3. Save into designated hospital table (attempting with ai_explanation column first)
  const payload: Record<string, any> = {
    case_code: caseData.case_code,
    hospital_id: caseData.hospital_id,
    created_by: caseData.created_by || "Clinician",
    original_image_url: originalCloudUrl,
    gradcam_image_url: gradcamCloudUrl,
    predicted_class: caseData.predicted_class,
    normal_probability: caseData.normal_probability,
    pneumonia_probability: caseData.pneumonia_probability,
    confidence: caseData.confidence,
    model_checkpoint: caseData.model_checkpoint,
    inference_time_ms: caseData.inference_time_ms,
    notes: combinedNotes,
    ai_explanation: caseData.ai_explanation || null,
  };

  let { data, error }: any = await supabase.from(table).insert(payload).select().single();

  // If ai_explanation column does not exist in table yet, retry without it
  if (error && (error.message?.includes("ai_explanation") || error.code === "42703")) {
    const { ai_explanation: _, ...fallbackPayload } = payload;
    const retry = await supabase.from(table).insert(fallbackPayload).select().single();
    data = retry.data;
    error = retry.error;
  }

  // If specific table does not exist, fallback to main cases table
  if (error && (error.message?.includes("Could not find the table") || error.code === "42P01")) {
    const fallback = await supabase.from("cases").insert(payload).select().single();
    data = fallback.data;
    error = fallback.error;
  }

  return { data, error, originalCloudUrl, gradcamCloudUrl };
}

export async function fetchHospitalCases(hospitalCodeOrId?: string | null): Promise<DiagnosticCase[]> {
  // First attempt: Server API Route (authorized via SUPABASE_SERVICE_ROLE_KEY)
  if (typeof window !== "undefined") {
    try {
      const url = hospitalCodeOrId
        ? `/api/cases/fetch?hospital_id=${encodeURIComponent(hospitalCodeOrId)}`
        : "/api/cases/fetch";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.cases)) {
          return json.cases.map(mapDbToDiagnosticCase);
        }
      }
    } catch (err) {
      console.warn("Fetch API route error, falling back to client query:", err);
    }
  }

  if (!isSupabaseConfigured()) return [];

  const supabase = createClient();

  // Admin: fetch from all three hospital tables
  if (!hospitalCodeOrId) {
    const [resA, resB, resC] = await Promise.allSettled([
      supabase.from("cases_hospital_a").select("*").order("created_at", { ascending: false }),
      supabase.from("cases_hospital_b").select("*").order("created_at", { ascending: false }),
      supabase.from("cases_hospital_c").select("*").order("created_at", { ascending: false }),
    ]);

    const allData: any[] = [];
    if (resA.status === "fulfilled" && resA.value.data) allData.push(...resA.value.data);
    if (resB.status === "fulfilled" && resB.value.data) allData.push(...resB.value.data);
    if (resC.status === "fulfilled" && resC.value.data) allData.push(...resC.value.data);

    if (allData.length === 0) {
      const { data } = await supabase.from("cases").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) allData.push(...data);
    }

    return allData.map(mapDbToDiagnosticCase);
  }

  const table = getHospitalTable(hospitalCodeOrId);
  const { data, error }: any = await supabase.from(table).select("*").order("created_at", { ascending: false });

  if (error && (error.message?.includes("Could not find the table") || error.code === "42P01")) {
    const { data: fallbackData } = await supabase
      .from("cases")
      .select("*")
      .eq("hospital_id", hospitalCodeOrId)
      .order("created_at", { ascending: false });
    return (fallbackData || []).map(mapDbToDiagnosticCase);
  }

  return (data || []).map(mapDbToDiagnosticCase);
}

function extractAiExplanationFromNotes(notes?: string | null): string | undefined {
  if (!notes) return undefined;
  if (notes.includes("[AI EXPLANATION]")) {
    const parts = notes.split("[AI EXPLANATION]");
    if (parts[1]) {
      const sub = parts[1].split("[CLINICIAN NOTES]");
      return sub[0].trim();
    }
  }
  if (notes.includes("[AI DIAGNOSTIC CONCLUSION]")) {
    const parts = notes.split("[AI DIAGNOSTIC CONCLUSION]");
    if (parts[1]) {
      const sub = parts[1].split("[CLINICIAN NOTES]");
      return sub[0].trim();
    }
  }
  return undefined;
}

function mapDbToDiagnosticCase(d: any): DiagnosticCase {
  const hosp = RESEARCH_HOSPITALS.find((h) => h.id === d.hospital_id);
  const aiExplanation = d.ai_explanation || extractAiExplanationFromNotes(d.notes);
  return {
    id: d.id,
    case_code: d.case_code,
    hospital_id: d.hospital_id,
    hospital_name: hosp?.name || "Hospital Node",
    created_by: d.created_by,
    original_image_url: d.original_image_url,
    gradcam_image_url: d.gradcam_image_url,
    predicted_class: d.predicted_class,
    normal_probability: Number(d.normal_probability),
    pneumonia_probability: Number(d.pneumonia_probability),
    confidence: Number(d.confidence),
    model_checkpoint: d.model_checkpoint || "global_round_03.pth",
    inference_time_ms: Number(d.inference_time_ms) || 0,
    notes: d.notes,
    ai_explanation: aiExplanation,
    created_at: d.created_at,
  };
}

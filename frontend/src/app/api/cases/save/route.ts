import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getHospitalBucket(hospitalCodeOrId?: string | null): string {
  if (!hospitalCodeOrId) return "hospital-a-cases";
  const str = String(hospitalCodeOrId);
  if (str.includes("B") || str === "22222222-2222-2222-2222-222222222222") {
    return "hospital-b-cases";
  }
  if (str.includes("C") || str === "33333333-3333-3333-3333-333333333333") {
    return "hospital-c-cases";
  }
  return "hospital-a-cases";
}

function getHospitalTable(hospitalCodeOrId?: string | null): string {
  if (!hospitalCodeOrId) return "cases_hospital_a";
  const str = String(hospitalCodeOrId);
  if (str.includes("B") || str === "22222222-2222-2222-2222-222222222222") {
    return "cases_hospital_b";
  }
  if (str.includes("C") || str === "33333333-3333-3333-3333-333333333333") {
    return "cases_hospital_c";
  }
  return "cases_hospital_a";
}

function base64ToBuffer(base64Data: string): { buffer: Buffer; contentType: string } {
  let contentType = "image/jpeg";
  let pureBase64 = base64Data;
  if (base64Data.startsWith("data:")) {
    const parts = base64Data.split(";base64,");
    contentType = parts[0].replace("data:", "").trim();
    pureBase64 = parts[1] || "";
  }
  pureBase64 = pureBase64.replace(/\s/g, "");
  return {
    buffer: Buffer.from(pureBase64, "base64"),
    contentType,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      case_code,
      hospital_id,
      created_by,
      original_image_url,
      gradcam_image_url,
      predicted_class,
      normal_probability,
      pneumonia_probability,
      confidence,
      model_checkpoint,
      inference_time_ms,
      notes,
      ai_explanation,
    } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured in environment" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const bucket = getHospitalBucket(hospital_id);
    const table = getHospitalTable(hospital_id);

    // 1. Upload original image to hospital bucket if provided as base64 / data URI
    let originalCloudUrl = original_image_url;
    if (original_image_url && !original_image_url.startsWith("http") && !original_image_url.startsWith("blob:")) {
      try {
        const { buffer, contentType } = base64ToBuffer(original_image_url);
        const ext = contentType.includes("png") ? "png" : "jpeg";
        const fileName = `xrays/${case_code}_original.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(fileName, buffer, { contentType, upsert: true });

        if (!upErr) {
          const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(fileName);
          originalCloudUrl = pubData.publicUrl;
        } else {
          console.warn("Storage upload error:", upErr.message);
        }
      } catch (err) {
        console.warn("Could not convert/upload original image:", err);
      }
    }

    // 2. Upload gradcam image to hospital bucket
    let gradcamCloudUrl = gradcam_image_url;
    if (gradcam_image_url && !gradcam_image_url.startsWith("http") && !gradcam_image_url.startsWith("blob:")) {
      try {
        const { buffer, contentType } = base64ToBuffer(gradcam_image_url);
        const fileName = `gradcam/${case_code}_gradcam.jpeg`;
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(fileName, buffer, { contentType, upsert: true });

        if (!upErr) {
          const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(fileName);
          gradcamCloudUrl = pubData.publicUrl;
        } else {
          console.warn("Gradcam storage upload error:", upErr.message);
        }
      } catch (err) {
        console.warn("Could not convert/upload gradcam image:", err);
      }
    }

    const diagnosisLabel = predicted_class === "PNEUMONIA" ? "PNEUMONIA POSITIVE" : "NORMAL (NO PNEUMONIA)";

    // Embed AI explanation in notes if not already present, ensuring persistence across all configurations
    let recordNotes = notes || "";
    if (ai_explanation && !recordNotes.includes(ai_explanation)) {
      recordNotes = recordNotes
        ? `[AI EXPLANATION]\n${ai_explanation}\n\n[CLINICIAN NOTES]\n${recordNotes}`
        : `[AI EXPLANATION]\n${ai_explanation}`;
    }
    if (!recordNotes) {
      recordNotes = `DIAGNOSIS: ${diagnosisLabel} (Confidence: ${(Number(confidence || 0) * 100).toFixed(1)}%)`;
    }

    // 3. Insert into the designated hospital table (attempting with ai_explanation column first)
    const payloadWithExplanation: Record<string, any> = {
      case_code,
      hospital_id,
      created_by: created_by || "Clinician",
      original_image_url: originalCloudUrl,
      gradcam_image_url: gradcamCloudUrl,
      predicted_class, // Explicit classification: 'PNEUMONIA' or 'NORMAL'
      normal_probability,
      pneumonia_probability,
      confidence,
      model_checkpoint: model_checkpoint || "global_round_03.pth",
      inference_time_ms: inference_time_ms || 0,
      notes: recordNotes, // Explicit diagnostic statement & explanation in table
      ai_explanation: ai_explanation || null,
    };

    let { data, error } = await supabase.from(table).insert(payloadWithExplanation).select().single();

    // If ai_explanation column does not exist yet (migration 005 pending), retry without it (preserved in notes)
    if (error && (error.message?.includes("ai_explanation") || error.code === "42703")) {
      console.warn("ai_explanation column not yet migrated; saving with embedded notes");
      const { ai_explanation: _, ...fallbackPayload } = payloadWithExplanation;
      const retry = await supabase.from(table).insert(fallbackPayload).select().single();
      data = retry.data;
      error = retry.error;
    }

    // Fallback if specific table not found
    if (error && (error.message?.includes("Could not find the table") || error.code === "42P01")) {
      const fallback = await supabase.from("cases").insert(payloadWithExplanation).select().single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      case: data,
      originalCloudUrl,
      gradcamCloudUrl,
      table,
      bucket,
    });
  } catch (err: any) {
    console.error("Save route exception:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

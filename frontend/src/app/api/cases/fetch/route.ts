import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hospital_id = searchParams.get("hospital_id");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, cases: [] });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 1. If no specific hospital_id requested (Admin): fetch from all 3 hospital tables
    if (!hospital_id || hospital_id === "ALL" || hospital_id === "null") {
      const [resA, resB, resC] = await Promise.allSettled([
        supabase.from("cases_hospital_a").select("*").order("created_at", { ascending: false }),
        supabase.from("cases_hospital_b").select("*").order("created_at", { ascending: false }),
        supabase.from("cases_hospital_c").select("*").order("created_at", { ascending: false }),
      ]);

      const allData: any[] = [];
      if (resA.status === "fulfilled" && resA.value.data) allData.push(...resA.value.data);
      if (resB.status === "fulfilled" && resB.value.data) allData.push(...resB.value.data);
      if (resC.status === "fulfilled" && resC.value.data) allData.push(...resC.value.data);

      // Fallback to legacy cases table if all hospital tables were empty or unpopulated
      if (allData.length === 0) {
        const { data } = await supabase.from("cases").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) allData.push(...data);
      }

      // Sort combined dataset descending
      allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json({ success: true, cases: allData });
    }

    // 2. Clinician: fetch only from their designated hospital table
    const table = getHospitalTable(hospital_id);
    let { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });

    // Fallback if specific table not found
    if (error && (error.message?.includes("Could not find the table") || error.code === "42P01")) {
      const fallback = await supabase
        .from("cases")
        .select("*")
        .eq("hospital_id", hospital_id)
        .order("created_at", { ascending: false });
      data = fallback.data;
    }

    return NextResponse.json({ success: true, cases: data || [] });
  } catch (err: any) {
    console.error("Fetch route error:", err);
    return NextResponse.json({ success: false, cases: [], error: err.message }, { status: 500 });
  }
}

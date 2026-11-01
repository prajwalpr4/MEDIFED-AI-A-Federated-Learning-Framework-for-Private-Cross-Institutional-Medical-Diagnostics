/**
 * MEDIFED AI — Diagnostic Cases & Audit Logs Data Store
 * Supports multi-tenant isolation adhering strictly to the research hospitals.
 */

import { DiagnosticCase, AuditLog, RESEARCH_HOSPITALS } from "./types";
import { createClient, isSupabaseConfigured } from "./supabase/client";
import { fetchHospitalCases } from "./supabase-service";

const INITIAL_CASES: DiagnosticCase[] = [];

const INITIAL_LOGS: AuditLog[] = [];

class CasesStore {
  private casesKey = "medifed_cases_v4";
  private logsKey = "medifed_logs_v4";

  private getStoredCases(): DiagnosticCase[] {
    if (typeof window === "undefined") return INITIAL_CASES;
    const stored = localStorage.getItem(this.casesKey);
    if (!stored) {
      localStorage.setItem(this.casesKey, JSON.stringify(INITIAL_CASES));
      return INITIAL_CASES;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_CASES;
    }
  }

  private setStoredCases(cases: DiagnosticCase[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.casesKey, JSON.stringify(cases));
    }
  }

  private getStoredLogs(): AuditLog[] {
    if (typeof window === "undefined") return INITIAL_LOGS;
    const stored = localStorage.getItem(this.logsKey);
    if (!stored) {
      localStorage.setItem(this.logsKey, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_LOGS;
    }
  }

  private setStoredLogs(logs: AuditLog[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.logsKey, JSON.stringify(logs));
    }
  }

  /**
   * Multi-Tenant Case Fetching
   * If hospitalId is provided (hospital user), strictly returns only that hospital's cases.
   * If hospitalId is undefined (admin), returns all cases across all hospitals.
   */
  getCases(hospitalId?: string | null): DiagnosticCase[] {
    const all = this.getStoredCases();
    if (!hospitalId) {
      return all;
    }
    return all.filter((c) => c.hospital_id === hospitalId);
  }

  getCaseById(id: string): DiagnosticCase | undefined {
    return this.getStoredCases().find((c) => c.id === id || c.case_code === id);
  }

  addCase(
    newCase: Omit<DiagnosticCase, "id" | "case_code" | "created_at"> & {
      case_code?: string;
    }
  ): DiagnosticCase {
    const all = this.getStoredCases();
    const hospital = RESEARCH_HOSPITALS.find((h) => h.id === newCase.hospital_id);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const case_code = newCase.case_code || `CASE-${dateStr}-${randomSuffix}`;

    const created: DiagnosticCase = {
      ...newCase,
      id: `case-${Date.now()}`,
      case_code,
      hospital_name: hospital?.name || "Affiliated Hospital",
      created_at: new Date().toISOString(),
    };

    all.unshift(created);
    this.setStoredCases(all);

    // Asynchronously sync to Supabase if configured
    if (typeof window !== "undefined" && isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase
          .from("cases")
          .insert({
            case_code: created.case_code,
            hospital_id: created.hospital_id,
            original_image_url: created.original_image_url,
            gradcam_image_url: created.gradcam_image_url,
            predicted_class: created.predicted_class,
            normal_probability: created.normal_probability,
            pneumonia_probability: created.pneumonia_probability,
            confidence: created.confidence,
            model_checkpoint: created.model_checkpoint,
            inference_time_ms: created.inference_time_ms,
            notes: created.notes,
            ai_explanation: created.ai_explanation,
          })
          .then(({ error }: any) => {
            if (error) console.warn("Supabase case sync notice:", error.message);
          });
      } catch (err) {
        console.warn("Supabase case sync notice:", err);
      }
    }

    // Append to audit log
    this.addLog({
      hospital_id: newCase.hospital_id,
      hospital_name: hospital?.name,
      user_name: newCase.created_by,
      action: "ANALYZE_IMAGE",
      metadata: {
        case_code: created.case_code,
        predicted_class: created.predicted_class,
        confidence: created.confidence,
      },
    });

    return created;
  }

  getLogs(): AuditLog[] {
    return this.getStoredLogs();
  }

  addLog(log: Omit<AuditLog, "id" | "created_at">): void {
    const logs = this.getStoredLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.setStoredLogs(logs);

    // Asynchronously sync to Supabase audit_logs table if configured
    if (typeof window !== "undefined" && isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase
          .from("audit_logs")
          .insert({
            hospital_id: newLog.hospital_id,
            action: newLog.action,
            metadata: newLog.metadata,
          })
          .then(({ error }: any) => {
            if (error) console.warn("Supabase audit sync notice:", error.message);
          });
      } catch (err) {
        console.warn("Supabase audit sync notice:", err);
      }
    }
  }

  /**
   * Cloud Pull: Fetch live cases from dedicated Supabase hospital tables
   */
  async syncFromSupabase(hospitalId?: string | null): Promise<DiagnosticCase[]> {
    if (!isSupabaseConfigured()) return this.getCases(hospitalId);
    try {
      const liveCases = await fetchHospitalCases(hospitalId);
      if (liveCases && liveCases.length > 0) {
        this.setStoredCases(liveCases);
        return liveCases;
      }
    } catch (err) {
      console.warn("Supabase fetch notice:", err);
    }
    return this.getCases(hospitalId);
  }
}

export const casesStore = new CasesStore();
export default casesStore;

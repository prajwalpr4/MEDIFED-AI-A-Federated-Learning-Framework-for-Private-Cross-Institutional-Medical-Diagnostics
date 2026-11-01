/**
 * MEDIFED AI — Domain Data Models & TypeScript Definitions
 */

export type Role = "admin" | "hospital_user";

export interface Hospital {
  id: string;
  code: "HOSPITAL_A" | "HOSPITAL_B" | "HOSPITAL_C";
  name: string;
  dataset_source: string;
  train_samples: number;
  test_samples: number;
  location?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  password?: string;
  hospital_id?: string | null;
  hospital?: Hospital | null;
}

export interface DiagnosticCase {
  id: string;
  case_code: string;
  hospital_id: string;
  hospital_name?: string;
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
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  hospital_id?: string;
  hospital_name?: string;
  action: "SIGN_IN" | "ANALYZE_IMAGE" | "VIEW_CASE" | "EXPORT_REPORT" | "SWITCH_ROLE";
  metadata: Record<string, any>;
  created_at: string;
}

export const RESEARCH_HOSPITALS: Hospital[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    code: "HOSPITAL_A",
    name: "Hospital A",
    dataset_source: "Hospital A Clinical Cohort (Train: 3,892 | Test: 624)",
    train_samples: 3892,
    test_samples: 624,
    location: "Clinical Site A",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    code: "HOSPITAL_B",
    name: "Hospital B",
    dataset_source: "Hospital B Clinical Cohort (Train: 332 | Test: 110)",
    train_samples: 332,
    test_samples: 110,
    location: "Clinical Site B",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    code: "HOSPITAL_C",
    name: "Hospital C",
    dataset_source: "Hospital C Clinical Cohort (Train: 902 | Test: 513)",
    train_samples: 902,
    test_samples: 513,
    location: "Clinical Site C",
  },
];

export const DEMO_PROFILES: UserProfile[] = [
  {
    id: "admin-001",
    email: "admin@medifed.ai",
    password: "Admin@12345",
    full_name: "Admin",
    role: "admin",
    hospital_id: null,
  },
  {
    id: "hosp-a-001",
    email: "hospital.a@medifed.ai",
    password: "HospitalA@12345",
    full_name: "Hospital A",
    role: "hospital_user",
    hospital_id: "11111111-1111-1111-1111-111111111111",
    hospital: RESEARCH_HOSPITALS[0],
  },
  {
    id: "hosp-b-001",
    email: "hospital.b@medifed.ai",
    password: "HospitalB@12345",
    full_name: "Hospital B",
    role: "hospital_user",
    hospital_id: "22222222-2222-2222-2222-222222222222",
    hospital: RESEARCH_HOSPITALS[1],
  },
  {
    id: "hosp-c-001",
    email: "hospital.c@medifed.ai",
    password: "HospitalC@12345",
    full_name: "Hospital C",
    role: "hospital_user",
    hospital_id: "33333333-3333-3333-3333-333333333333",
    hospital: RESEARCH_HOSPITALS[2],
  },
];

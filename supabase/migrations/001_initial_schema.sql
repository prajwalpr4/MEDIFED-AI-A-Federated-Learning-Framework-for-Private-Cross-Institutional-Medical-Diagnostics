-- ============================================================
-- MEDIFED AI: Federated Medical Intelligence
-- Supabase Migration: 001_initial_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Hospitals Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'HOSPITAL_A', 'HOSPITAL_B', 'HOSPITAL_C'
    name TEXT NOT NULL,
    dataset_source TEXT NOT NULL,
    train_samples INTEGER DEFAULT 0,
    test_samples INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. User Profiles Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'hospital_user')),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Diagnostic Cases Table ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT UNIQUE NOT NULL,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    original_image_url TEXT NOT NULL,
    gradcam_image_url TEXT,
    predicted_class TEXT NOT NULL CHECK (predicted_class IN ('NORMAL', 'PNEUMONIA')),
    normal_probability NUMERIC(6, 4) NOT NULL,
    pneumonia_probability NUMERIC(6, 4) NOT NULL,
    confidence NUMERIC(6, 4) NOT NULL,
    model_checkpoint TEXT DEFAULT 'global_round_03.pth',
    inference_time_ms NUMERIC(8, 2),
    inference_status TEXT DEFAULT 'completed' CHECK (inference_status IN ('completed', 'failed', 'processing')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Audit Logs Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'SIGN_IN', 'ANALYZE_IMAGE', 'VIEW_CASE', 'EXPORT_REPORT', etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes for high-performance querying ──────────────────
CREATE INDEX IF NOT EXISTS idx_cases_hospital_id ON public.cases(hospital_id);
CREATE INDEX IF NOT EXISTS idx_cases_case_code ON public.cases(case_code);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hospital_id ON public.audit_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ── Enable Row-Level Security on all tables ─────────────────
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


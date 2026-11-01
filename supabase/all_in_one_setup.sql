-- ============================================================
-- MEDIFED AI: Complete Database & Multi-Tenant Silo Setup
-- File: supabase/all_in_one_setup.sql
-- 
-- INSTRUCTIONS FOR SETUP:
-- 1. Create a new free project at https://supabase.com
-- 2. Open the "SQL Editor" tab from the left sidebar
-- 3. Paste and run this ENTIRE script in 1 click!
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Create Base Tables ────────────────────────────────────

-- Hospitals Table
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'HOSPITAL_A', 'HOSPITAL_B', 'HOSPITAL_C'
    name TEXT NOT NULL,
    dataset_source TEXT NOT NULL,
    train_samples INTEGER DEFAULT 0,
    test_samples INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles Table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'hospital_user')),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Dedicated Multi-Tenant Hospital Tables ────────────────

-- Hospital A Cases Table
CREATE TABLE IF NOT EXISTS public.cases_hospital_a (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT UNIQUE NOT NULL,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_by TEXT,
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
    ai_explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hospital B Cases Table
CREATE TABLE IF NOT EXISTS public.cases_hospital_b (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT UNIQUE NOT NULL,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) DEFAULT '22222222-2222-2222-2222-222222222222',
    created_by TEXT,
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
    ai_explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hospital C Cases Table
CREATE TABLE IF NOT EXISTS public.cases_hospital_c (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT UNIQUE NOT NULL,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) DEFAULT '33333333-3333-3333-3333-333333333333',
    created_by TEXT,
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
    ai_explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global / Fallback Cases Table
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT UNIQUE NOT NULL,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_by TEXT,
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
    ai_explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Performance Indexes ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cases_a_code ON public.cases_hospital_a(case_code);
CREATE INDEX IF NOT EXISTS idx_cases_a_created ON public.cases_hospital_a(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_b_code ON public.cases_hospital_b(case_code);
CREATE INDEX IF NOT EXISTS idx_cases_b_created ON public.cases_hospital_b(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_c_code ON public.cases_hospital_c(case_code);
CREATE INDEX IF NOT EXISTS idx_cases_c_created ON public.cases_hospital_c(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_all_code ON public.cases(case_code);

-- ── 4. Dedicated Storage Buckets ─────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('hospital-a-cases', 'hospital-a-cases', true),
    ('hospital-b-cases', 'hospital-b-cases', true),
    ('hospital-c-cases', 'hospital-c-cases', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Public Read Access Policies
DROP POLICY IF EXISTS "Public Access Hospital A" ON storage.objects;
CREATE POLICY "Public Access Hospital A" ON storage.objects FOR SELECT USING (bucket_id = 'hospital-a-cases');

DROP POLICY IF EXISTS "Public Access Hospital B" ON storage.objects;
CREATE POLICY "Public Access Hospital B" ON storage.objects FOR SELECT USING (bucket_id = 'hospital-b-cases');

DROP POLICY IF EXISTS "Public Access Hospital C" ON storage.objects;
CREATE POLICY "Public Access Hospital C" ON storage.objects FOR SELECT USING (bucket_id = 'hospital-c-cases');

-- Storage Upload Access Policies
DROP POLICY IF EXISTS "Allow Upload Hospital A" ON storage.objects;
CREATE POLICY "Allow Upload Hospital A" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hospital-a-cases');

DROP POLICY IF EXISTS "Allow Upload Hospital B" ON storage.objects;
CREATE POLICY "Allow Upload Hospital B" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hospital-b-cases');

DROP POLICY IF EXISTS "Allow Upload Hospital C" ON storage.objects;
CREATE POLICY "Allow Upload Hospital C" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hospital-c-cases');

-- ── 5. Row-Level Security (RLS) ──────────────────────────────
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases_hospital_a ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases_hospital_b ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases_hospital_c ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Non-recursive read policies
DROP POLICY IF EXISTS "Public read hospitals" ON public.hospitals;
CREATE POLICY "Public read hospitals" ON public.hospitals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read cases A" ON public.cases_hospital_a;
CREATE POLICY "Public read cases A" ON public.cases_hospital_a FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert cases A" ON public.cases_hospital_a;
CREATE POLICY "Public insert cases A" ON public.cases_hospital_a FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read cases B" ON public.cases_hospital_b;
CREATE POLICY "Public read cases B" ON public.cases_hospital_b FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert cases B" ON public.cases_hospital_b;
CREATE POLICY "Public insert cases B" ON public.cases_hospital_b FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read cases C" ON public.cases_hospital_c;
CREATE POLICY "Public read cases C" ON public.cases_hospital_c FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert cases C" ON public.cases_hospital_c;
CREATE POLICY "Public insert cases C" ON public.cases_hospital_c FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read cases" ON public.cases;
CREATE POLICY "Public read cases" ON public.cases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert cases" ON public.cases FOR INSERT WITH CHECK (true);

-- ── 6. Seed Baseline Data ────────────────────────────────────

-- Research Hospital Nodes
INSERT INTO public.hospitals (id, code, name, dataset_source, train_samples, test_samples)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'HOSPITAL_A', 'Hospital A', 'Hospital A Clinical Cohort (Train: 3,892 | Test: 624)', 3892, 624),
    ('22222222-2222-2222-2222-222222222222', 'HOSPITAL_B', 'Hospital B', 'Hospital B Clinical Cohort (Train: 332 | Test: 110)', 332, 110),
    ('33333333-3333-3333-3333-333333333333', 'HOSPITAL_C', 'Hospital C', 'Hospital C Clinical Cohort (Train: 902 | Test: 513)', 902, 513)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    dataset_source = EXCLUDED.dataset_source,
    train_samples = EXCLUDED.train_samples,
    test_samples = EXCLUDED.test_samples;

-- Baseline Audit Log Entry
INSERT INTO public.audit_logs (hospital_id, action, metadata)
VALUES ('11111111-1111-1111-1111-111111111111', 'INITIALIZE_SYSTEM', '{"status": "ready", "architecture": "FedProx ResNet-50"}'::jsonb);

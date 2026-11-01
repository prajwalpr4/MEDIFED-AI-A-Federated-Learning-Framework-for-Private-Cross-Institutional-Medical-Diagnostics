-- ============================================================
-- MEDIFED AI: Separate Hospital Tables & Dedicated Silo Storage
-- Migration: 003_separate_hospital_tables.sql
-- ============================================================

-- ── 1. Hospital A Cases Table ───────────────────────────────
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Hospital B Cases Table ───────────────────────────────
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Hospital C Cases Table ───────────────────────────────
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cases_a_code ON public.cases_hospital_a(case_code);
CREATE INDEX IF NOT EXISTS idx_cases_a_created ON public.cases_hospital_a(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cases_b_code ON public.cases_hospital_b(case_code);
CREATE INDEX IF NOT EXISTS idx_cases_b_created ON public.cases_hospital_b(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cases_c_code ON public.cases_hospital_c(case_code);
CREATE INDEX IF NOT EXISTS idx_cases_c_created ON public.cases_hospital_c(created_at DESC);

-- ── 5. Enable Row-Level Security ────────────────────────────
ALTER TABLE public.cases_hospital_a ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases_hospital_b ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases_hospital_c ENABLE ROW LEVEL SECURITY;

-- Hospital A Policies
DROP POLICY IF EXISTS "Hospital A users and Admin can select cases A" ON public.cases_hospital_a;
CREATE POLICY "Hospital A users and Admin can select cases A" ON public.cases_hospital_a
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '11111111-1111-1111-1111-111111111111')
        )
    );

DROP POLICY IF EXISTS "Hospital A users can insert cases A" ON public.cases_hospital_a;
CREATE POLICY "Hospital A users can insert cases A" ON public.cases_hospital_a
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '11111111-1111-1111-1111-111111111111')
        )
    );

-- Hospital B Policies
DROP POLICY IF EXISTS "Hospital B users and Admin can select cases B" ON public.cases_hospital_b;
CREATE POLICY "Hospital B users and Admin can select cases B" ON public.cases_hospital_b
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '22222222-2222-2222-2222-222222222222')
        )
    );

DROP POLICY IF EXISTS "Hospital B users can insert cases B" ON public.cases_hospital_b;
CREATE POLICY "Hospital B users can insert cases B" ON public.cases_hospital_b
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '22222222-2222-2222-2222-222222222222')
        )
    );

-- Hospital C Policies
DROP POLICY IF EXISTS "Hospital C users and Admin can select cases C" ON public.cases_hospital_c;
CREATE POLICY "Hospital C users and Admin can select cases C" ON public.cases_hospital_c
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '33333333-3333-3333-3333-333333333333')
        )
    );

DROP POLICY IF EXISTS "Hospital C users can insert cases C" ON public.cases_hospital_c;
CREATE POLICY "Hospital C users can insert cases C" ON public.cases_hospital_c
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '33333333-3333-3333-3333-333333333333')
        )
    );

-- ── 6. Dedicated Storage Buckets ────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('hospital-a-cases', 'hospital-a-cases', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('hospital-b-cases', 'hospital-b-cases', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('hospital-c-cases', 'hospital-c-cases', true) ON CONFLICT (id) DO NOTHING;

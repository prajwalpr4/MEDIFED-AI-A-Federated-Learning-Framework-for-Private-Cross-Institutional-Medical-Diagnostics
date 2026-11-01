-- ============================================================
-- MEDIFED AI: Add AI Explanation & Radiologic Conclusion Column
-- Migration: 005_add_ai_explanation.sql
-- ============================================================

-- 1. Add ai_explanation to Hospital A cases table
ALTER TABLE IF EXISTS public.cases_hospital_a
ADD COLUMN IF NOT EXISTS ai_explanation TEXT;

-- 2. Add ai_explanation to Hospital B cases table
ALTER TABLE IF EXISTS public.cases_hospital_b
ADD COLUMN IF NOT EXISTS ai_explanation TEXT;

-- 3. Add ai_explanation to Hospital C cases table
ALTER TABLE IF EXISTS public.cases_hospital_c
ADD COLUMN IF NOT EXISTS ai_explanation TEXT;

-- 4. Add ai_explanation to fallback cases table if present
ALTER TABLE IF EXISTS public.cases
ADD COLUMN IF NOT EXISTS ai_explanation TEXT;

-- 5. Add ai_explanation to diagnostic_cases table if present
ALTER TABLE IF EXISTS public.diagnostic_cases
ADD COLUMN IF NOT EXISTS ai_explanation TEXT;

-- 6. Add documentation comments
COMMENT ON COLUMN public.cases_hospital_a.ai_explanation IS 'AI-generated radiologic diagnostic conclusion and Grad-CAM spatial interpretation';
COMMENT ON COLUMN public.cases_hospital_b.ai_explanation IS 'AI-generated radiologic diagnostic conclusion and Grad-CAM spatial interpretation';
COMMENT ON COLUMN public.cases_hospital_c.ai_explanation IS 'AI-generated radiologic diagnostic conclusion and Grad-CAM spatial interpretation';

-- ============================================================
-- MEDIFED AI: Fix Profile Recursion & Grant Multi-Hospital Silo Access
-- Migration: 004_fix_rls_policies.sql
-- ============================================================

-- ── 1. Fix Profiles Table RLS (Prevent Infinite Recursion) ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;

-- Allow all authenticated users to read profiles so foreign keys / hospital checks don't recurse
CREATE POLICY "Authenticated read profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- ── 2. Hospital A Policies ──────────────────────────────────
DROP POLICY IF EXISTS "Hospital A and Admin select" ON public.cases_hospital_a;
DROP POLICY IF EXISTS "Hospital A users and Admin can select cases A" ON public.cases_hospital_a;
DROP POLICY IF EXISTS "Hospital A users can insert cases A" ON public.cases_hospital_a;
DROP POLICY IF EXISTS "Hospital A insert" ON public.cases_hospital_a;
DROP POLICY IF EXISTS "Hospital A select" ON public.cases_hospital_a;

CREATE POLICY "Hospital A select" ON public.cases_hospital_a
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '11111111-1111-1111-1111-111111111111')
        )
    );

CREATE POLICY "Hospital A insert" ON public.cases_hospital_a
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '11111111-1111-1111-1111-111111111111')
        )
    );

-- ── 3. Hospital B Policies ──────────────────────────────────
DROP POLICY IF EXISTS "Hospital B and Admin select" ON public.cases_hospital_b;
DROP POLICY IF EXISTS "Hospital B users and Admin can select cases B" ON public.cases_hospital_b;
DROP POLICY IF EXISTS "Hospital B users can insert cases B" ON public.cases_hospital_b;
DROP POLICY IF EXISTS "Hospital B insert" ON public.cases_hospital_b;
DROP POLICY IF EXISTS "Hospital B select" ON public.cases_hospital_b;

CREATE POLICY "Hospital B select" ON public.cases_hospital_b
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '22222222-2222-2222-2222-222222222222')
        )
    );

CREATE POLICY "Hospital B insert" ON public.cases_hospital_b
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '22222222-2222-2222-2222-222222222222')
        )
    );

-- ── 4. Hospital C Policies ──────────────────────────────────
DROP POLICY IF EXISTS "Hospital C and Admin select" ON public.cases_hospital_c;
DROP POLICY IF EXISTS "Hospital C users and Admin can select cases C" ON public.cases_hospital_c;
DROP POLICY IF EXISTS "Hospital C users can insert cases C" ON public.cases_hospital_c;
DROP POLICY IF EXISTS "Hospital C insert" ON public.cases_hospital_c;
DROP POLICY IF EXISTS "Hospital C select" ON public.cases_hospital_c;

CREATE POLICY "Hospital C select" ON public.cases_hospital_c
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '33333333-3333-3333-3333-333333333333')
        )
    );

CREATE POLICY "Hospital C insert" ON public.cases_hospital_c
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.hospital_id = '33333333-3333-3333-3333-333333333333')
        )
    );

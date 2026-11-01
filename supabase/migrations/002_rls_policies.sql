-- ============================================================
-- MEDIFED AI: Federated Medical Intelligence
-- Supabase Migration: 002_rls_policies.sql
-- Multi-Tenant Isolation & Storage Security
-- ============================================================

-- ── Enable Row-Level Security on all tables ─────────────────
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ── 1. Hospitals Policies ───────────────────────────────────
-- All authenticated users can view the hospitals list
CREATE POLICY "Authenticated users can view hospitals"
    ON public.hospitals FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can insert or update hospital definitions
CREATE POLICY "Only admins can modify hospitals"
    ON public.hospitals FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ── 2. Profiles Policies ────────────────────────────────────
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- ── 3. Diagnostic Cases Policies (Multi-Tenant Isolation) ───
-- Hospital Users can ONLY see cases belonging to their assigned hospital
CREATE POLICY "Hospital users can view own hospital cases"
    ON public.cases FOR SELECT
    TO authenticated
    USING (
        hospital_id IN (
            SELECT hospital_id FROM public.profiles
            WHERE profiles.id = auth.uid()
        )
    );

-- Admins can view all cases across all hospitals
CREATE POLICY "Admins can view all cases"
    ON public.cases FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Hospital users can insert cases for their hospital
CREATE POLICY "Hospital users can insert cases for their hospital"
    ON public.cases FOR INSERT
    TO authenticated
    WITH CHECK (
        hospital_id IN (
            SELECT hospital_id FROM public.profiles
            WHERE profiles.id = auth.uid()
        )
    );

-- Hospital users can update their own cases
CREATE POLICY "Hospital users can update own hospital cases"
    ON public.cases FOR UPDATE
    TO authenticated
    USING (
        hospital_id IN (
            SELECT hospital_id FROM public.profiles
            WHERE profiles.id = auth.uid()
        )
    );

-- ── 4. Audit Logs Policies ──────────────────────────────────
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- System and users can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- ── 5. Storage Buckets & Policies ───────────────────────────
-- Buckets: 'case-xrays', 'case-explanations'
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-xrays', 'case-xrays', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('case-explanations', 'case-explanations', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Hospital users can only access their hospital's folder
CREATE POLICY "Hospital users access own xray files"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id IN ('case-xrays', 'case-explanations') AND
        (storage.foldername(name))[1] = (
            SELECT hospital_id::text FROM public.profiles
            WHERE profiles.id = auth.uid()
        )
    );

-- Storage Policy: Admins can access all files in case buckets
CREATE POLICY "Admins access all xray files"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id IN ('case-xrays', 'case-explanations') AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

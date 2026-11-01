-- ============================================================
-- MEDIFED AI: Federated Medical Intelligence
-- Supabase Seed Data: seed.sql
-- Verified Research Entities & Clinical Cases
-- ============================================================

-- ── 1. Hospitals (Clients 1, 2, and 3 from Research Paper) ──
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


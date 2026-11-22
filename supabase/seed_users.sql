-- ============================================================
-- MEDIFED AI: Auth Users & Profiles Seeder
-- File: supabase/seed_users.sql
--
-- INSTRUCTIONS:
-- Run this in Supabase -> SQL Editor to create the 4 demo accounts
-- directly in Supabase Authentication and the public.profiles table.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure auto-profile trigger exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, hospital_id)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        CASE 
            WHEN new.email ILIKE '%admin%' THEN 'admin'
            ELSE 'hospital_user'
        END,
        CASE 
            WHEN new.email ILIKE '%hospital.a%' OR new.email ILIKE '%hospital_a%' THEN '11111111-1111-1111-1111-111111111111'::uuid
            WHEN new.email ILIKE '%hospital.b%' OR new.email ILIKE '%hospital_b%' THEN '22222222-2222-2222-2222-222222222222'::uuid
            WHEN new.email ILIKE '%hospital.c%' OR new.email ILIKE '%hospital_c%' THEN '33333333-3333-3333-3333-333333333333'::uuid
            ELSE '11111111-1111-1111-1111-111111111111'::uuid
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        hospital_id = EXCLUDED.hospital_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Seed the 4 Clinician & Coordinator accounts into auth.users and public.profiles
DO $$
DECLARE
    uid_admin   UUID := 'a0000000-0000-0000-0000-000000000001';
    uid_hosp_a  UUID := 'a0000000-0000-0000-0000-000000000002';
    uid_hosp_b  UUID := 'a0000000-0000-0000-0000-000000000003';
    uid_hosp_c  UUID := 'a0000000-0000-0000-0000-000000000004';
BEGIN
    -- Insert into auth.users with pre-confirmed emails and encrypted passwords
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES
    (
        '00000000-0000-0000-0000-000000000000',
        uid_admin,
        'authenticated',
        'authenticated',
        'admin@medifed.ai',
        crypt('Admin@12345', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Lead Consortium Coordinator"}'::jsonb,
        now(),
        now()
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uid_hosp_a,
        'authenticated',
        'authenticated',
        'hospital.a@medifed.ai',
        crypt('HospitalA@12345', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Pediatric Radiologist (Hospital A)"}'::jsonb,
        now(),
        now()
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uid_hosp_b,
        'authenticated',
        'authenticated',
        'hospital.b@medifed.ai',
        crypt('HospitalB@12345', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Staff Clinical Radiologist (Hospital B)"}'::jsonb,
        now(),
        now()
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uid_hosp_c,
        'authenticated',
        'authenticated',
        'hospital.c@medifed.ai',
        crypt('HospitalC@12345', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Senior Pulmonologist (Hospital C)"}'::jsonb,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        email_confirmed_at = EXCLUDED.email_confirmed_at;

    -- Insert into public.profiles
    INSERT INTO public.profiles (id, email, full_name, role, hospital_id)
    VALUES
    (
        uid_admin,
        'admin@medifed.ai',
        'Lead Consortium Coordinator',
        'admin',
        null
    ),
    (
        uid_hosp_a,
        'hospital.a@medifed.ai',
        'Pediatric Radiologist (Hospital A)',
        'hospital_user',
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        uid_hosp_b,
        'hospital.b@medifed.ai',
        'Staff Clinical Radiologist (Hospital B)',
        'hospital_user',
        '22222222-2222-2222-2222-222222222222'
    ),
    (
        uid_hosp_c,
        'hospital.c@medifed.ai',
        'Senior Pulmonologist (Hospital C)',
        'hospital_user',
        '33333333-3333-3333-3333-333333333333'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        hospital_id = EXCLUDED.hospital_id;

    -- Also link auth.identities if supported
    BEGIN
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        )
        VALUES
        (
            uid_admin,
            uid_admin,
            format('{"sub":"%s","email":"%s"}', uid_admin, 'admin@medifed.ai')::jsonb,
            'email',
            uid_admin::text,
            now(),
            now(),
            now()
        ),
        (
            uid_hosp_a,
            uid_hosp_a,
            format('{"sub":"%s","email":"%s"}', uid_hosp_a, 'hospital.a@medifed.ai')::jsonb,
            'email',
            uid_hosp_a::text,
            now(),
            now(),
            now()
        ),
        (
            uid_hosp_b,
            uid_hosp_b,
            format('{"sub":"%s","email":"%s"}', uid_hosp_b, 'hospital.b@medifed.ai')::jsonb,
            'email',
            uid_hosp_b::text,
            now(),
            now(),
            now()
        ),
        (
            uid_hosp_c,
            uid_hosp_c,
            format('{"sub":"%s","email":"%s"}', uid_hosp_c, 'hospital.c@medifed.ai')::jsonb,
            'email',
            uid_hosp_c::text,
            now(),
            now(),
            now()
        )
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

END $$;

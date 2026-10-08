-- Force update Almog's role to admin
-- This will definitely update the role in the database

-- First, let's see the current state
SELECT 'Before update:' as info;
SELECT id, email, role, preferred_name, status, updated_at 
FROM public.users 
WHERE email = 'almog.ankori@gmail.com';

-- Force update the role to admin
UPDATE public.users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'almog.ankori@gmail.com';

-- Check how many rows were affected
SELECT 'Rows updated:' as info;
SELECT 'Use the updated_at timestamp to verify the update worked' as note;

-- Verify the update worked
SELECT 'After update:' as info;
SELECT id, email, role, preferred_name, status, updated_at 
FROM public.users 
WHERE email = 'almog.ankori@gmail.com';

-- Also check by ID to be sure
SELECT 'By ID check:' as info;
SELECT id, email, role, preferred_name, status, updated_at 
FROM public.users 
WHERE id = 'f9f7e8e9-a571-40fa-978a-4da63d493e33';

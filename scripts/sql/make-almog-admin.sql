-- Make almog.ankori@gmail.com an admin user
-- This script will update your existing user account to have admin privileges

-- First, let's check if your user exists and what their current role is
SELECT 'Current user status:' as info;
SELECT id, email, role, preferred_name, status, created_at 
FROM public.users 
WHERE email = 'almog.ankori@gmail.com';

-- If the user exists, update them to admin role
UPDATE public.users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'almog.ankori@gmail.com';

-- Verify the update worked
SELECT 'User after admin update:' as info;
SELECT id, email, role, preferred_name, status, updated_at 
FROM public.users 
WHERE email = 'almog.ankori@gmail.com';

-- If the user doesn't exist, create them as an admin
-- (This will only run if the UPDATE above didn't affect any rows)
INSERT INTO public.users (id, email, role, preferred_name, status)
SELECT 
    gen_random_uuid(),
    'almog.ankori@gmail.com',
    'admin',
    'Almog Ankori',
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'almog.ankori@gmail.com'
);

-- Final verification
SELECT 'Final user status:' as info;
SELECT id, email, role, preferred_name, status, created_at, updated_at 
FROM public.users 
WHERE email = 'almog.ankori@gmail.com';

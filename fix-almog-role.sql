-- Fix Almog's Role - Check and Update to Admin
-- This script will check your current role and update it to admin

-- Step 1: Check your current user status
SELECT 'Current user status:' as info;
SELECT id, email, role, preferred_name, status, created_at, updated_at 
FROM public.users 
WHERE email = 'almog.ankori@gmail.com';

-- Step 2: Force update your role to admin
UPDATE public.users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'almog.ankori@gmail.com';

-- Step 3: Verify the update worked
SELECT 'User after role update:' as info;
SELECT id, email, role, preferred_name, status, updated_at 
FROM public.users 
WHERE email = 'almog.ankori@gmail.com';

-- Step 4: Check if the update affected any rows
SELECT 'Rows updated:' as info;
SELECT ROW_COUNT() as rows_affected;

-- Step 5: If no rows were updated, check if user exists at all
SELECT 'All users with similar email:' as info;
SELECT id, email, role, preferred_name, status 
FROM public.users 
WHERE email LIKE '%almog%' OR email LIKE '%ankori%';

-- Step 6: If user doesn't exist, create them as admin
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

-- Step 7: Final verification
SELECT 'Final user status:' as info;
SELECT id, email, role, preferred_name, status, created_at, updated_at 
FROM public.users 
WHERE email = 'almog.ankori@gmail.com';

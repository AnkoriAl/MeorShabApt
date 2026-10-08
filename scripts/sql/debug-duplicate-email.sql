-- Debug Duplicate Email Error
-- This script helps identify and fix the duplicate email issue

-- Step 1: Check what users currently exist
SELECT 'Current users in the database:' as info;
SELECT id, email, role, preferred_name, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- Step 2: Check for duplicate emails (if any exist)
SELECT 'Checking for duplicate emails:' as info;
SELECT email, COUNT(*) as count
FROM public.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 3: Check if a specific email exists (replace with your email)
-- Replace 'your-email@example.com' with the email you're trying to insert
SELECT 'Checking for specific email:' as info;
SELECT id, email, role, preferred_name, created_at
FROM public.users 
WHERE email = 'your-email@example.com';

-- Step 4: Show the unique constraint details
SELECT 'Unique constraint details:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND conname = 'users_email_key';

-- Step 5: Solutions (uncomment the one you need)

-- Option A: Use ON CONFLICT to handle duplicates gracefully
-- This will update the existing user if email already exists
/*
INSERT INTO public.users (id, email, role, preferred_name, status)
VALUES (
    gen_random_uuid(),
    'your-email@example.com',  -- Replace with your email
    'admin',  -- Replace with desired role
    'Your Name',  -- Replace with your name
    'active'
)
ON CONFLICT (email) DO UPDATE
SET 
    role = EXCLUDED.role,
    preferred_name = EXCLUDED.preferred_name,
    status = EXCLUDED.status,
    updated_at = NOW();
*/

-- Option B: Use ON CONFLICT DO NOTHING (ignore if email exists)
/*
INSERT INTO public.users (id, email, role, preferred_name, status)
VALUES (
    gen_random_uuid(),
    'your-email@example.com',  -- Replace with your email
    'admin',  -- Replace with desired role
    'Your Name',  -- Replace with your name
    'active'
)
ON CONFLICT (email) DO NOTHING;
*/

-- Option C: Update existing user to admin role
-- Replace 'your-email@example.com' with the email that already exists
/*
UPDATE public.users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'your-email@example.com';
*/

-- Option D: Clean up any duplicate rows (if they exist)
-- WARNING: This will delete duplicate rows, keeping only the most recent one
/*
DELETE FROM public.users
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) AS rn
        FROM public.users
    ) t
    WHERE t.rn > 1
);
*/

-- Step 6: Verify the fix worked
-- Run this after applying one of the solutions above
/*
SELECT 'Users after fix:' as info;
SELECT id, email, role, preferred_name, created_at 
FROM public.users 
WHERE email = 'your-email@example.com';
*/

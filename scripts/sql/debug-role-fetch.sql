-- Debug script to check if the role fetch is working
-- This will help us see what's happening when the app tries to fetch your user data

-- Check your current user in the database
SELECT 'Current user in database:' as info;
SELECT id, email, role, preferred_name, status, created_at, updated_at 
FROM public.users 
WHERE email = 'almog.ankori@gmail.com';

-- Check if there are any RLS issues by testing a simple select
SELECT 'Testing simple select:' as info;
SELECT COUNT(*) as user_count FROM public.users;

-- Check if your specific user ID exists
SELECT 'User by ID:' as info;
SELECT id, email, role, preferred_name, status 
FROM public.users 
WHERE id = 'f9f7e8e9-a571-40fa-978a-4da63d493e33';

-- Test the exact query the app would run
SELECT 'App query simulation:' as info;
SELECT id, email, role, preferred_name, status, created_at, updated_at
FROM public.users 
WHERE id = 'f9f7e8e9-a571-40fa-978a-4da63d493e33';

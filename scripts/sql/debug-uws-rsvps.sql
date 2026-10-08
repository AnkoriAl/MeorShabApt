-- Debug UWS RSVPs and Admin Access
-- This script will help debug why UWS RSVPs aren't showing up in the admin dashboard

-- Step 1: Check your current user and role
SELECT 'Current user status:' as info;
SELECT id, email, role, preferred_name, status, created_at, updated_at 
FROM public.users 
WHERE email = 'almog.ankori@gmail.com';

-- Step 2: Make sure you're an admin
UPDATE public.users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'almog.ankori@gmail.com';

-- Step 3: Verify admin role
SELECT 'After admin update:' as info;
SELECT id, email, role, preferred_name, status, updated_at 
FROM public.users 
WHERE email = 'almog.ankori@gmail.com';

-- Step 4: Check if there are any UWS RSVPs in the database
SELECT 'All UWS RSVPs:' as info;
SELECT id, participant_id, week_date, attending, rsvp_at, created_at
FROM public.uws_rsvps 
ORDER BY rsvp_at DESC;

-- Step 5: Check RLS policies on uws_rsvps table
SELECT 'RLS Policies on uws_rsvps:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'uws_rsvps';

-- Step 6: Test if you can read UWS RSVPs as admin
-- This should work if you're properly authenticated as admin
SELECT 'Testing admin access to UWS RSVPs:' as info;
SELECT COUNT(*) as total_rsvps FROM public.uws_rsvps;

-- Step 7: Check if RLS is enabled on the table
SELECT 'RLS status on uws_rsvps:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'uws_rsvps';

-- Step 8: If no RSVPs exist, create a test one
INSERT INTO public.uws_rsvps (participant_id, week_date, attending, rsvp_at)
SELECT 
    (SELECT id FROM public.users WHERE email = 'almog.ankori@gmail.com' LIMIT 1),
    NOW()::date + INTERVAL '1 day',
    true,
    NOW()
WHERE EXISTS (SELECT 1 FROM public.users WHERE email = 'almog.ankori@gmail.com')
AND NOT EXISTS (SELECT 1 FROM public.uws_rsvps WHERE participant_id = (SELECT id FROM public.users WHERE email = 'almog.ankori@gmail.com' LIMIT 1));

-- Step 9: Verify the test RSVP was created
SELECT 'After creating test RSVP:' as info;
SELECT id, participant_id, week_date, attending, rsvp_at, created_at
FROM public.uws_rsvps 
ORDER BY rsvp_at DESC;

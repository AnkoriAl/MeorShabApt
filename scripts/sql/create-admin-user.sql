-- Create Admin User Script
-- This script will help you create an admin user in your Supabase database

-- First, let's see what users currently exist
SELECT 'Current users in the database:' as info;
SELECT id, email, role, preferred_name, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- To create an admin user, you have a few options:

-- Option 1: Update an existing user to admin role
-- Replace 'your-email@example.com' with the actual email of the user you want to make admin
-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- Option 2: Insert a new admin user directly
-- Replace the values below with your desired admin details
-- INSERT INTO public.users (id, email, role, preferred_name, status)
-- VALUES (
--   gen_random_uuid(),  -- This will generate a random UUID
--   'admin@example.com',  -- Replace with your admin email
--   'admin',  -- This makes them an admin
--   'Admin User',  -- Replace with preferred name
--   'active'
-- );

-- Option 3: If you know the user's auth.uid(), you can update by ID
-- Replace 'user-uuid-here' with the actual user ID from auth.users
-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE id = 'user-uuid-here';

-- After running one of the above options, verify the admin was created:
-- SELECT 'Admin users after update:' as info;
-- SELECT id, email, role, preferred_name, created_at 
-- FROM public.users 
-- WHERE role = 'admin';

-- Instructions:
-- 1. Uncomment ONE of the options above (remove the -- at the beginning of the lines)
-- 2. Replace the placeholder values with your actual information
-- 3. Run the script
-- 4. The user will then have admin access to the application

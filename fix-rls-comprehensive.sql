-- Comprehensive RLS Policy Fix for Shabbat Apartment Tracker
-- This script fixes the access control issues preventing data loading

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Allow user signup" ON public.users;
DROP POLICY IF EXISTS "Users can read own month logs" ON public.month_logs;
DROP POLICY IF EXISTS "Admins can read all month logs" ON public.month_logs;
DROP POLICY IF EXISTS "Allow month log operations" ON public.month_logs;
DROP POLICY IF EXISTS "Users can read own meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Admins can manage meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Allow meal log operations" ON public.meal_logs;
DROP POLICY IF EXISTS "Users can read own learning sessions" ON public.learning_sessions;
DROP POLICY IF EXISTS "Admins can manage learning sessions" ON public.learning_sessions;
DROP POLICY IF EXISTS "Allow learning session operations" ON public.learning_sessions;
DROP POLICY IF EXISTS "Everyone can read shabbatons" ON public.shabbatons;
DROP POLICY IF EXISTS "Admins can manage shabbatons" ON public.shabbatons;
DROP POLICY IF EXISTS "Allow shabbaton operations" ON public.shabbatons;
DROP POLICY IF EXISTS "Users can read own attendances" ON public.attendances;
DROP POLICY IF EXISTS "Admins can manage attendances" ON public.attendances;
DROP POLICY IF EXISTS "Allow attendance operations" ON public.attendances;
DROP POLICY IF EXISTS "Users can manage own UWS RSVPs" ON public.uws_rsvps;
DROP POLICY IF EXISTS "Admins can read all UWS RSVPs" ON public.uws_rsvps;

-- Create comprehensive policies for users table
-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own data (for signup)
CREATE POLICY "Allow user signup" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to read all users
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to manage all users
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create comprehensive policies for month_logs table
-- Allow users to read their own month logs
CREATE POLICY "Users can read own month logs" ON public.month_logs
  FOR SELECT USING (auth.uid() = participant_id);

-- Allow users to insert their own month logs
CREATE POLICY "Users can insert own month logs" ON public.month_logs
  FOR INSERT WITH CHECK (auth.uid() = participant_id);

-- Allow users to update their own month logs
CREATE POLICY "Users can update own month logs" ON public.month_logs
  FOR UPDATE USING (auth.uid() = participant_id);

-- Allow admins to read all month logs
CREATE POLICY "Admins can read all month logs" ON public.month_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to manage all month logs
CREATE POLICY "Admins can manage month logs" ON public.month_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create comprehensive policies for meal_logs table
-- Allow users to read their own meal logs
CREATE POLICY "Users can read own meal logs" ON public.meal_logs
  FOR SELECT USING (auth.uid() = participant_id);

-- Allow users to insert their own meal logs
CREATE POLICY "Users can insert own meal logs" ON public.meal_logs
  FOR INSERT WITH CHECK (auth.uid() = participant_id);

-- Allow users to update their own meal logs
CREATE POLICY "Users can update own meal logs" ON public.meal_logs
  FOR UPDATE USING (auth.uid() = participant_id);

-- Allow admins to read all meal logs
CREATE POLICY "Admins can read all meal logs" ON public.meal_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to manage all meal logs
CREATE POLICY "Admins can manage meal logs" ON public.meal_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create comprehensive policies for learning_sessions table
-- Allow users to read their own learning sessions
CREATE POLICY "Users can read own learning sessions" ON public.learning_sessions
  FOR SELECT USING (auth.uid() = participant_id);

-- Allow users to insert their own learning sessions
CREATE POLICY "Users can insert own learning sessions" ON public.learning_sessions
  FOR INSERT WITH CHECK (auth.uid() = participant_id);

-- Allow users to update their own learning sessions
CREATE POLICY "Users can update own learning sessions" ON public.learning_sessions
  FOR UPDATE USING (auth.uid() = participant_id);

-- Allow admins to read all learning sessions
CREATE POLICY "Admins can read all learning sessions" ON public.learning_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to manage all learning sessions
CREATE POLICY "Admins can manage learning sessions" ON public.learning_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create comprehensive policies for shabbatons table
-- Allow everyone to read shabbatons
CREATE POLICY "Everyone can read shabbatons" ON public.shabbatons
  FOR SELECT USING (true);

-- Allow admins to manage shabbatons
CREATE POLICY "Admins can manage shabbatons" ON public.shabbatons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create comprehensive policies for attendances table
-- Allow users to read their own attendances
CREATE POLICY "Users can read own attendances" ON public.attendances
  FOR SELECT USING (auth.uid() = participant_id);

-- Allow users to insert their own attendances
CREATE POLICY "Users can insert own attendances" ON public.attendances
  FOR INSERT WITH CHECK (auth.uid() = participant_id);

-- Allow users to update their own attendances
CREATE POLICY "Users can update own attendances" ON public.attendances
  FOR UPDATE USING (auth.uid() = participant_id);

-- Allow admins to read all attendances
CREATE POLICY "Admins can read all attendances" ON public.attendances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to manage all attendances
CREATE POLICY "Admins can manage attendances" ON public.attendances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create comprehensive policies for uws_rsvps table
-- Allow users to manage their own UWS RSVPs
CREATE POLICY "Users can manage own UWS RSVPs" ON public.uws_rsvps
  FOR ALL USING (auth.uid() = participant_id);

-- Allow admins to read all UWS RSVPs
CREATE POLICY "Admins can read all UWS RSVPs" ON public.uws_rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verify RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.month_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shabbatons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uws_rsvps ENABLE ROW LEVEL SECURITY;

-- Test queries to verify policies work
SELECT 'RLS Policies created successfully' as status;

-- Show all policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

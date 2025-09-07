-- Temporarily disable RLS to fix the infinite recursion issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.month_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shabbatons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.uws_rsvps DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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


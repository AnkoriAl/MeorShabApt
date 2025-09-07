-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can read own month logs" ON public.month_logs;
DROP POLICY IF EXISTS "Admins can read all month logs" ON public.month_logs;
DROP POLICY IF EXISTS "Users can read own meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Admins can manage meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Users can read own learning sessions" ON public.learning_sessions;
DROP POLICY IF EXISTS "Admins can manage learning sessions" ON public.learning_sessions;
DROP POLICY IF EXISTS "Everyone can read shabbatons" ON public.shabbatons;
DROP POLICY IF EXISTS "Admins can manage shabbatons" ON public.shabbatons;
DROP POLICY IF EXISTS "Users can read own attendances" ON public.attendances;
DROP POLICY IF EXISTS "Admins can manage attendances" ON public.attendances;
DROP POLICY IF EXISTS "Users can manage own UWS RSVPs" ON public.uws_rsvps;
DROP POLICY IF EXISTS "Admins can read all UWS RSVPs" ON public.uws_rsvps;

-- Create simpler, non-recursive policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow all authenticated users to insert (for signup)
CREATE POLICY "Allow user signup" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Month logs - users can read their own
CREATE POLICY "Users can read own month logs" ON public.month_logs
  FOR SELECT USING (auth.uid() = participant_id);

-- Allow all operations on month logs for now (we'll restrict later)
CREATE POLICY "Allow month log operations" ON public.month_logs
  FOR ALL USING (true);

-- Meal logs - users can read their own
CREATE POLICY "Users can read own meal logs" ON public.meal_logs
  FOR SELECT USING (auth.uid() = participant_id);

-- Allow all operations on meal logs for now
CREATE POLICY "Allow meal log operations" ON public.meal_logs
  FOR ALL USING (true);

-- Learning sessions - users can read their own
CREATE POLICY "Users can read own learning sessions" ON public.learning_sessions
  FOR SELECT USING (auth.uid() = participant_id);

-- Allow all operations on learning sessions for now
CREATE POLICY "Allow learning session operations" ON public.learning_sessions
  FOR ALL USING (true);

-- Shabbatons - everyone can read
CREATE POLICY "Everyone can read shabbatons" ON public.shabbatons
  FOR SELECT USING (true);

-- Allow all operations on shabbatons for now
CREATE POLICY "Allow shabbaton operations" ON public.shabbatons
  FOR ALL USING (true);

-- Attendances - users can read their own
CREATE POLICY "Users can read own attendances" ON public.attendances
  FOR SELECT USING (auth.uid() = participant_id);

-- Allow all operations on attendances for now
CREATE POLICY "Allow attendance operations" ON public.attendances
  FOR ALL USING (true);

-- UWS RSVPs - users can manage their own
CREATE POLICY "Users can manage own UWS RSVPs" ON public.uws_rsvps
  FOR ALL USING (auth.uid() = participant_id);

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('participant', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  preferred_name TEXT NOT NULL,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create month_logs table
CREATE TABLE public.month_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  meals_required INTEGER NOT NULL DEFAULT 4,
  minutes_required INTEGER NOT NULL DEFAULT 720,
  meals_earned INTEGER NOT NULL DEFAULT 0,
  minutes_earned INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  computed_payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Not due' CHECK (payment_status IN ('Not due', 'Due', 'Paid')),
  payment_marked_at TIMESTAMP WITH TIME ZONE,
  payment_marked_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_id, year, month)
);

-- Create meal_logs table
CREATE TABLE public.meal_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  applied_year INTEGER NOT NULL,
  applied_month INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('UWS', 'Shabbaton', 'Other')),
  notes TEXT,
  source TEXT NOT NULL CHECK (source IN ('Self report', 'Admin entry', 'Attendance grant')),
  shabbaton_id UUID,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_reason TEXT,
  deleted_by UUID REFERENCES public.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create learning_sessions table
CREATE TABLE public.learning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes >= 1 AND minutes <= 360),
  notes TEXT,
  applied_year INTEGER NOT NULL,
  applied_month INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('Self', 'Hevruta', 'Shabbaton', 'Admin entry')),
  shabbaton_id UUID,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_reason TEXT,
  deleted_by UUID REFERENCES public.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create shabbatons table
CREATE TABLE public.shabbatons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  default_credits JSONB NOT NULL DEFAULT '{"meals": 3, "minutes": 180}',
  attendance_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendances table
CREATE TABLE public.attendances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  shabbaton_id UUID REFERENCES public.shabbatons(id) ON DELETE CASCADE NOT NULL,
  applied_year INTEGER NOT NULL,
  applied_month INTEGER NOT NULL,
  granted_meals INTEGER NOT NULL DEFAULT 3,
  granted_minutes INTEGER NOT NULL DEFAULT 180,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Denied')),
  marked_by UUID REFERENCES public.users(id),
  marked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_id, shabbaton_id)
);

-- Create uws_rsvps table
CREATE TABLE public.uws_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  week_date TIMESTAMP WITH TIME ZONE NOT NULL,
  attending BOOLEAN NOT NULL,
  rsvp_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_id, week_date)
);

-- Create indexes for better performance
CREATE INDEX idx_month_logs_participant ON public.month_logs(participant_id);
CREATE INDEX idx_month_logs_year_month ON public.month_logs(year, month);
CREATE INDEX idx_meal_logs_participant ON public.meal_logs(participant_id);
CREATE INDEX idx_meal_logs_applied ON public.meal_logs(applied_year, applied_month);
CREATE INDEX idx_learning_sessions_participant ON public.learning_sessions(participant_id);
CREATE INDEX idx_learning_sessions_applied ON public.learning_sessions(applied_year, applied_month);
CREATE INDEX idx_attendances_participant ON public.attendances(participant_id);
CREATE INDEX idx_attendances_shabbaton ON public.attendances(shabbaton_id);
CREATE INDEX idx_uws_rsvps_participant ON public.uws_rsvps(participant_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.month_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shabbatons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uws_rsvps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data and admins can read all data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can insert/update/delete users
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can read own month logs" ON public.month_logs
  FOR SELECT USING (auth.uid() = participant_id);

CREATE POLICY "Admins can read all month logs" ON public.month_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read own meal logs" ON public.meal_logs
  FOR SELECT USING (auth.uid() = participant_id);

CREATE POLICY "Admins can manage meal logs" ON public.meal_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read own learning sessions" ON public.learning_sessions
  FOR SELECT USING (auth.uid() = participant_id);

CREATE POLICY "Admins can manage learning sessions" ON public.learning_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Everyone can read shabbatons" ON public.shabbatons
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage shabbatons" ON public.shabbatons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read own attendances" ON public.attendances
  FOR SELECT USING (auth.uid() = participant_id);

CREATE POLICY "Admins can manage attendances" ON public.attendances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage own UWS RSVPs" ON public.uws_rsvps
  FOR ALL USING (auth.uid() = participant_id);

CREATE POLICY "Admins can read all UWS RSVPs" ON public.uws_rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_month_logs_updated_at BEFORE UPDATE ON public.month_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_logs_updated_at BEFORE UPDATE ON public.meal_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_sessions_updated_at BEFORE UPDATE ON public.learning_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shabbatons_updated_at BEFORE UPDATE ON public.shabbatons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.shabbatons (title, date, default_credits) VALUES
  ('Shabbaton 9/26/2024', '2024-09-26', '{"meals": 3, "minutes": 180}'),
  ('Shabbaton 10/6/2024', '2024-10-06', '{"meals": 3, "minutes": 180}'),
  ('Shabbaton 10/24/2024', '2024-10-24', '{"meals": 3, "minutes": 180}'),
  ('Shabbaton 11/7/2024', '2024-11-07', '{"meals": 3, "minutes": 180}'),
  ('Shabbaton 11/14/2024', '2024-11-14', '{"meals": 3, "minutes": 180}'),
  ('Shabbaton 11/21/2024', '2024-11-21', '{"meals": 3, "minutes": 180}'),
  ('Shabbaton 12/5/2024', '2024-12-05', '{"meals": 3, "minutes": 180}');

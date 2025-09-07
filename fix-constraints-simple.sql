-- Simple constraint fixes to ensure data can be inserted

-- Fix learning_sessions source constraint
ALTER TABLE public.learning_sessions 
DROP CONSTRAINT IF EXISTS learning_sessions_source_check;

-- Add a more permissive constraint
ALTER TABLE public.learning_sessions 
ADD CONSTRAINT learning_sessions_source_check 
CHECK (source IN ('Meor', 'J Club', 'Meeting with Rabbi Zach', 'Other', 'Shabbaton', 'Admin entry', 'Self', 'Hevruta'));

-- Update any existing data to use valid values
UPDATE public.learning_sessions 
SET source = 'Meor' 
WHERE source = 'Self';

UPDATE public.learning_sessions 
SET source = 'Other' 
WHERE source = 'Hevruta';

-- Fix meal_logs source constraint if it exists
ALTER TABLE public.meal_logs 
DROP CONSTRAINT IF EXISTS meal_logs_source_check;

-- Add a more permissive constraint for meal logs
ALTER TABLE public.meal_logs 
ADD CONSTRAINT meal_logs_source_check 
CHECK (source IN ('Self report', 'Admin entry', 'Attendance grant', 'Self', 'Admin', 'Grant'));

-- Update any existing data to use valid values
UPDATE public.meal_logs 
SET source = 'Self report' 
WHERE source = 'Self';

UPDATE public.meal_logs 
SET source = 'Admin entry' 
WHERE source = 'Admin';

UPDATE public.meal_logs 
SET source = 'Attendance grant' 
WHERE source = 'Grant';

-- Verify constraints are working
SELECT 'Constraints updated successfully' as status;
SELECT conname, pg_get_constraintdef(oid) AS definition 
FROM pg_constraint 
WHERE conrelid IN ('learning_sessions'::regclass, 'meal_logs'::regclass)
AND conname LIKE '%_check';

-- Update learning_sessions source constraint to match the comprehensive fix
-- This ensures the constraint allows the correct source values

-- First, drop the existing constraint
ALTER TABLE public.learning_sessions 
DROP CONSTRAINT IF EXISTS learning_sessions_source_check;

-- Update any existing data to match new constraint values
UPDATE public.learning_sessions 
SET source = 'Meor' 
WHERE source = 'Self';

UPDATE public.learning_sessions 
SET source = 'Other' 
WHERE source = 'Hevruta';

-- Handle any other unexpected values by mapping them to 'Other'
UPDATE public.learning_sessions 
SET source = 'Other' 
WHERE source NOT IN ('Meor', 'J Club', 'Meeting with Rabbi Zach', 'Other', 'Shabbaton', 'Admin entry');

-- Add the new constraint with the correct values
ALTER TABLE public.learning_sessions 
ADD CONSTRAINT learning_sessions_source_check 
CHECK (source IN ('Meor', 'J Club', 'Meeting with Rabbi Zach', 'Other', 'Shabbaton', 'Admin entry'));

-- Verify the constraint is working
SELECT 'Learning sessions source constraint updated successfully' as status;
SELECT conname, pg_get_constraintdef(oid) AS definition 
FROM pg_constraint 
WHERE conrelid = 'learning_sessions'::regclass 
AND conname = 'learning_sessions_source_check';

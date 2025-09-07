-- Update the learning_sessions source constraint to include new values
-- This script updates the existing constraint to allow the new source values

-- First, drop the existing constraint
ALTER TABLE public.learning_sessions 
DROP CONSTRAINT IF EXISTS learning_sessions_source_check;

-- Add the new constraint with updated values
ALTER TABLE public.learning_sessions 
ADD CONSTRAINT learning_sessions_source_check 
CHECK (source IN ('Meor', 'J Club', 'Meeting with Rabbi Zach', 'Other', 'Shabbaton', 'Admin entry'));

-- Update any existing records that might have old values
-- Convert 'Self' to 'Meor' and 'Hevruta' to 'Other'
UPDATE public.learning_sessions 
SET source = 'Meor' 
WHERE source = 'Self';

UPDATE public.learning_sessions 
SET source = 'Other' 
WHERE source = 'Hevruta';

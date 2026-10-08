-- Comprehensive fix for learning_sessions_source_check constraint violation

-- Step 1: First, let's see what we're dealing with
SELECT 'Current source values in the table:' as info;
SELECT source, COUNT(*) as count 
FROM public.learning_sessions 
GROUP BY source 
ORDER BY source;

-- Step 2: Show current constraint
SELECT 'Current constraint definition:' as info;
SELECT conname, pg_get_constraintdef(oid) AS definition 
FROM pg_constraint 
WHERE conrelid = 'learning_sessions'::regclass 
AND conname = 'learning_sessions_source_check';

-- Step 3: Temporarily disable the constraint to allow data updates
ALTER TABLE public.learning_sessions 
DROP CONSTRAINT IF EXISTS learning_sessions_source_check;

-- Step 4: Update existing data to match new constraint values
-- Map old values to new values
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

-- Step 5: Verify all data is now valid
SELECT 'Source values after update:' as info;
SELECT source, COUNT(*) as count 
FROM public.learning_sessions 
GROUP BY source 
ORDER BY source;

-- Step 6: Add the new constraint
ALTER TABLE public.learning_sessions 
ADD CONSTRAINT learning_sessions_source_check 
CHECK (source IN ('Meor', 'J Club', 'Meeting with Rabbi Zach', 'Other', 'Shabbaton', 'Admin entry'));

-- Step 7: Verify the constraint is working
SELECT 'Constraint added successfully' as info;
SELECT conname, pg_get_constraintdef(oid) AS definition 
FROM pg_constraint 
WHERE conrelid = 'learning_sessions'::regclass 
AND conname = 'learning_sessions_source_check';

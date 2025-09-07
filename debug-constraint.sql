-- Debug script for learning_sessions_source_check constraint violation

-- 1. Check what source values currently exist in the table
SELECT source, COUNT(*) as count 
FROM public.learning_sessions 
GROUP BY source 
ORDER BY source;

-- 2. Show the current constraint definition
SELECT conname, pg_get_constraintdef(oid) AS definition 
FROM pg_constraint 
WHERE conrelid = 'learning_sessions'::regclass 
AND conname = 'learning_sessions_source_check';

-- 3. Find rows that violate the constraint (if any exist)
SELECT id, source, started_at, created_at
FROM public.learning_sessions 
WHERE source NOT IN ('Meor', 'J Club', 'Meeting with Rabbi Zach', 'Other', 'Shabbaton', 'Admin entry')
LIMIT 10;

-- 4. Check if there are any NULL source values
SELECT COUNT(*) as null_sources
FROM public.learning_sessions 
WHERE source IS NULL;

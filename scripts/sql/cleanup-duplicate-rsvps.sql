-- Clean up duplicate UWS RSVPs
-- This script will remove duplicate RSVPs for the same participant and week,
-- keeping only the most recent one

-- First, let's see what duplicates exist
SELECT 'Current RSVPs before cleanup:' as info;
SELECT 
    participant_id,
    week_date,
    attending,
    rsvp_at,
    COUNT(*) as count
FROM public.uws_rsvps 
GROUP BY participant_id, week_date, attending, rsvp_at
HAVING COUNT(*) > 1
ORDER BY participant_id, week_date;

-- Show all RSVPs grouped by participant and week
SELECT 'RSVPs grouped by participant and week:' as info;
SELECT 
    participant_id,
    DATE(week_date) as week_date_only,
    COUNT(*) as total_rsvps,
    STRING_AGG(id::text, ', ') as rsvp_ids
FROM public.uws_rsvps 
GROUP BY participant_id, DATE(week_date)
HAVING COUNT(*) > 1
ORDER BY participant_id, week_date_only;

-- Delete duplicate RSVPs, keeping only the most recent one for each participant/week
WITH ranked_rsvps AS (
    SELECT 
        id,
        participant_id,
        week_date,
        ROW_NUMBER() OVER (
            PARTITION BY participant_id, DATE(week_date) 
            ORDER BY rsvp_at DESC
        ) as rn
    FROM public.uws_rsvps
)
DELETE FROM public.uws_rsvps 
WHERE id IN (
    SELECT id 
    FROM ranked_rsvps 
    WHERE rn > 1
);

-- Show results after cleanup
SELECT 'RSVPs after cleanup:' as info;
SELECT 
    participant_id,
    week_date,
    attending,
    rsvp_at,
    COUNT(*) as count
FROM public.uws_rsvps 
GROUP BY participant_id, week_date, attending, rsvp_at
ORDER BY participant_id, week_date;

-- Show final count
SELECT 'Total RSVPs after cleanup:' as info;
SELECT COUNT(*) as total_rsvps FROM public.uws_rsvps;

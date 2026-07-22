-- Add "Update Ready" status to tasks table
-- Run this against your Supabase database

-- 1. Drop the existing CHECK constraint (name may vary - check your actual constraint name)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- 2. Re-add with the new status included
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('Pending', 'Working on it', 'Review', 'Stuck', 'Completed', 'Update Ready'));

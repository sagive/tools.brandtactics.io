-- 1. Enable pg_cron extension (requires superuser, must be run in Supabase SQL editor)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    type TEXT NOT NULL, -- 'comment', 'reminder', 'due_date', 'system'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Note: We omit foreign keys to `users` because sometimes users are soft-tracked by email
-- Create index for faster querying by user
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON public.notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 3. Create Scheduled Reminders Table
CREATE TABLE IF NOT EXISTS public.scheduled_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    task_title TEXT NOT NULL,
    action_url TEXT NOT NULL,
    trigger_time TIMESTAMP WITH TIME ZONE NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_trigger_time ON public.scheduled_reminders(trigger_time);

-- 4. Enable RLS but allow authenticated access
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
    FOR INSERT WITH CHECK (true); -- We'll allow inserts for now to allow commenting users to notify others

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Reminders policies
CREATE POLICY "Users can manage their own reminders" ON public.scheduled_reminders
    FOR ALL USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert reminders" ON public.scheduled_reminders
    FOR INSERT WITH CHECK (true);

-- 5. Creating Background Jobs using pg_cron

-- A. Process Reminders Job (Runs every 5 minutes)
SELECT cron.schedule(
  'process-reminders',
  '*/5 * * * *',
  $$
  INSERT INTO public.notifications (user_email, title, message, action_url, type)
  SELECT 
    user_email, 
    'Task Reminder', 
    'Reminder for task: ' || task_title,
    action_url,
    'reminder'
  FROM public.scheduled_reminders
  WHERE trigger_time <= now() AND processed = false;
  
  UPDATE public.scheduled_reminders
  SET processed = true
  WHERE trigger_time <= now() AND processed = false;
  $$
);

-- B. Process 1-Day Due Date Alerts (Runs daily at 08:00 AM UTC)
-- Assuming tasks.end_date is just a DATE type or timestamp.
SELECT cron.schedule(
  'process-due-dates',
  '0 8 * * *',
  $$
  INSERT INTO public.notifications (user_email, title, message, action_url, type)
  SELECT 
    users.email,
    'Task Due Tomorrow',
    'Task "' || title || '" is due tomorrow.',
    '/clients/' || client_id || '/tasks?task=' || id,
    'due_date'
  FROM public.tasks
  JOIN public.users ON users.full_name = tasks.assignee OR users.full_name = tasks.requester OR users.email = tasks.assignee OR users.email = tasks.requester
  WHERE end_date::date = (now() + interval '1 day')::date
  AND status != 'Completed';
  $$
);

-- C. Cleanup Old Read Notifications (Runs daily at midnight)
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 0 * * *',
  $$
  DELETE FROM public.notifications 
  WHERE is_read = true AND created_at < now() - interval '30 days';
  $$
);

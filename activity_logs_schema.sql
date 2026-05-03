-- Activity Logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read and insert logs
DROP POLICY IF EXISTS "Allow all authenticated users access to activity_logs" ON public.activity_logs;
CREATE POLICY "Allow all authenticated users access to activity_logs" 
ON public.activity_logs FOR ALL 
USING (auth.role() = 'authenticated');

-- Function to maintain 10,000 entries limit
CREATE OR REPLACE FUNCTION public.maintain_activity_log_limit()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.activity_logs
  WHERE id IN (
    SELECT id
    FROM public.activity_logs
    ORDER BY created_at DESC
    OFFSET 10000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after each insert
DROP TRIGGER IF EXISTS tr_maintain_activity_log_limit ON public.activity_logs;
CREATE TRIGGER tr_maintain_activity_log_limit
AFTER INSERT ON public.activity_logs
FOR EACH STATEMENT
EXECUTE FUNCTION public.maintain_activity_log_limit();

-- Create task_templates table for reusable task description templates
CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated users access to task_templates" ON public.task_templates;
CREATE POLICY "Allow all authenticated users access to task_templates"
  ON public.task_templates FOR ALL USING (auth.role() = 'authenticated');

-- Create agency_tools table
CREATE TABLE IF NOT EXISTS public.agency_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  icon_name TEXT DEFAULT 'Blocks', -- Standard default icon
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.agency_tools ENABLE ROW LEVEL SECURITY;

-- Policy (Authenticated users can manage tools)
CREATE POLICY "Allow all authenticated users access to agency_tools" 
ON public.agency_tools FOR ALL 
USING (auth.role() = 'authenticated');

-- Seed initial tools
INSERT INTO public.agency_tools (name, url, category, icon_name)
VALUES 
  ('Google Analytics', 'https://analytics.google.com', 'Analytics', 'ChartNoAxesCombined'),
  ('Google Search Console', 'https://search.google.com/search-console', 'SEO', 'Search'),
  ('Ahrefs', 'https://ahrefs.com', 'SEO', 'TrendingUp'),
  ('Figma', 'https://figma.com', 'Design', 'Blocks'),
  ('Mailchimp', 'https://mailchimp.com', 'Marketing', 'Send'),
  ('HubSpot', 'https://hubspot.com', 'Marketing', 'MousePointerClick');

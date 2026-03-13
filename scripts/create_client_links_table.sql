-- Create table for storing client external links (Competitors, Resources, etc)
CREATE TABLE IF NOT EXISTS public.client_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('competitor', 'resource')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Depending on your Supabase RLS rules, you may need to add policies
-- to allow your authenticated users/service role to insert/select/update/delete.

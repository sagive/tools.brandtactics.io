-- Backlinks Content Type Migration

-- 1. Backlink Categories Table
CREATE TABLE IF NOT EXISTS public.backlink_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  rank INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Global Backlinks Table
CREATE TABLE IF NOT EXISTS public.backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_name TEXT NOT NULL,
  url TEXT NOT NULL,
  category_id UUID REFERENCES public.backlink_categories(id) ON DELETE SET NULL,
  global_username TEXT,
  global_password TEXT,
  rank INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Client-Specific Backlinks Table (Join Table)
CREATE TABLE IF NOT EXISTS public.client_backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  backlink_id UUID REFERENCES public.backlinks(id) ON DELETE CASCADE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  client_username TEXT,
  client_password TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(client_id, backlink_id)
);

-- RLS POLICIES
ALTER TABLE public.backlink_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_backlinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users access to backlink_categories" 
  ON public.backlink_categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users access to backlinks" 
  ON public.backlinks FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users access to client_backlinks" 
  ON public.client_backlinks FOR ALL USING (auth.role() = 'authenticated');

-- Default Categories
INSERT INTO public.backlink_categories (name, rank) VALUES 
  ('General', 0),
  ('Business Directory', 1),
  ('Guest Post', 2),
  ('Profile', 3),
  ('Social', 4)
ON CONFLICT (name) DO NOTHING;

-- BrandTactics SaaS Supabase Schema

-- Users table is managed by Supabase Auth (auth.users).
-- We'll create a public 'users' profile table that ties to auth.users if needed, or just let auth.users handle it.
-- Based on the prompt: users: id (uuid), email, role ('admin' or 'staff')
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  type TEXT, -- e.g., 'Retainer', 'Project'
  retainer_amount INTEGER DEFAULT 0,
  monthly_fee INTEGER DEFAULT 0,
  joined_date DATE,
  basic_tools TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Working on it', 'Review', 'Stuck', 'Completed')),
  assignee TEXT,
  start_date DATE,
  end_date DATE,
  estimate_hours INTEGER DEFAULT 0,
  requester TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  comments JSONB DEFAULT '[]'::jsonb, -- [{user: string, text: string, timestamp: date}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Articles table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published')),
  content TEXT,
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Email updates table
CREATE TABLE IF NOT EXISTS public.email_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Queued' CHECK (status IN ('Queued', 'Delivered', 'Failed')),
  sent_date TIMESTAMP WITH TIME ZONE,
  open_rate NUMERIC DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES (Simple setup: authenticated users can do everything since it's an internal tool)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users access to users" ON public.users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users access to clients" ON public.clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users access to tasks" ON public.tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users access to articles" ON public.articles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users access to email_updates" ON public.email_updates FOR ALL USING (auth.role() = 'authenticated');

-- Trigger to create a public user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

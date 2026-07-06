-- BrandTactics Profiles Migration

-- 1. Profiles main data
CREATE TABLE IF NOT EXISTS public.profiles_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  gender TEXT,
  image_url TEXT,
  rank INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Profile credentials
CREATE TABLE IF NOT EXISTS public.profile_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles_data(id) ON DELETE CASCADE,
  username TEXT,
  password TEXT,
  login_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.profiles_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_credentials ENABLE ROW LEVEL SECURITY;

-- 4. Simple access policies for authenticated users
DROP POLICY IF EXISTS "Allow all authenticated users access to profiles_data" ON public.profiles_data;
CREATE POLICY "Allow all authenticated users access to profiles_data" ON public.profiles_data FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all authenticated users access to profile_credentials" ON public.profile_credentials;
CREATE POLICY "Allow all authenticated users access to profile_credentials" ON public.profile_credentials FOR ALL USING (auth.role() = 'authenticated');

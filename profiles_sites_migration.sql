/* 
  Profile Sites & Credentials Update
  -----------------------------------
  1. Creates 'profile_sites' for global platform management (Facebook, etc.)
  2. Updates 'profile_credentials' to link to a site.
*/

-- 1. Create Profile Sites Table
CREATE TABLE IF NOT EXISTS public.profile_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rank INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add site_id to Profile Credentials
ALTER TABLE public.profile_credentials 
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.profile_sites(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.profile_sites ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Profile Sites
CREATE POLICY "Enable all for authenticated users" ON public.profile_sites
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Default initial sites (Optional)
INSERT INTO public.profile_sites (name, rank) VALUES 
('Facebook', 1),
('Instagram', 2),
('Twitter/X', 3),
('LinkedIn', 4),
('TikTok', 5)
ON CONFLICT DO NOTHING;

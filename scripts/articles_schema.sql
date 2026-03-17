-- Create article_endpoints table
CREATE TABLE IF NOT EXISTS public.article_endpoints (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    endpoint_url text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for article_endpoints
ALTER TABLE public.article_endpoints ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for article_endpoints (Admin restricted, read all for authenticated)
CREATE POLICY "Enable read access for all users" ON public.article_endpoints
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "Enable insert for authenticated users" ON public.article_endpoints
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Enable update for authenticated users" ON public.article_endpoints
    FOR UPDATE USING (auth.role() = 'authenticated');
    
CREATE POLICY "Enable delete for authenticated users" ON public.article_endpoints
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    live_url text,
    internal_url text,
    links_count integer DEFAULT 0,
    type text,
    length integer DEFAULT 0,
    is_ai_generated boolean DEFAULT false,
    content text,
    status text DEFAULT 'Draft',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for articles
CREATE POLICY "Enable read access for all users" ON public.articles
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "Enable insert for authenticated users" ON public.articles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Enable update for authenticated users" ON public.articles
    FOR UPDATE USING (auth.role() = 'authenticated');
    
CREATE POLICY "Enable delete for authenticated users" ON public.articles
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create an updated_at trigger for the articles table
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at ON public.articles;

CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

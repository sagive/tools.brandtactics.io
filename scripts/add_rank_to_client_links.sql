-- Add rank and two_fa columns to client_links table
ALTER TABLE public.client_links ADD COLUMN IF NOT EXISTS rank INT DEFAULT 0;
ALTER TABLE public.client_links ADD COLUMN IF NOT EXISTS two_fa TEXT DEFAULT '';

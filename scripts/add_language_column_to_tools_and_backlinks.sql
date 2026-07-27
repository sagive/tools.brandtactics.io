-- Add language column to agency_tools and backlinks tables
ALTER TABLE public.agency_tools ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'english';
ALTER TABLE public.backlinks ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'english';

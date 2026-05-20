-- Migration: Add custom client settings columns and article categories array
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS article_categories TEXT,
ADD COLUMN IF NOT EXISTS hide_logo_in_preview BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_logo_text TEXT,
ADD COLUMN IF NOT EXISTS custom_bottom_text TEXT;

ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

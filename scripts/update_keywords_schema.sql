-- Add importance and order_index columns to client_keywords table
ALTER TABLE public.client_keywords 
ADD COLUMN IF NOT EXISTS importance TEXT DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high')),
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

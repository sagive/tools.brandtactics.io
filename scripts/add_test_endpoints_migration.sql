-- Run this script to add the new test endpoint columns without dropping the table
ALTER TABLE public.article_endpoints 
ADD COLUMN IF NOT EXISTS endpoint_url_test text,
ADD COLUMN IF NOT EXISTS use_test_endpoint boolean DEFAULT false;

-- Migration: Add client_comment and client_comment_at columns to public.articles table
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS client_comment TEXT,
ADD COLUMN IF NOT EXISTS client_comment_at TIMESTAMP WITH TIME ZONE;

-- Add scheduled_for to allow tracking when an email is scheduled to be sent via Resend API
ALTER TABLE public.email_updates ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE NULL;

-- Make sure to update the comments on what the status enum or text might be
COMMENT ON COLUMN public.email_updates.status IS 'Status of the email: Queued, Sent, Delivered, or Scheduled';

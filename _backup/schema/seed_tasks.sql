-- Seed script to restore active tasks for Acme Corp
-- Run this in your Supabase SQL Editor

INSERT INTO public.tasks (title, description, status, priority, assignee, client_id, end_date)
SELECT 
  'Design new website homepage', 'Create wireframes and high-fidelity mockups for the new homepage.', 'Completed', 'High', 'mark', id, CURRENT_DATE + interval '5 days'
FROM public.clients WHERE name = 'Acme Corp';

INSERT INTO public.tasks (title, description, status, priority, assignee, client_id, end_date)
SELECT 
  'Integrate payment gateway', 'Set up Stripe integration for the new e-commerce store.', 'Working on it', 'High', 'sarah', id, CURRENT_DATE + interval '2 days'
FROM public.clients WHERE name = 'Acme Corp';

INSERT INTO public.tasks (title, description, status, priority, assignee, client_id, end_date)
SELECT 
  'Write blog post about Q3 updates', 'Draft a blog post highlighting our new features.', 'Pending', 'Medium', 'mark', id, CURRENT_DATE + interval '7 days'
FROM public.clients WHERE name = 'Acme Corp';

INSERT INTO public.tasks (title, description, status, priority, assignee, client_id, end_date)
SELECT 
  'Fix responsive layout bugs on mobile', 'The navigation menu overlaps the content on iPhone SE.', 'Stuck', 'High', 'john', id, CURRENT_DATE - interval '1 day'
FROM public.clients WHERE name = 'Acme Corp';

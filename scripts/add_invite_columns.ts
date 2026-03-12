import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addInviteColumns() {
  console.log("Adding status and invited_at columns to users table...");

  // Since we don't have direct schema altering via JS client, we'll try to use raw SQL
  // But wait, postgres functions might be better. Or we just execute raw SQL?
  // Let's create an RPC or execute SQL directly using a workaround.
  // Wait, direct query might not be supported. Let's just create an update function or instruct the user to run SQL.

  console.log("Please run this SQL in your Supabase SQL Editor:");
  console.log(`
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;
  `);

  console.log("Also, make sure the triggers logic sets status='active' for new generic signups if needed, but our auth provider will handle it.");
}

addInviteColumns();

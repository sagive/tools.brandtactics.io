require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkUsers() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  console.log("Checking profiles...");
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(5);
  console.log("Profiles:", profiles?.length, pError || "OK");
  if (profiles) console.log("First profile:", profiles[0]);

  console.log("\nChecking users (if exists)...");
  const { data: users, error: uError } = await supabase.from('users').select('*').limit(5);
  console.log("Users:", users?.length, uError || "OK");
}

checkUsers();

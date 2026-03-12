import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function makeAdmin() {
  const email = "imrisagive@gmail.com";
  console.log(`Setting role to 'admin' for ${email}...`);
  
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('email', email)
    .select();

  if (error) {
    console.error("Error updating user:", error);
  } else if (data && data.length > 0) {
    console.log("Successfully updated:", data[0].email, data[0].role);
  } else {
    console.log("No user found with that email, or update failed.", data);
  }
}

makeAdmin();

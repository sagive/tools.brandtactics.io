const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('email_updates')
    .select('id, title, status, scheduled_for, created_at, sent_date')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log("Error? ", error);
  console.log("Recent emails in DB:");
  console.log(data);
}

check();

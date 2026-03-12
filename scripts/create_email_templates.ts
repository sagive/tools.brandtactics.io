import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.email_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      content TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all authenticated users access to email_templates" ON public.email_templates;
    CREATE POLICY "Allow all authenticated users access to email_templates" ON public.email_templates FOR ALL USING (auth.role() = 'authenticated');
  `;

  // Try RPC first (if exec_sql is available)
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.log("RPC exec_sql failed, trying direct REST API execution...", error.message);
    const result = await fetch(supabaseUrl + '/rest/v1/', {
        method: 'POST',
        headers: {
            apikey: supabaseKey || '',
            Authorization: 'Bearer ' + supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });
    const data = await result.text();
    console.log("REST API result:", data);
  } else {
    console.log("Table email_templates created successfully via RPC");
  }
}

createTable();

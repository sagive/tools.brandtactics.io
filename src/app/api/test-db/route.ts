import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase.from('email_updates').select('*').order('sent_date', { ascending: false }).limit(3);

  return NextResponse.json({
    envUrl: supabaseUrl,
    error,
    data
  });
}

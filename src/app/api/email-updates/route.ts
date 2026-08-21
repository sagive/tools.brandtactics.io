import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.btools_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.btools_SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (e) {
        // ignore parse error
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing email update ID' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');

    // Create client using service key if available, otherwise authenticated anon client
    const supabaseClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false }
        })
      : createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: authHeader || '',
            },
          },
        });

    const { error, data } = await supabaseClient
      .from('email_updates')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Failed to delete email update from DB:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id, data });
  } catch (err: any) {
    console.error('Exception during email update delete:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

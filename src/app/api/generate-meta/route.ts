import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSeoMeta } from '@/lib/seo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { title, content } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    // 1. Fetch Gemini API Key from app_settings using admin privileges to bypass RLS
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('gemini_api_key')
      .eq('id', 'global')
      .single();

    if (settingsError || !settings?.gemini_api_key) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured in Settings -> AI Integrations.' },
        { status: 400 }
      );
    }

    const apiKey = settings.gemini_api_key;

    // 2. Call the generator helper
    const result = await generateSeoMeta(title, content || '', apiKey);

    return NextResponse.json({ 
      meta_title: result.meta_title,
      meta_description: result.meta_description,
      meta_keywords: result.meta_keywords
    });

  } catch (error: any) {
    console.error('Meta Generator Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

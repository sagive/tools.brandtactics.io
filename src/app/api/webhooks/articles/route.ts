import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Webhook for external article submissions (e.g., from n8n)
 * Endpoint: /api/webhooks/articles
 * Method: POST
 * Auth: X-Webhook-Secret header
 */

export async function POST(request: Request) {
  try {
    // 1. Security Check
    const secret = request.headers.get('X-Webhook-Secret');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration error in webhook');
      return NextResponse.json({ error: 'Server database configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch secret from DB
    const { data: settings } = await supabaseAdmin.from('app_settings').select('webhook_secret').eq('id', 'global').single();
    const expectedSecret = settings?.webhook_secret || process.env.WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('WEBHOOK_SECRET is not set in DB or environment');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Request Body
    const body = await request.json();
    const { 
      clientId, 
      title, 
      content, 
      type = 'Blog Post',
      direction = 'ltr',
      meta_title,
      meta_description,
      meta_keywords
    } = body;

    // 3. Validation
    if (!clientId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields: clientId, title, content' }, { status: 400 });
    }

    // 4. Word count calculation (robust)
    const wordCount = content.replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    // 5. Verify Client Existence
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('Client validation failed or client not found:', clientId);
      return NextResponse.json({ error: 'Invalid clientId: Client does not exist' }, { status: 400 });
    }

    // 6. Insert into Database
    const { data, error } = await supabaseAdmin
      .from('articles')
      .insert({
        client_id: clientId,
        title,
        content,
        type,
        direction,
        length: wordCount,
        status: 'Draft',
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        meta_keywords: meta_keywords || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database insertion error:', error);
      return NextResponse.json({ error: 'Failed to save article', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Article saved as draft', 
      articleId: data.id,
      wordCount
    });

  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}

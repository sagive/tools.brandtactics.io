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
    const expectedSecret = process.env.WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('WEBHOOK_SECRET environment variable is not set');
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
      meta_title,
      meta_description,
      meta_keywords
    } = body;

    // 3. Validation
    if (!clientId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields: clientId, title, content' }, { status: 400 });
    }

    // 4. Word count calculation (simplistic)
    const wordCount = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

    // 5. Initialize Supabase Admin Client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration error in webhook');
      return NextResponse.json({ error: 'Server database configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 6. Insert into Database
    const { data, error } = await supabaseAdmin
      .from('articles')
      .insert({
        client_id: clientId,
        title,
        content,
        type,
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
      articleId: data.id 
    });

  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}

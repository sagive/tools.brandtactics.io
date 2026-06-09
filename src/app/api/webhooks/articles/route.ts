import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSeoMeta } from '@/lib/seo';

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

    // Fetch secret and API key from DB in a single query
    const { data: settings } = await supabaseAdmin.from('app_settings').select('webhook_secret, gemini_api_key').eq('id', 'global').single();
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
      meta_keywords,
      category,
      categories,
      categoty
    } = body;

    // 3. Validation
    if (!clientId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields: clientId, title, content' }, { status: 400 });
    }

    // Process categories / category (100% optional)
    let finalCategories: string[] = [];
    if (Array.isArray(categories)) {
      finalCategories = categories.filter((c: any) => typeof c === 'string' && c.trim() !== '');
    } else if (typeof categories === 'string' && categories.trim() !== '') {
      finalCategories = [categories.trim()];
    } else if (Array.isArray(category)) {
      finalCategories = category.filter((c: any) => typeof c === 'string' && c.trim() !== '');
    } else if (typeof category === 'string' && category.trim() !== '') {
      finalCategories = [category.trim()];
    } else if (Array.isArray(categoty)) {
      finalCategories = categoty.filter((c: any) => typeof c === 'string' && c.trim() !== '');
    } else if (typeof categoty === 'string' && categoty.trim() !== '') {
      finalCategories = [categoty.trim()];
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

    // Auto-generate missing metadata if Gemini API Key is available
    let finalMetaTitle = meta_title || null;
    let finalMetaDescription = meta_description || null;
    let finalMetaKeywords = meta_keywords || null;

    if ((!finalMetaTitle || !finalMetaDescription || !finalMetaKeywords) && settings?.gemini_api_key) {
      try {
        const seoResult = await generateSeoMeta(title, content, settings.gemini_api_key);
        if (!finalMetaTitle) finalMetaTitle = seoResult.meta_title;
        if (!finalMetaDescription) finalMetaDescription = seoResult.meta_description;
        if (!finalMetaKeywords) finalMetaKeywords = seoResult.meta_keywords;
      } catch (seoErr) {
        console.error('Failed to auto-generate SEO meta in webhook:', seoErr);
        // Gracefully continue without failing the submission
      }
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
        meta_title: finalMetaTitle,
        meta_description: finalMetaDescription,
        meta_keywords: finalMetaKeywords,
        categories: finalCategories,
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

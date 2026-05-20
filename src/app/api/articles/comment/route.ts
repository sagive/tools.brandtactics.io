import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Regex to ALLOW only:
// - English letters: a-z, A-Z
// - Hebrew letters: \u0590-\u05FF
// - Numbers: 0-9
// - Whitespace: \s (spaces, tabs, newlines)
// - Basic safe punctuation: . , ? ! - ' " ( )
const SAFE_CHARACTER_REGEX = /[^a-zA-Z0-9\s\u0590-\u05FF.,?!'""()-]/g;

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase service configuration is missing in environment.');
      return NextResponse.json({ error: 'Server database configuration error' }, { status: 500 });
    }

    const { articleId, comment } = await request.json();

    if (!articleId) {
      return NextResponse.json({ error: 'Missing required field: articleId' }, { status: 400 });
    }

    if (typeof comment !== 'string') {
      return NextResponse.json({ error: 'Comment must be a string' }, { status: 400 });
    }

    // 1. Sanitize the comment text
    // Replace any disallowed characters and trim whitespace
    const sanitizedComment = comment.replace(SAFE_CHARACTER_REGEX, '').trim();

    if (sanitizedComment.length === 0) {
      return NextResponse.json({ error: 'Comment cannot be empty or contain only special characters' }, { status: 400 });
    }

    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Fetch Article to verify it exists and is public
    const { data: article, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('id, is_public')
      .eq('id', articleId)
      .single();

    if (fetchError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (!article.is_public) {
      return NextResponse.json({ error: 'Access denied: Article is not public' }, { status: 403 });
    }

    // 4. Update the article comment field
    const { error: updateError } = await supabaseAdmin
      .from('articles')
      .update({
        client_comment: sanitizedComment,
        client_comment_at: new Date().toISOString()
      })
      .eq('id', articleId);

    if (updateError) {
      console.error('Failed to update article comment:', updateError);
      return NextResponse.json({ error: 'Failed to save comment', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      comment: sanitizedComment
    });

  } catch (error: any) {
    console.error('Comment API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to strip HTML tags for sending clean text to Gemini
function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

    // Extract first 1000 words
    const cleanContent = stripHtml(content || '');
    const words = cleanContent.split(/\s+/);
    const truncatedContent = words.slice(0, 1000).join(' ') + (words.length > 1000 ? '...' : '');

    // 2. Prepare prompt
    const prompt = `You are a professional SEO copywriter. Please generate a highly optimized meta title and meta description for the following article.
    
Requirements:
1. The response must be a valid JSON object only, with exactly two keys: "meta_title" and "meta_description".
2. The meta_title should be compelling, click-worthy, and strictly under 60 characters.
3. The meta_description should summarize the article, contain a call to action if appropriate, and be strictly under 160 characters.
4. Do not include any markdown formatting (like \`\`\`json) or other text outside the JSON object.

Article Title: "${title}"
Article Content (first 1000 words):
"""
${truncatedContent}
"""`;

    // 3. Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Gemini Error: ", data);
        return NextResponse.json({ error: data?.error?.message || 'Gemini API Error' }, { status: 500 });
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON response from Gemini:", responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ 
      meta_title: result.meta_title || '',
      meta_description: result.meta_description || ''
    });

  } catch (error: any) {
    console.error('Meta Generator Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

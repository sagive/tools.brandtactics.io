import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid rawText' }, { status: 400 });
    }

    // 1. Fetch Gemini API Key from app_settings using admin privilege to bypass RLS
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

    // 2. Prepare prompt
    const prompt = `You are a professional task formatting assistant. 
Your goal is to parse a raw voice dictation from a user into a clean, concise, properly formatted HTML task description suitable for a rich text editor.
Only use tags like <p>, <ul>, <ol>, <li>, <strong>, <em>, <br>. Do not wrap in HTML code blocks or include any conversational filler. Just the HTML.
Fix minor grammatical errors but keep the core meaning intact.

Raw Dictation:
"""
${rawText}
"""
`;

    // 3. Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
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
          temperature: 0.2, // Low temperature for consistent formatting
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Gemini Error: ", data);
        return NextResponse.json({ error: data?.error?.message || 'Gemini API Error' }, { status: 500 });
    }

    const cleanedHtml = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up potential markdown blocks if Gemini decides to include them anyway
    const finalHtml = cleanedHtml.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

    return NextResponse.json({ result: finalHtml });

  } catch (error: any) {
    console.error('AI Helper Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

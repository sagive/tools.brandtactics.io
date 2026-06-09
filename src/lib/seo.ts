// Helper to strip HTML tags for sending clean text to Gemini
export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SeoMetaResult {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

export async function generateSeoMeta(title: string, content: string, apiKey: string): Promise<SeoMetaResult> {
  const cleanContent = stripHtml(content || '');
  const words = cleanContent.split(/\s+/);
  const truncatedContent = words.slice(0, 1000).join(' ') + (words.length > 1000 ? '...' : '');

  const prompt = `You are a professional SEO copywriter. Please generate a highly optimized meta title, meta description, and meta keywords for the following article.
    
Requirements:
1. The response must be a valid JSON object only, with exactly three keys: "meta_title", "meta_description", and "meta_keywords".
2. The meta_title should be compelling, click-worthy, and strictly under 60 characters.
3. The meta_description should summarize the article, contain a call to action if appropriate, and be strictly under 160 characters.
4. The meta_keywords should be a comma-separated string of the 5-10 most relevant search keywords.
5. Do not include any markdown formatting (like \`\`\`json) or other text outside the JSON object.

Article Title: "${title}"
Article Content (first 1000 words):
"""
${truncatedContent}
"""`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  
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
    throw new Error(data?.error?.message || 'Gemini API Error');
  }

  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const result = JSON.parse(responseText);

  return {
    meta_title: result.meta_title || '',
    meta_description: result.meta_description || '',
    meta_keywords: result.meta_keywords || ''
  };
}

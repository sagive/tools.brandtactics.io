const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*"([^"]+)"/) || envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*([^\s]+)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*"([^"]+)"/) || envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*([^\s]+)/);
  if (urlMatch) supabaseUrl = urlMatch[1];
  if (keyMatch) supabaseServiceKey = keyMatch[1];
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function cleanBase64FromArticles() {
  console.log("Fetching list of articles...");
  let page = 0;
  const pageSize = 10;
  let hasMore = true;
  let totalCleaned = 0;

  while (hasMore) {
    console.log(`Checking batch ${page + 1}...`);
    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('id, title, content')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Error fetching batch:", error);
      break;
    }

    if (!articles || articles.length === 0) {
      hasMore = false;
      break;
    }

    for (const article of articles) {
      if (!article.content || !article.content.includes('data:image/')) {
        continue;
      }

      console.log(`\nRemoving base64 images from article ID: ${article.id} ("${article.title}")`);
      
      // Strip <img> tags containing data:image/ base64
      const cleanedContent = article.content.replace(/<img[^>]*src=["']data:image\/[^"']+["'][^>]*\s*\/?>/gi, '');

      if (cleanedContent !== article.content) {
        console.log(`  Updating article ${article.id} in database...`);
        const { error: updateError } = await supabaseAdmin
          .from('articles')
          .update({ content: cleanedContent, updated_at: new Date().toISOString() })
          .eq('id', article.id);

        if (updateError) {
          console.error(`  Failed to update article ${article.id}:`, updateError.message);
        } else {
          totalCleaned++;
          console.log(`  Successfully stripped base64 images from article ${article.id}!`);
        }
      }
    }

    if (articles.length < pageSize) {
      hasMore = false;
    } else {
      page++;
    }
  }

  console.log(`\nFinished processing all articles. Total articles cleaned: ${totalCleaned}`);
}

cleanBase64FromArticles();


import { supabase } from "../src/lib/supabase";

async function checkColumns() {
  const { data, error } = await supabase.from('articles').select('*').limit(1);
  if (error) {
    console.error("Error fetching articles:", error);
    return;
  }
  
  const sample = data[0] || {};
  const columns = Object.keys(sample);
  console.log("Columns in articles table:", columns);
  
  const expected = ['meta_title', 'meta_description', 'meta_keywords'];
  const missing = expected.filter(col => !columns.includes(col));
  
  if (missing.length > 0) {
    console.log("Missing columns:", missing);
    console.log("Please run the following SQL in your Supabase dashboard:");
    console.log(`ALTER TABLE articles ADD COLUMN meta_title TEXT, ADD COLUMN meta_description TEXT, ADD COLUMN meta_keywords TEXT;`);
  } else {
    console.log("All SEO meta columns are present!");
  }
}

checkColumns();

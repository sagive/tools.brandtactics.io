const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = 'https://gcywmajcvrdmynkdepmp.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjeXdtYWpjdnJkbXlua2RlcG1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA0NTIxNSwiZXhwIjoyMDg4NjIxMjE1fQ.JpiUk7v8eRC4vDv8O-eJIGraRnWAkNI1ae-lx63BxpU';
const supabase = createClient(url, key);

async function exportAll() {
  const dir = path.join(process.cwd(), 'backup_supabase');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const tables = ['clients', 'tasks', 'articles', 'backlinks', 'users', 'profiles', 'email_updates', 'invites', 'notifications'];
  for (const t of tables) {
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase.from(t).select('*').range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) {
        console.error('Error fetching', t, error.message);
        break;
      }
      if (!data || data.length === 0) break;
      allData.push(...data);
      if (data.length < pageSize) break;
      page++;
    }
    const filePath = path.join(dir, t + '.json');
    fs.writeFileSync(filePath, JSON.stringify(allData, null, 2), 'utf8');
    console.log(`Saved ${t}: ${allData.length} records to ${filePath}`);
  }
}

exportAll().catch(console.error);

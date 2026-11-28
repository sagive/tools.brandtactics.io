const fs = require('fs');
const path = require('path');

let usages = {};

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      scan(p);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
      const content = fs.readFileSync(p, 'utf8');
      const regex = /supabase\.from\(['"]([^'"]+)['"]\)/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const tbl = match[1];
        usages[tbl] = (usages[tbl] || 0) + 1;
      }
    }
  }
}

scan('src');
console.log('Tables queried across src/:', usages);

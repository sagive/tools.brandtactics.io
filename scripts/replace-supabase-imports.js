const fs = require('fs');

const files = [
  'src/app/api/ai-task-helper/route.ts',
  'src/app/api/articles/comment/route.ts',
  'src/app/api/articles/upload/route.ts',
  'src/app/api/clients/[id]/stats/accounts/route.ts',
  'src/app/api/clients/[id]/stats/route.ts',
  'src/app/api/cron/send-scheduled-emails/route.ts',
  'src/app/api/email-updates/route.ts',
  'src/app/api/generate-meta/route.ts',
  'src/app/api/invites/route.ts',
  'src/app/api/notify-assignment/route.ts',
  'src/app/api/send-email/route.ts',
  'src/app/api/test-db/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/webhooks/articles/route.ts',
  'src/app/api/webhooks/emails/route.ts'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('@supabase/supabase-js')) {
    content = content.replace(/import\s*\{\s*createClient\s*\}\s*from\s*['"]@supabase\/supabase-js['"];?/g, "import { createClient } from '@/lib/supabase';");
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated:', f);
  }
}

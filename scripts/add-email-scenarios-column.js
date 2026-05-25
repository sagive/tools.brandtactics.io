const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Parse .env.local manually to find the connection string
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let connectionString = process.env.btools_POSTGRES_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  const match = envContent.match(/(?:#\s*)?(btools_POSTGRES_URL|POSTGRES_URL)\s*=\s*"([^"]+)"/);
  if (match) {
    connectionString = match[2];
  } else {
    const matchNoQuotes = envContent.match(/(?:#\s*)?(btools_POSTGRES_URL|POSTGRES_URL)\s*=\s*([^\s]+)/);
    if (matchNoQuotes) {
      connectionString = matchNoQuotes[2];
    }
  }
}

if (!connectionString) {
  console.error("Could not find Postgres connection URL in .env.local or process.env");
  process.exit(1);
}

// Clean connectionString by removing sslmode parameter so our Client ssl option overrides it
connectionString = connectionString.replace(/sslmode=[^&]+/g, '').replace(/\?&/g, '?').replace(/&&\+/g, '&');

console.log("Connecting to PostgreSQL...");

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database!");

    const query = "ALTER TABLE public.app_settings " +
      "ADD COLUMN IF NOT EXISTS email_scenarios JSONB DEFAULT $scenarios${" +
      '  "task_assignment": {' +
      '    "subject": "You\'ve been assigned a new task: [task_title]",' +
      '    "body": "<p><strong>[assigner_name]</strong> assigned you the task: <strong>[task_title]</strong></p><br/><p>Click below to view and manage this task in your dashboard:</p><p><a href=\\"[task_link]\\" style=\\"display: inline-block; padding: 12px 24px; background-color: #4640A0; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;\\">View Task</a></p>"' +
      "  }," +
      '  "magic_link": {' +
      '    "subject": "Your BrandTactics Login Link",' +
      '    "body": "<p>Hello [user_name],</p><p>You requested a magic link to sign in to the BrandTactics staff portal.</p><p><strong>This link will only work once and will expire in 1 hour.</strong></p><br/><div style=\\"text-align: center;\\"><a href=\\"[login_link]\\" style=\\"background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;\\">Sign In Now</a></div><p style=\\"font-size: 11px; margin-top: 24px; color: #94a3b8;\\">If you didn\'t request this, you can safely ignore this email.</p>"' +
      "  }," +
      '  "team_invite": {' +
      '    "subject": "You\'re invited to BrandTactics",' +
      '    "body": "<p>You have been invited to join the BrandTactics portal as a <strong>[role]</strong>.</p><p>Click the button below to set your password and access your account.</p><br/><div style=\\"text-align: center;\\"><a href=\\"[invite_link]\\" style=\\"background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;\\">Accept Invitation</a></div><p style=\\"font-size: 11px; margin-top: 24px; color: #94a3b8;\\">Or copy and paste this link: <br/> [invite_link]</p>"' +
      "  }" +
      "}$scenarios$::jsonb;";

    const res = await client.query(query);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();

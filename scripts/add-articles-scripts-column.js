const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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
  console.error("Could not find Postgres connection URL in .env.local");
  process.exit(1);
}

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

    const query = "ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS scripts TEXT;";

    await client.query(query);
    console.log("Migration executed successfully! Added scripts column to articles table.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();

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

    // Find any CHECK constraints on column 'status' in table 'articles'
    const findConstraintsQuery = `
      SELECT tc.constraint_name 
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'articles' 
        AND ccu.column_name = 'status' 
        AND tc.constraint_type = 'CHECK';
    `;

    const result = await client.query(findConstraintsQuery);
    const constraints = result.rows.map(row => row.constraint_name);
    console.log("Found CHECK constraints:", constraints);

    for (const constraint of constraints) {
      console.log(`Dropping constraint: ${constraint}`);
      await client.query(`ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS "${constraint}";`);
    }

    // Add new constraint
    const addConstraintQuery = `
      ALTER TABLE public.articles 
      ADD CONSTRAINT articles_status_check 
      CHECK (status IN ('Draft', 'Published', 'Sent to publisher'));
    `;
    
    await client.query(addConstraintQuery);
    console.log("Migration executed successfully! New articles_status_check constraint added.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();

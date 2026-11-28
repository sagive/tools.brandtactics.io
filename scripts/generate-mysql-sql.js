const fs = require('fs');
const path = require('path');

function generateSQL() {
  const dir = path.join(process.cwd(), 'backup_supabase');
  const files = ['clients', 'users', 'tasks', 'articles', 'backlinks', 'email_updates', 'notifications'];
  let sql = 'SET FOREIGN_KEY_CHECKS = 0;\n';
  sql += 'SET NAMES utf8mb4;\n\n';

  for (const f of files) {
    const p = path.join(dir, f + '.json');
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!data.length) continue;

    const colSet = new Set();
    data.forEach(r => Object.keys(r).forEach(k => colSet.add(k)));
    const cols = Array.from(colSet);

    sql += `DROP TABLE IF EXISTS \`${f}\`;\n`;
    sql += `CREATE TABLE \`${f}\` (\n`;
    const colDefs = [];
    for (const c of cols) {
      let type = 'LONGTEXT';
      if (c === 'id') {
        type = typeof data[0][c] === 'number' ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'VARCHAR(255) PRIMARY KEY';
      } else if (c.endsWith('_at') || c === 'date' || c.endsWith('_date')) {
        type = 'DATETIME NULL';
      } else if (typeof data[0][c] === 'boolean') {
        type = 'BOOLEAN DEFAULT FALSE';
      } else if (typeof data[0][c] === 'number') {
        type = Number.isInteger(data[0][c]) ? 'INT' : 'DOUBLE';
      } else if (typeof data[0][c] === 'string' && data[0][c].length < 150 && !c.includes('content') && !c.includes('description') && !c.includes('notes') && !c.includes('comments') && !c.includes('url')) {
        type = 'VARCHAR(255)';
      } else {
        type = 'LONGTEXT';
      }
      colDefs.push(`  \`${c}\` ${type}`);
    }
    sql += colDefs.join(',\n') + '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

    // Insert data in smaller chunks to avoid max_allowed_packet issues
    const chunkSize = 25;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      sql += `INSERT INTO \`${f}\` (\`${cols.join('`, `')}\`) VALUES\n`;
      const rows = chunk.map(row => {
        const vals = cols.map(c => {
          let v = row[c];
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'boolean') return v ? '1' : '0';
          if (typeof v === 'number') return v;
          if (typeof v === 'object') {
            v = JSON.stringify(v);
          }
          if (c.endsWith('_at') || c === 'date' || c.endsWith('_date')) {
            // Ensure valid MySQL datetime format YYYY-MM-DD HH:MM:SS
            const d = new Date(v);
            if (!isNaN(d.getTime())) {
              return "'" + d.toISOString().slice(0, 19).replace('T', ' ') + "'";
            }
          }
          return escapeSql(String(v));
        });
        return `(${vals.join(', ')})`;
      });
      sql += rows.join(',\n') + ';\n';
    }
    sql += '\n';
  }

  sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';
  const outPath = path.join(dir, 'import_to_mysql.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log('Successfully generated import_to_mysql.sql, size:', (sql.length / 1024 / 1024).toFixed(2), 'MB');
}

function escapeSql(str) {
  return "'" + str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r') + "'";
}

generateSQL();

import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/mysql';
import { getSessionUser } from '@/lib/auth';

// Whitelist of allowed tables for security
const ALLOWED_TABLES = new Set([
  'clients',
  'tasks',
  'articles',
  'backlinks',
  'users',
  'email_updates',
  'notifications',
  'article_types',
  'app_settings',
  'agency_tools',
  'tool_categories',
  'email_templates',
  'profile_sites',
  'task_templates',
  'client_resources',
  'client_links',
  'client_backlinks',
  'backlink_categories',
  'scheduled_reminders',
  'activity_logs'
]);

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    // In production we can enforce user check, or allow open read for specific public endpoints
    const body = await req.json();
    const { action, table, select = '*', filters = [], orderBy, limit, offset, data, id } = body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      return NextResponse.json({ error: `Invalid or unauthorized table: ${table}` }, { status: 400 });
    }

    if (action === 'select') {
      let sql = `SELECT ${select || '*'} FROM \`${table}\``;
      const params: any[] = [];
      const whereClauses: string[] = [];

      if (Array.isArray(filters) && filters.length > 0) {
        for (const f of filters) {
          // f = { col, op, val }
          const col = f.col.replace(/[^a-zA-Z0-9_]/g, '');
          if (f.op === 'eq') {
            whereClauses.push(`\`${col}\` = ?`);
            params.push(f.val);
          } else if (f.op === 'neq') {
            whereClauses.push(`\`${col}\` != ?`);
            params.push(f.val);
          } else if (f.op === 'in') {
            if (Array.isArray(f.val) && f.val.length > 0) {
              const placeholders = f.val.map(() => '?').join(', ');
              whereClauses.push(`\`${col}\` IN (${placeholders})`);
              params.push(...f.val);
            }
          } else if (f.op === 'like' || f.op === 'ilike') {
            whereClauses.push(`\`${col}\` LIKE ?`);
            params.push(`%${f.val}%`);
          } else if (f.op === 'is' && f.val === null) {
            whereClauses.push(`\`${col}\` IS NULL`);
          } else if (f.op === 'not.is' && f.val === null) {
            whereClauses.push(`\`${col}\` IS NOT NULL`);
          }
        }
      }

      if (whereClauses.length > 0) {
        sql += ` WHERE ` + whereClauses.join(' AND ');
      }

      if (orderBy) {
        const col = orderBy.col.replace(/[^a-zA-Z0-9_]/g, '');
        const dir = orderBy.ascending ? 'ASC' : 'DESC';
        sql += ` ORDER BY \`${col}\` ${dir}`;
      }

      if (limit) {
        sql += ` LIMIT ?`;
        params.push(Number(limit));
        if (offset) {
          sql += ` OFFSET ?`;
          params.push(Number(offset));
        }
      }

      const rows = await query(sql, params);
      return NextResponse.json({ data: rows, error: null });
    }

    if (action === 'insert') {
      const records = Array.isArray(data) ? data : [data];
      if (records.length === 0) return NextResponse.json({ data: [], error: null });

      const cols = Object.keys(records[0]).filter(c => /^[a-zA-Z0-9_]+$/.test(c));
      const placeholders = `(${cols.map(() => '?').join(', ')})`;
      const sql = `INSERT INTO \`${table}\` (\`${cols.join('`, `')}\`) VALUES ${records.map(() => placeholders).join(', ')}`;
      const params: any[] = [];
      for (const r of records) {
        for (const c of cols) {
          let val = r[c];
          if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
          params.push(val);
        }
      }

      await execute(sql, params);
      return NextResponse.json({ data: records, error: null });
    }

    if (action === 'update') {
      if (!id && (!filters || filters.length === 0)) {
        return NextResponse.json({ error: 'Update requires an id or filters' }, { status: 400 });
      }

      const cols = Object.keys(data).filter(c => /^[a-zA-Z0-9_]+$/.test(c));
      const setClauses = cols.map(c => `\`${c}\` = ?`).join(', ');
      const params: any[] = cols.map(c => {
        let val = data[c];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        return val;
      });

      let sql = `UPDATE \`${table}\` SET ${setClauses}`;
      if (id) {
        sql += ` WHERE \`id\` = ?`;
        params.push(id);
      } else if (filters && filters.length > 0) {
        const whereClauses = filters.map((f: any) => {
          const col = f.col.replace(/[^a-zA-Z0-9_]/g, '');
          params.push(f.val);
          return `\`${col}\` = ?`;
        });
        sql += ` WHERE ` + whereClauses.join(' AND ');
      }

      await execute(sql, params);
      return NextResponse.json({ data, error: null });
    }

    if (action === 'delete') {
      if (!id && (!filters || filters.length === 0)) {
        return NextResponse.json({ error: 'Delete requires an id or filters' }, { status: 400 });
      }

      let sql = `DELETE FROM \`${table}\``;
      const params: any[] = [];
      if (id) {
        sql += ` WHERE \`id\` = ?`;
        params.push(id);
      } else if (filters && filters.length > 0) {
        const whereClauses = filters.map((f: any) => {
          const col = f.col.replace(/[^a-zA-Z0-9_]/g, '');
          params.push(f.val);
          return `\`${col}\` = ?`;
        });
        sql += ` WHERE ` + whereClauses.join(' AND ');
      }

      await execute(sql, params);
      return NextResponse.json({ success: true, error: null });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('MySQL API Route Error:', err);
    return NextResponse.json({ error: err.message, data: null }, { status: 500 });
  }
}

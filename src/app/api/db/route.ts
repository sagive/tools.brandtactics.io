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
    const body = await req.json();
    const { action, table, select = '*', filters = [], orderBy, limit, offset, count: countType, head, data, id } = body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      return NextResponse.json({ error: `Invalid or unauthorized table: ${table}`, data: [] }, { status: 400 });
    }

    if (action === 'select') {
      // 1. Detect any nested relation requested in PostgREST format, e.g. "clients(name)", "tasks(id, status)"
      const selectStr = typeof select === 'string' ? select : '*';
      const hasClientsRelation = /clients\s*\(/i.test(selectStr);
      const hasTasksRelation = /tasks\s*\(/i.test(selectStr);
      const hasArticlesRelation = /articles\s*\(/i.test(selectStr);
      const hasEmailUpdatesRelation = /email_updates\s*\(/i.test(selectStr);
      const hasBacklinkCatsRelation = /backlink_categories\s*\(/i.test(selectStr);

      // Strip out relation brackets for the primary SQL SELECT clause
      let cleanCols = selectStr
        .replace(/[a-zA-Z0-9_]+\s*\([^)]*\)/g, '')
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)
        .join(', ');

      if (!cleanCols || cleanCols === '') {
        cleanCols = '*';
      }

      // Build WHERE conditions
      const params: any[] = [];
      const whereClauses: string[] = [];

      if (Array.isArray(filters) && filters.length > 0) {
        for (const f of filters) {
          if (!f || !f.col) continue;

          if (f.op === 'raw_or' || f.col === '__or') {
            // handle raw or strings like "assignee.eq.X,created_by.eq.X"
            continue;
          }

          const col = f.col.replace(/[^a-zA-Z0-9_]/g, '');
          if (f.op === 'eq') {
            whereClauses.push(`\`${table}\`.\`${col}\` = ?`);
            params.push(f.val);
          } else if (f.op === 'neq') {
            whereClauses.push(`\`${table}\`.\`${col}\` != ?`);
            params.push(f.val);
          } else if (f.op === 'in') {
            if (Array.isArray(f.val) && f.val.length > 0) {
              const placeholders = f.val.map(() => '?').join(', ');
              whereClauses.push(`\`${table}\`.\`${col}\` IN (${placeholders})`);
              params.push(...f.val);
            }
          } else if (f.op === 'like' || f.op === 'ilike') {
            whereClauses.push(`\`${table}\`.\`${col}\` LIKE ?`);
            params.push(`%${f.val}%`);
          } else if (f.op === 'is' && f.val === null) {
            whereClauses.push(`\`${table}\`.\`${col}\` IS NULL`);
          } else if (f.op === 'not.is' && f.val === null) {
            whereClauses.push(`\`${table}\`.\`${col}\` IS NOT NULL`);
          } else if (f.op === 'gte') {
            whereClauses.push(`\`${table}\`.\`${col}\` >= ?`);
            params.push(f.val);
          } else if (f.op === 'lte') {
            whereClauses.push(`\`${table}\`.\`${col}\` <= ?`);
            params.push(f.val);
          } else if (f.op === 'gt') {
            whereClauses.push(`\`${table}\`.\`${col}\` > ?`);
            params.push(f.val);
          } else if (f.op === 'lt') {
            whereClauses.push(`\`${table}\`.\`${col}\` < ?`);
            params.push(f.val);
          } else if (f.op === 'contains') {
            whereClauses.push(`\`${table}\`.\`${col}\` LIKE ?`);
            const term = Array.isArray(f.val) ? f.val[0] : f.val;
            params.push(`%${term}%`);
          }
        }
      }

      const whereSql = whereClauses.length > 0 ? ` WHERE ` + whereClauses.join(' AND ') : '';

      // If head-only or count is requested
      let totalCount: number | null = null;
      if (countType || head) {
        const countSql = `SELECT COUNT(*) as total FROM \`${table}\`${whereSql}`;
        const countRes = await query<any>(countSql, params);
        totalCount = countRes && countRes[0] ? Number(countRes[0].total) : 0;
        if (head) {
          return NextResponse.json({ data: [], count: totalCount, error: null });
        }
      }

      // Main query
      let sql = `SELECT ${cleanCols} FROM \`${table}\`${whereSql}`;

      if (orderBy && orderBy.col) {
        const col = orderBy.col.replace(/[^a-zA-Z0-9_]/g, '');
        const dir = orderBy.ascending ? 'ASC' : 'DESC';
        sql += ` ORDER BY \`${table}\`.\`${col}\` ${dir}`;
      }

      if (limit) {
        sql += ` LIMIT ?`;
        params.push(Number(limit));
        if (offset) {
          sql += ` OFFSET ?`;
          params.push(Number(offset));
        }
      }

      let rows = await query<any>(sql, params);
      if (!Array.isArray(rows)) rows = [];

      // 2. Attach Relations if requested
      if (rows.length > 0) {
        // A. Relation: clients on tasks / articles / backlinks
        if (hasClientsRelation) {
          const clientIds = Array.from(new Set(rows.map(r => r.client_id).filter(Boolean)));
          if (clientIds.length > 0) {
            const placeholders = clientIds.map(() => '?').join(', ');
            const clientRows = await query<any>(`SELECT id, name FROM \`clients\` WHERE \`id\` IN (${placeholders})`, clientIds);
            const clientMap = new Map(clientRows.map(c => [c.id, { name: c.name }]));
            for (const r of rows) {
              r.clients = clientMap.get(r.client_id) || null;
            }
          } else {
            for (const r of rows) r.clients = null;
          }
        }

        // B. Relation: backlink_categories on backlinks
        if (hasBacklinkCatsRelation) {
          const catIds = Array.from(new Set(rows.map(r => r.category_id).filter(Boolean)));
          if (catIds.length > 0) {
            const placeholders = catIds.map(() => '?').join(', ');
            const catRows = await query<any>(`SELECT id, name FROM \`backlink_categories\` WHERE \`id\` IN (${placeholders})`, catIds);
            const catMap = new Map(catRows.map(c => [c.id, { name: c.name }]));
            for (const r of rows) {
              r.backlink_categories = catMap.get(r.category_id) || null;
            }
          } else {
            for (const r of rows) r.backlink_categories = null;
          }
        }

        // C. Relation: tasks on clients
        if (hasTasksRelation && table === 'clients') {
          const clientIds = rows.map(r => r.id);
          const placeholders = clientIds.map(() => '?').join(', ');
          const taskRows = await query<any>(`SELECT id, client_id, status FROM \`tasks\` WHERE \`client_id\` IN (${placeholders})`, clientIds);
          const tasksByClient = new Map<string, any[]>();
          for (const t of taskRows) {
            const list = tasksByClient.get(t.client_id) || [];
            list.push({ id: t.id, status: t.status });
            tasksByClient.set(t.client_id, list);
          }
          for (const r of rows) {
            r.tasks = tasksByClient.get(r.id) || [];
          }
        }

        // D. Relation: articles on clients
        if (hasArticlesRelation && table === 'clients') {
          const clientIds = rows.map(r => r.id);
          const placeholders = clientIds.map(() => '?').join(', ');
          const artRows = await query<any>(`SELECT id, client_id, status FROM \`articles\` WHERE \`client_id\` IN (${placeholders})`, clientIds);
          const artsByClient = new Map<string, any[]>();
          for (const a of artRows) {
            const list = artsByClient.get(a.client_id) || [];
            list.push({ id: a.id, status: a.status });
            artsByClient.set(a.client_id, list);
          }
          for (const r of rows) {
            r.articles = artsByClient.get(r.id) || [];
          }
        }

        // E. Relation: email_updates on clients
        if (hasEmailUpdatesRelation && table === 'clients') {
          const clientIds = rows.map(r => r.id);
          const placeholders = clientIds.map(() => '?').join(', ');
          const emRows = await query<any>(`SELECT id, client_id, created_at, recipient_email FROM \`email_updates\` WHERE \`client_id\` IN (${placeholders})`, clientIds);
          const emByClient = new Map<string, any[]>();
          for (const e of emRows) {
            const list = emByClient.get(e.client_id) || [];
            list.push({ id: e.id, created_at: e.created_at, recipient_email: e.recipient_email });
            emByClient.set(e.client_id, list);
          }
          for (const r of rows) {
            r.email_updates = emByClient.get(r.id) || [];
          }
        }
      }

      return NextResponse.json({ data: rows, count: totalCount ?? rows.length, error: null });
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
    return NextResponse.json({ error: err.message, data: [] }, { status: 500 });
  }
}

import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'u7eqdcvmbhbta',
      password: process.env.MYSQL_PASSWORD || 'meobortbiaje',
      database: process.env.MYSQL_DATABASE || 'dbbicuxtdki0br',
      port: Number(process.env.MYSQL_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = getDbPool();
  const [rows] = await p.query(sql, params);
  return rows as T[];
}

export async function execute(sql: string, params: any[] = []): Promise<any> {
  const p = getDbPool();
  const [result] = await p.execute(sql, params);
  return result;
}

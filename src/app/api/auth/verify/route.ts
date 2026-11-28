import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/mysql';
import { createSession } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.CRON_SECRET || 'brandtactics_super_secure_auth_secret_2026'
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  const host = req.headers.get('host') || 'tools.brandtactics.io';
  const protocol = host.includes('localhost') ? 'http' : 'https';

  if (!token) {
    return NextResponse.redirect(`${protocol}://${host}/login?error=Invalid login link`);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || !payload.email || payload.type !== 'magiclink') {
      return NextResponse.redirect(`${protocol}://${host}/login?error=Invalid or expired login link`);
    }

    const users = await query<any>('SELECT * FROM users WHERE email = ? LIMIT 1', [payload.email]);
    if (!users || users.length === 0) {
      return NextResponse.redirect(`${protocol}://${host}/login?error=User not found`);
    }

    const user = users[0];
    if (user.status !== 'active') {
      return NextResponse.redirect(`${protocol}://${host}/login?error=Account is deactivated`);
    }

    let accessible = [];
    if (user.accessible_clients) {
      accessible = typeof user.accessible_clients === 'string' ? JSON.parse(user.accessible_clients) : user.accessible_clients;
    }

    await createSession({
      id: user.id,
      email: user.email,
      full_name: user.full_name || '',
      role: user.role || 'staff',
      avatar_url: user.avatar_url || '',
      accessible_clients: accessible,
      status: user.status,
    });

    return NextResponse.redirect(`${protocol}://${host}/dashboard`);
  } catch (err) {
    console.error('Magic link verification error:', err);
    return NextResponse.redirect(`${protocol}://${host}/login?error=Login link has expired. Please request a new one.`);
  }
}

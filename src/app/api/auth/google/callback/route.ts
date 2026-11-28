import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { createSession } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const host = req.headers.get('host') || 'tools.brandtactics.io';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  if (error || !code) {
    return NextResponse.redirect(`${protocol}://${host}/login?error=Google authentication cancelled`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Failed to get Google token:', tokenData);
      return NextResponse.redirect(`${protocol}://${host}/login?error=Failed to verify Google account`);
    }

    // 2. Fetch Google profile info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(`${protocol}://${host}/login?error=No email returned from Google`);
    }

    // 3. Strict security check against MySQL users table
    const users = await query<any>('SELECT * FROM users WHERE email = ? LIMIT 1', [googleUser.email]);
    if (!users || users.length === 0) {
      console.warn(`Unauthorized login attempt by non-member: ${googleUser.email}`);
      return NextResponse.redirect(`${protocol}://${host}/login?error=Unauthorized: Email not registered in Brandtactics Tools`);
    }

    const user = users[0];
    if (user.status !== 'active') {
      return NextResponse.redirect(`${protocol}://${host}/login?error=Account is deactivated or pending invitation`);
    }

    // 4. Create secure HTTP-only Session Cookie
    let accessible = [];
    if (user.accessible_clients) {
      accessible = typeof user.accessible_clients === 'string' ? JSON.parse(user.accessible_clients) : user.accessible_clients;
    }

    await createSession({
      id: user.id,
      email: user.email,
      full_name: user.full_name || googleUser.name || '',
      role: user.role || 'staff',
      avatar_url: user.avatar_url || googleUser.picture || '',
      accessible_clients: accessible,
      status: user.status,
    });

    return NextResponse.redirect(`${protocol}://${host}/dashboard`);
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${protocol}://${host}/login?error=Authentication failed. Please try again.`);
  }
}

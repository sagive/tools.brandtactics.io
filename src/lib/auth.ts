import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query, execute } from './mysql';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.CRON_SECRET || 'brandtactics_super_secure_auth_secret_2026'
);

const COOKIE_NAME = 'bt_session_token';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  accessible_clients?: string[];
  status: string;
}

/**
 * Creates an encrypted JWT session cookie (valid for 30 days)
 */
export async function createSession(user: AuthUser) {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.full_name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return token;
}

/**
 * Gets the current authenticated user from session cookie
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || !payload.email) return null;

    const users = await query<any>('SELECT * FROM users WHERE email = ? AND status = "active" LIMIT 1', [payload.email]);
    if (!users || users.length === 0) return null;

    const user = users[0];
    let accessible = [];
    if (user.accessible_clients) {
      accessible = typeof user.accessible_clients === 'string' 
        ? JSON.parse(user.accessible_clients) 
        : user.accessible_clients;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name || '',
      role: user.role || 'staff',
      avatar_url: user.avatar_url || '',
      accessible_clients: accessible,
      status: user.status || 'active',
    };
  } catch (err) {
    return null;
  }
}

/**
 * Destroys session cookie on logout
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { query, execute } from '@/lib/mysql';
import { SignJWT } from 'jose';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.CRON_SECRET || 'brandtactics_super_secure_auth_secret_2026'
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Check if user exists and is active in MySQL
    const users = await query<any>('SELECT id, email, full_name, status FROM users WHERE email = ? LIMIT 1', [email]);
    if (!users || users.length === 0) {
      console.log(`Login attempt for non-existent user: ${email}`);
      return NextResponse.json({ success: true, message: 'If account exists, email sent.' });
    }

    const user = users[0];
    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    // 2. Generate a 15-minute secure Magic Link token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      type: 'magiclink',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(JWT_SECRET);

    const host = req.headers.get('host') || 'tools.brandtactics.io';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const actionUrl = `${protocol}://${host}/api/auth/verify?token=${token}`;

    if (!resend) {
      console.warn('RESEND_API_KEY not configured, cannot send email. Magic link:', actionUrl);
      return NextResponse.json({ success: true, message: 'Magic link generated' });
    }

    // 3. Send email via Resend
    await resend.emails.send({
      from: 'BrandTactics Tools <system@updates.brandtactics.io>',
      to: email,
      subject: 'Your Login Link - Brandtactics Tools',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 8px;">
          <h2 style="color: #1f2937; margin-bottom: 16px;">Hello ${user.full_name || 'there'},</h2>
          <p style="color: #4b5563; line-height: 1.5;">Click the secure button below to log in to your Brandtactics account. This link will expire in 15 minutes.</p>
          <div style="margin: 28px 0;">
            <a href="${actionUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log in to Brandtactics Tools</a>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">If you didn't request this email, you can safely ignore it.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'If account exists, email sent.' });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

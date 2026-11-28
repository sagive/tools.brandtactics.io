import { NextResponse } from 'next/server';
import { getSessionUser, destroySession } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  return NextResponse.json({ authenticated: true, user });
}

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true, message: 'Logged out' });
}

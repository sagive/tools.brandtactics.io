import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function GET(req: Request) {
  await destroySession();
  const host = req.headers.get('host') || 'tools.brandtactics.io';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return NextResponse.redirect(`${protocol}://${host}/login`);
}

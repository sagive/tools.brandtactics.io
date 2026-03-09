import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_for_build');

export async function POST(req: Request) {
  try {
    const { clientId, subject, body, toOverride } = await req.json();

    if (!clientId || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real app, we would query the database for the client's email based on the clientId.
    // For this demo/internal tool, we'll use a placeholder or override if provided.
    const recipientEmail = toOverride || 'client-placeholder@brandtactics.com';

    // Send the email using Resend
    const data = await resend.emails.send({
      from: 'BrandTactics <updates@brandtactics.io>', // Requires domain verification in Resend
      to: [recipientEmail],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #2563EB;">BrandTactics Update</h2>
          <p style="white-space: pre-wrap;">${body}</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">This is an automated update from your team at BrandTactics.</p>
        </div>
      `,
    });

    if (data.error) {
       return NextResponse.json({ error: data.error.message }, { status: 400 });
    }
    
    // Here we could also insert a record into the Supabase email_updates table
    // to track that the email was sent, open rates setup etc.

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

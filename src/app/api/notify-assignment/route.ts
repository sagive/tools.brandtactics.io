import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: Request) {
  try {
    const { email, assignerName, taskTitle, taskUrl } = await req.json();

    if (!email || !assignerName || !taskTitle || !taskUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!resend) {
      console.warn("Resend is not configured. Email not sent.");
      return NextResponse.json({ success: true, warning: 'Resend API key missing' });
    }

    const { data, error } = await resend.emails.send({
      from: 'BrandTactics <updates@tools.brandtactics.io>',
      to: email,
      subject: `You've been assigned a new task: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4640A0;">Task Assignment</h2>
          <p><strong>${assignerName}</strong> assigned you the task: <strong>${taskTitle}</strong></p>
          <br/>
          <p>Click below to view and manage this task in your dashboard:</p>
          <a href="${taskUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4640A0; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Task</a>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending assignment email:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

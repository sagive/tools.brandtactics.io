import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

    // Initialize Supabase admin client to fetch global email settings
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: settings } = await supabaseAdmin
      .from('app_settings')
      .select('email_scenarios, email_template')
      .eq('id', 'global')
      .single();

    let subject = `You've been assigned a new task: ${taskTitle}`;
    let bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #4640A0;">Task Assignment</h2>
        <p><strong>${assignerName}</strong> assigned you the task: <strong>${taskTitle}</strong></p>
        <br/>
        <p>Click below to view and manage this task in your dashboard:</p>
        <a href="${taskUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4640A0; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Task</a>
      </div>
    `;

    if (settings?.email_scenarios?.task_assignment) {
      const scenario = settings.email_scenarios.task_assignment;
      if (scenario.subject) {
        subject = scenario.subject.replace(/\[task_title\]/g, taskTitle);
      }
      if (scenario.body) {
        bodyHtml = scenario.body
          .replace(/\[assigner_name\]/g, assignerName)
          .replace(/\[task_title\]/g, taskTitle)
          .replace(/\[task_link\]/g, taskUrl);
      }
    }

    // Wrap with global email template if defined
    let htmlTemplate = '<div>[content]</div>';
    if (settings?.email_template) {
      htmlTemplate = settings.email_template;
    }
    const finalHtml = htmlTemplate.replace('[content]', bodyHtml);

    const { data, error } = await resend.emails.send({
      from: 'BrandTactics <updates@tools.brandtactics.io>',
      to: email,
      subject: subject,
      html: finalHtml,
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

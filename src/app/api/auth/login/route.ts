import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.btools_SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check if user exists in the public.users table
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error("Database error checking user:", userError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Only send the email if the user exists
    if (!userRecord) {
      // We return success to prevent email enumeration, but we don't send anything
      // Or if the user prefers, we can return an error. 
      // The user said "and only if the user still exists", implying we should check.
      // Let's return success but log it.
      console.log(`Login attempt for non-existent user: ${email}`);
      return NextResponse.json({ success: true, message: 'If account exists, email sent.' });
    }

    // 2. Generate Magic Link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${new URL(req.url).origin}/dashboard`
      }
    });

    if (linkError) {
      console.error("Magic link generation error:", linkError);
      return NextResponse.json({ error: linkError.message }, { status: 400 });
    }

    const loginUrl = linkData.properties?.action_link;
    if (!loginUrl) {
      return NextResponse.json({ error: 'Failed to generate login link' }, { status: 500 });
    }

    // 3. Send Email via Resend
    if (resend) {
      const { data: settings } = await supabaseAdmin
        .from('app_settings')
        .select('email_scenarios, email_template')
        .eq('id', 'global')
        .single();

      let subject = "Your BrandTactics Login Link";
      let bodyHtml = `
        <p>Hello ${userRecord.full_name || 'there'},</p>
        <p>You requested a magic link to sign in to the BrandTactics staff portal.</p>
        <p><strong>This link will only work once and will expire in 1 hour.</strong></p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Sign In Now</a>
        </div>
        <p style="font-size: 11px; margin-top: 24px; color: #94a3b8;">If you didn't request this, you can safely ignore this email.</p>
      `;

      if (settings?.email_scenarios?.magic_link) {
        const scenario = settings.email_scenarios.magic_link;
        if (scenario.subject) {
          subject = scenario.subject;
        }
        if (scenario.body) {
          bodyHtml = scenario.body
            .replace(/\[user_name\]/g, userRecord.full_name || 'there')
            .replace(/\[login_link\]/g, loginUrl);
        }
      }

      // Wrap with global email template if defined
      let htmlTemplate = '<div>[content]</div>';
      if (settings?.email_template) {
        htmlTemplate = settings.email_template;
      }
      const finalHtml = htmlTemplate.replace('[content]', bodyHtml);

      await resend.emails.send({
        from: 'BrandTactics <updates@tools.brandtactics.io>',
        to: [email],
        subject: subject,
        html: finalHtml,
      });
    } else {
      console.log(`[SIMULATION] Login link for ${email}: ${loginUrl}`);
    }

    return NextResponse.json({ success: true, message: 'Magic link sent.' });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

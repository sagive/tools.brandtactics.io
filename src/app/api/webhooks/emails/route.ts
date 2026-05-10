import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

/**
 * Webhook for external email dispatch (e.g., from n8n)
 * Endpoint: /api/webhooks/emails
 * Method: POST
 * Auth: X-Webhook-Secret header
 */

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(request: Request) {
  try {
    // 1. Security Check
    const secret = request.headers.get('X-Webhook-Secret');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration error in webhook');
      return NextResponse.json({ error: 'Server database configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch secret from DB
    const { data: settings } = await supabaseAdmin.from('app_settings').select('webhook_secret, email_template').eq('id', 'global').single();
    const expectedSecret = settings?.webhook_secret || process.env.WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('WEBHOOK_SECRET is not set in DB or environment');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Request Body
    const body = await request.json();
    const { 
      clientId, 
      subject, 
      content
    } = body;

    // 3. Validation
    if (!clientId || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields: clientId, subject, content' }, { status: 400 });
    }

    // 4. Fetch Client Details
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('name, contact_email')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('Client not found:', clientId);
      return NextResponse.json({ error: 'Invalid clientId: Client does not exist' }, { status: 400 });
    }

    if (!client.contact_email) {
      return NextResponse.json({ error: 'Client has no contact_email configured' }, { status: 400 });
    }

    // 5. Prepare Email Content
    const htmlTemplate = settings?.email_template || '<div>[content]</div>';
    const finalHtml = htmlTemplate.replace('[content]', content);

    // 6. Send Email via Resend
    let status = 'Queued';
    let resendData = null;

    if (resend) {
      const recipients = client.contact_email
        .split(',')
        .map((email: string) => email.trim())
        .filter((email: string) => email.length > 0);

      const response = await resend.emails.send({
        from: 'BrandTactics <updates@tools.brandtactics.io>',
        to: recipients,
        subject: subject,
        html: finalHtml,
      });

      if (response.error) {
        console.error("Resend Error:", response.error);
        return NextResponse.json({ error: 'Failed to send email via Resend', details: response.error.message }, { status: 500 });
      }
      resendData = response.data;
      status = 'Delivered';
    } else {
      console.log(`[SIMULATION] Webhook would send email to ${client.contact_email}`);
      status = 'Delivered'; // In simulation mode we mark as delivered
    }

    // 7. Log to email_updates table
    const { error: logError } = await supabaseAdmin.from('email_updates').insert({
      client_id: clientId,
      title: subject,
      recipient_email: client.contact_email,
      status: status,
      sent_date: new Date().toISOString(),
      body: finalHtml
    });

    if (logError) {
      console.error('Database logging error:', logError);
      // We don't return 500 here because the email was already sent
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email processed successfully', 
      status,
      recipient: client.contact_email,
      resendId: resendData?.id
    });

  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}

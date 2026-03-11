import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: Request) {
  try {
    const { clientId, subject, body } = await req.json();

    if (!clientId || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch Client Details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, contact_email')
      .eq('id', clientId)
      .single();

    if (clientError || !client || !client.contact_email) {
      return NextResponse.json({ error: 'Client not found or has no contact email' }, { status: 400 });
    }

    // 2. Fetch Global Email Template
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('email_template')
      .eq('id', 'global')
      .single();

    let htmlTemplate = '<div>[content]</div>'; // Fallback
    if (!settingsError && settings?.email_template) {
      htmlTemplate = settings.email_template;
    }

    // 3. Prepare the HTML content
    const formattedBody = `<p style="white-space: pre-wrap; font-size: 16px;">${body}</p>`;
    const finalHtml = htmlTemplate.replace('[content]', formattedBody);

    // 4. Send Email
    let status = 'Queued';
    let resendData = null;

    if (resend) {
      const response = await resend.emails.send({
        from: 'BrandTactics <updates@brandtactics.io>',
        to: [client.contact_email],
        subject: subject,
        html: finalHtml,
      });

      if (response.error) {
        console.error("Resend Error:", response.error);
        return NextResponse.json({ error: response.error.message }, { status: 400 });
      }
      resendData = response.data;
      status = 'Delivered';
    } else {
      console.log(`[SIMULATION] Would send to ${client.contact_email}`);
      console.log(`[SIMULATION] Subject: ${subject}`);
      status = 'Delivered';
    }
    
    // 5. Log to Supabase
    await supabase.from('email_updates').insert({
      client_id: clientId,
      title: subject,
      recipient_email: client.contact_email,
      status: status,
      sent_date: new Date().toISOString(),
      body: finalHtml
    });

    return NextResponse.json({ success: true, simulated: !resend, data: resendData });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

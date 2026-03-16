import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Use standard URL and Anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    
    // Create an authenticated Supabase client for this request using the user's session token
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader || ''
        }
      }
    });

    const { clientId, subject, body, scheduledFor } = await req.json();

    if (!clientId || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch Client Details
    const { data: client, error: clientError } = await authenticatedSupabase
      .from('clients')
      .select('name, contact_email')
      .eq('id', clientId)
      .single();

    if (clientError || !client || !client.contact_email) {
      console.error("Client Fetch Error Details:", clientError);
      console.error("Auth header used:", authHeader ? "Present" : "Missing");
      return NextResponse.json({ 
        error: 'Client not found or has no contact email',
        details: clientError,
        clientData: client,
        hasAuthHeader: !!authHeader
      }, { status: 400 });
    }

    // 2. Fetch Global Email Template
    const { data: settings, error: settingsError } = await authenticatedSupabase
      .from('app_settings')
      .select('email_template')
      .eq('id', 'global')
      .single();

    let htmlTemplate = '<div>[content]</div>'; // Fallback
    if (!settingsError && settings?.email_template) {
      htmlTemplate = settings.email_template;
    }

    // 3. Prepare the HTML content
    const finalHtml = htmlTemplate.replace('[content]', body);

    // 4. Send Email logic
    let status = scheduledFor ? 'Scheduled' : 'Queued';
    let resendData = null;

    if (scheduledFor) {
      // INTERNAL SCHEDULER: Skip sending to Resend right now.
      // We purely rely on the Vercel Cron to pick this up later.
      console.log(`[SCHEDULER] Skipping immediate dispatch. Saving to database for later execution: ${new Date(scheduledFor).toISOString()}`);
    } else {
      // Immediate delivery
      if (resend) {
        const emailPayload: any = {
          from: 'BrandTactics <updates@tools.brandtactics.io>',
          to: [client.contact_email],
          subject: subject,
          html: finalHtml,
        };

        const response = await resend.emails.send(emailPayload);

        if (response.error) {
          console.error("Resend Error:", response.error);
          return NextResponse.json({ error: response.error.message }, { status: 400 });
        }
        resendData = response.data;
        status = 'Delivered';
      } else {
        console.log(`[SIMULATION] Would send NOW to ${client.contact_email}`);
        console.log(`[SIMULATION] Subject: ${subject}`);
        status = 'Delivered';
      }
    }
    
    // 5. Log to Supabase
    const { error: logError } = await authenticatedSupabase.from('email_updates').insert({
      client_id: clientId,
      title: subject,
      recipient_email: client.contact_email,
      status: status,
      sent_date: new Date().toISOString(),
      body: finalHtml,
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null
    });

    if (logError) {
      console.error("Log Error:", logError);
      // Hard fail if we can't save to the database, so the UI knows
      return NextResponse.json({ error: `Database Save Error: ${logError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, simulated: !resend, data: resendData });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

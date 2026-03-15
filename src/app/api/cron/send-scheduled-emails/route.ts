import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
       console.error("Missing Supabase env configuration for cron");
       return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // 1. Find all emails that are Scheduled and whose scheduled_for time is past or now
    const now = new Date().toISOString();
    
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_updates')
      .select('*')
      .eq('status', 'Scheduled')
      .lte('scheduled_for', now);

    if (fetchError) {
      console.error("Error fetching scheduled emails:", fetchError);
      return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ success: true, message: "No pending emails to send." });
    }

    console.log(`Found ${pendingEmails.length} emails to process...`);
    const results = [];

    // 2. Process each email
    for (const email of pendingEmails) {
       if (resend) {
          const emailPayload = {
            from: 'BrandTactics <updates@tools.brandtactics.io>',
            to: [email.recipient_email],
            subject: email.title,
            html: email.body,
          };
          
          const response = await resend.emails.send(emailPayload);
          
          if (response.error) {
            console.error(`Failed to send email ID ${email.id}:`, response.error);
            results.push({ id: email.id, status: 'Failed', error: response.error.message });
            
            // Mark as failed in DB so we don't infinitely retry broken ones without a backoff, or we just leave them?
            await supabase.from('email_updates').update({ status: 'Failed' }).eq('id', email.id);
          } else {
            console.log(`Successfully sent email ID ${email.id}`);
            results.push({ id: email.id, status: 'Delivered' });
            
            await supabase.from('email_updates').update({ 
              status: 'Delivered', 
              sent_date: new Date().toISOString() 
            }).eq('id', email.id);
          }
       } else {
          console.log(`[SIMULATION] Cron would send email ID ${email.id} to ${email.recipient_email}`);
          results.push({ id: email.id, status: 'Simulated' });
          
          await supabase.from('email_updates').update({ 
            status: 'Delivered', 
            sent_date: new Date().toISOString() 
          }).eq('id', email.id);
       }
    }

    return NextResponse.json({ success: true, processed: pendingEmails.length, results });

  } catch (error: any) {
    console.error("Cron Execution Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

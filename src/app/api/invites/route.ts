import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.btools_SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY configured on server' }, { status: 500 });
    }

    // Create Admin Client with Service Role Key (bypasses RLS, can create auth users)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Generate Invite Link from Supabase Auth Admin
    let linkData, linkError;

    const res = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
    });

    if (res.error && res.error.message.includes('registered')) {
      // User already exists, generate a magic link instead
      const magicRes = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });
      linkData = magicRes.data;
      linkError = magicRes.error;
    } else {
      linkData = res.data;
      linkError = res.error;
    }

    if (linkError) {
      console.error("Invite Link Generation Error:", linkError);
      return NextResponse.json({ error: linkError.message }, { status: 400 });
    }

    const inviteUrl = linkData.properties?.action_link;
    if (!inviteUrl) {
      return NextResponse.json({ error: 'Failed to generate action link' }, { status: 500 });
    }

    // 2. Update the newly created (via trigger) user record in public.users
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        role: role || 'viewer', 
        status: 'invited', 
        invited_at: new Date().toISOString() 
      })
      .eq('email', email);

    if (updateError) {
      console.error("User Sync Update Error:", updateError);
      // We don't hard throw here because the invite link is generated, but it's bad.
    }

    // 3. Send custom Email via Resend
    let status = 'Queued';
    let resendData = null;

    if (resend) {
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: white;">
          <h2 style="color: #2563eb; margin-top: 0;">You've been invited!</h2>
          <div style="background: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #f1f5f9; color: #334155; line-height: 1.6;">
            <p>You have been invited to join the BrandTactics portal as a <strong>${role || 'viewer'}</strong>.</p>
            <p>Click the button below to set your password and access your account.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
            </div>
            <p style="font-size: 11px; margin-top: 24px; color: #94a3b8;">Or copy and paste this link: <br/> ${inviteUrl}</p>
          </div>
        </div>
      `;

      const response = await resend.emails.send({
        from: 'BrandTactics <updates@tools.brandtactics.io>',
        to: [email],
        subject: "You're invited to BrandTactics",
        html: htmlContent,
      });

      if (response.error) {
        console.error("Resend Error:", response.error);
        return NextResponse.json({ error: response.error.message }, { status: 400 });
      }
      resendData = response.data;
      status = 'Delivered';
    } else {
      console.log(`[SIMULATION] Would invite ${email} with url: ${inviteUrl}`);
      status = 'Simulated';
    }

    return NextResponse.json({ success: true, url: inviteUrl, status });
  } catch (error: any) {
    console.error("Invites API Error:", error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing user ID or email' }, { status: 400 });
    }

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.btools_SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    // Create Admin Client with Service Role Key (bypasses RLS, can create auth users)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Delete from auth.users (will cascade to public.users if configured, else manual)
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
       console.error("List users error:", listError);
       return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
    }

    const authUser = users.users.find(u => u.email === email);
    
    if (authUser) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      if (deleteAuthError) {
        console.error("Delete Auth User Error:", deleteAuthError);
        return NextResponse.json({ error: deleteAuthError.message }, { status: 400 });
      }
    }

    // 2. Ensuring deletion from public.users (in case cascade isn't set up)
    await supabaseAdmin.from('users').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Invite Error:", error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

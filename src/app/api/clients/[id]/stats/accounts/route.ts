import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { listAvailableAccounts, getGoogleCredentials } from '@/lib/google-stats';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.btools_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.btools_SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const clientId = resolvedParams.id;

    // 1. Fetch available accounts from Google
    const accountsData = await listAvailableAccounts();
    const creds = getGoogleCredentials();
    const serviceAccountEmail = creds?.client_email || 'brandtactics-seo-reader@seo-connectors.iam.gserviceaccount.com';

    // 2. Fetch current client saved stats settings
    let clientSettings = {
      website: '',
      gsc_site_url: '',
      ga4_property_id: '',
      auto_detected_gsc: '',
    };

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = getSupabase();
      const { data: client, error } = await supabase
        .from('clients')
        .select('name, website, official_info')
        .eq('id', clientId)
        .single();

      if (client && !error) {
        const official = (client.official_info && typeof client.official_info === 'object') ? client.official_info : {};
        const seoStats = official.seo_stats || {};

        clientSettings.website = client.website || official.official_website || '';
        clientSettings.gsc_site_url = seoStats.gsc_site_url || '';
        clientSettings.ga4_property_id = seoStats.ga4_property_id || '';

        // Auto-detect GSC site if not yet explicitly saved
        if (!clientSettings.gsc_site_url && clientSettings.website && accountsData.gscSites.length > 0) {
          const cleanWeb = clientSettings.website.replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
          const matched = accountsData.gscSites.find((site) => {
            const cleanSite = site.siteUrl.replace(/^sc-domain:/i, '').replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
            return cleanSite === cleanWeb || cleanWeb.includes(cleanSite) || cleanSite.includes(cleanWeb);
          });
          if (matched) {
            clientSettings.auto_detected_gsc = matched.siteUrl;
            if (!clientSettings.gsc_site_url) {
              clientSettings.gsc_site_url = matched.siteUrl;
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      serviceAccountEmail,
      clientSettings,
      gscSites: accountsData.gscSites,
      ga4Properties: accountsData.ga4Properties,
      gscError: accountsData.gscError,
      ga4Error: accountsData.ga4Error,
    });
  } catch (err: any) {
    console.error('Error in stats/accounts GET:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const clientId = resolvedParams.id;
    const body = await req.json();

    const { gsc_site_url, ga4_property_id } = body;

    const supabase = getSupabase();
    // Fetch existing official_info to merge cleanly
    const { data: client, error: fetchErr } = await supabase
      .from('clients')
      .select('official_info')
      .eq('id', clientId)
      .single();

    if (fetchErr) {
      throw fetchErr;
    }

    const currentOfficial = (client?.official_info && typeof client.official_info === 'object')
      ? client.official_info
      : {};

    const updatedOfficial = {
      ...currentOfficial,
      seo_stats: {
        ...(currentOfficial.seo_stats || {}),
        gsc_site_url: gsc_site_url || '',
        ga4_property_id: ga4_property_id || '',
        updated_at: new Date().toISOString(),
      },
    };

    const { error: updateErr } = await supabase
      .from('clients')
      .update({ official_info: updatedOfficial })
      .eq('id', clientId);

    if (updateErr) {
      throw updateErr;
    }

    return NextResponse.json({
      success: true,
      seo_stats: updatedOfficial.seo_stats,
    });
  } catch (err: any) {
    console.error('Error in stats/accounts POST:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save stats settings' },
      { status: 500 }
    );
  }
}

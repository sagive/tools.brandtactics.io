import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSearchConsoleStats, getAnalyticsStats } from '@/lib/google-stats';

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

    const { searchParams } = new URL(req.url);
    let gscSiteUrl = searchParams.get('gscSiteUrl') || '';
    let ga4PropertyId = searchParams.get('ga4PropertyId') || '';

    // If not supplied in query, fetch from client settings
    if (!gscSiteUrl || !ga4PropertyId) {
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = getSupabase();
        const { data: client } = await supabase
          .from('clients')
          .select('website, official_info')
          .eq('id', clientId)
          .single();

        if (client) {
          const official = (client.official_info && typeof client.official_info === 'object') ? client.official_info : {};
          const seoStats = official.seo_stats || {};

          if (!gscSiteUrl) {
            gscSiteUrl = seoStats.gsc_site_url || '';
          }
          if (!ga4PropertyId) {
            ga4PropertyId = seoStats.ga4_property_id || '';
          }
        }
      }
    }

    // Default dates: last 28 days ending 2 days ago (due to GSC data latency)
    const now = new Date();
    const defaultEnd = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const defaultStart = new Date(defaultEnd.getTime() - 27 * 24 * 60 * 60 * 1000);

    const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

    const startDate = searchParams.get('startDate') || fmtDate(defaultStart);
    const endDate = searchParams.get('endDate') || fmtDate(defaultEnd);
    const compareStartDate = searchParams.get('compareStartDate') || undefined;
    const compareEndDate = searchParams.get('compareEndDate') || undefined;

    let gscData = null;
    let ga4Data = null;
    let gscError = null;
    let ga4Error = null;

    const promises: Promise<any>[] = [];

    // Query Search Console if site URL provided
    if (gscSiteUrl) {
      promises.push(
        getSearchConsoleStats({
          siteUrl: gscSiteUrl,
          startDate,
          endDate,
          compareStartDate,
          compareEndDate,
        })
          .then((res) => {
            gscData = res;
          })
          .catch((err: any) => {
            console.error('GSC query error:', err?.message || err);
            gscError = err?.message || 'Search Console query error';
          })
      );
    }

    // Query GA4 if property ID provided
    if (ga4PropertyId) {
      promises.push(
        getAnalyticsStats({
          propertyId: ga4PropertyId,
          startDate,
          endDate,
          compareStartDate,
          compareEndDate,
        })
          .then((res) => {
            ga4Data = res;
          })
          .catch((err: any) => {
            console.error('GA4 query error:', err?.message || err);
            ga4Error = err?.message || 'Google Analytics query error';
          })
      );
    }

    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      dates: {
        startDate,
        endDate,
        compareStartDate,
        compareEndDate,
      },
      configured: {
        gscSiteUrl,
        ga4PropertyId,
      },
      gsc: gscData,
      ga4: ga4Data,
      errors: {
        gsc: gscError,
        ga4: ga4Error,
      },
    });
  } catch (err: any) {
    console.error('Error in stats route:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

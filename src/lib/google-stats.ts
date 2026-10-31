import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export function getGoogleCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch {
      try {
        const decoded = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
        return JSON.parse(decoded);
      } catch (err) {
        console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', err);
      }
    }
  }

  const localPaths = [
    path.join(process.cwd(), 'secrets', 'gcp_service_account.json'),
    path.join('d:', 'Websites', 'tools.brandtactics.io', 'secrets', 'gcp_service_account.json'),
    path.join('d:', 'Websites', 'browser-agent', 'dolphin-agent', 'secrets', 'gcp_service_account.json'),
  ];

  for (const p of localPaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (err) {
        console.error(`Error reading ${p}:`, err);
      }
    }
  }

  return null;
}

export function getGoogleAuth() {
  const credentials = getGoogleCredentials();
  if (!credentials || !credentials.client_email || !credentials.private_key) {
    throw new Error('Google Service Account credentials not found or invalid.');
  }

  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
    ],
  });
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Lists all Search Console sites and GA4 properties accessible by the service account.
 */
export async function listAvailableAccounts() {
  let gscSites: Array<{ siteUrl: string; permissionLevel?: string }> = [];
  const ga4Properties: Array<{ propertyId: string; displayName: string; accountName?: string }> = [];
  let gscError: string | null = null;
  let ga4Error: string | null = null;

  try {
    const auth = getGoogleAuth();

    // 1. Fetch Search Console sites
    try {
      const searchconsole = google.searchconsole({ version: 'v1', auth });
      const res = await searchconsole.sites.list();
      if (res.data.siteEntry) {
        gscSites = res.data.siteEntry
          .filter((entry) => !!entry.siteUrl)
          .map((entry) => ({
            siteUrl: entry.siteUrl!,
            permissionLevel: entry.permissionLevel || undefined,
          }));
      }
    } catch (err: unknown) {
      console.error('Error fetching GSC sites:', getErrorMessage(err));
      gscError = getErrorMessage(err);
    }

    // 2. Fetch GA4 properties (via Admin API if enabled)
    try {
      const analyticsadmin = google.analyticsadmin({ version: 'v1beta', auth });
      const res = await analyticsadmin.accountSummaries.list({ pageSize: 200 });
      if (res.data.accountSummaries) {
        for (const account of res.data.accountSummaries) {
          if (account.propertySummaries) {
            for (const prop of account.propertySummaries) {
              if (prop.property) {
                const rawId = prop.property.replace('properties/', '');
                ga4Properties.push({
                  propertyId: rawId,
                  displayName: prop.displayName || `Property ${rawId}`,
                  accountName: account.displayName || undefined,
                });
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      ga4Error = getErrorMessage(err);
    }
  } catch (err: unknown) {
    return {
      gscSites: [],
      ga4Properties: [],
      gscError: getErrorMessage(err),
      ga4Error: getErrorMessage(err),
    };
  }

  return {
    gscSites,
    ga4Properties,
    gscError,
    ga4Error,
  };
}

/**
 * Fetch Search Console metrics for a date range and optional comparison range.
 */
export async function getSearchConsoleStats(params: {
  siteUrl: string;
  startDate: string;
  endDate: string;
  compareStartDate?: string;
  compareEndDate?: string;
}) {
  const auth = getGoogleAuth();
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const { siteUrl, startDate, endDate, compareStartDate, compareEndDate } = params;

  // 1. Overall stats for primary period
  const primaryPromise = searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: [],
    },
  });

  // 2. Comparison stats (if requested)
  const comparePromise = (compareStartDate && compareEndDate)
    ? searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: compareStartDate,
          endDate: compareEndDate,
          dimensions: [],
        },
      })
    : Promise.resolve({ data: { rows: [] } });

  // 3. Top queries (up to 50)
  const queriesPromise = searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 50,
    },
  });

  // 4. Top pages (up to 50)
  const pagesPromise = searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 50,
    },
  });

  // 5. Daily trend
  const dailyPromise = searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 500,
    },
  });

  const [primaryRes, compareRes, queriesRes, pagesRes, dailyRes] = await Promise.all([
    primaryPromise,
    comparePromise,
    queriesPromise,
    pagesPromise,
    dailyPromise,
  ]);

  const pRow = primaryRes.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const cRow = compareRes.data.rows?.[0] || null;

  return {
    summary: {
      clicks: pRow.clicks || 0,
      impressions: pRow.impressions || 0,
      ctr: pRow.ctr ? Number((pRow.ctr * 100).toFixed(2)) : 0,
      position: pRow.position ? Number(pRow.position.toFixed(1)) : 0,
    },
    compareSummary: cRow
      ? {
          clicks: cRow.clicks || 0,
          impressions: cRow.impressions || 0,
          ctr: cRow.ctr ? Number((cRow.ctr * 100).toFixed(2)) : 0,
          position: cRow.position ? Number(cRow.position.toFixed(1)) : 0,
        }
      : null,
    topQueries: (queriesRes.data.rows || []).map((r) => ({
      query: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr ? Number((r.ctr * 100).toFixed(2)) : 0,
      position: r.position ? Number(r.position.toFixed(1)) : 0,
    })),
    topPages: (pagesRes.data.rows || []).map((r) => ({
      page: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr ? Number((r.ctr * 100).toFixed(2)) : 0,
      position: r.position ? Number(r.position.toFixed(1)) : 0,
    })),
    dailyTrend: (dailyRes.data.rows || [])
      .map((r) => ({
        date: r.keys?.[0] || '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr ? Number((r.ctr * 100).toFixed(2)) : 0,
        position: r.position ? Number(r.position.toFixed(1)) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/**
 * Fetch Google Analytics 4 stats for a property ID.
 */
export async function getAnalyticsStats(params: {
  propertyId: string;
  startDate: string;
  endDate: string;
  compareStartDate?: string;
  compareEndDate?: string;
}) {
  const auth = getGoogleAuth();
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
  const { propertyId, startDate, endDate, compareStartDate, compareEndDate } = params;
  const property = `properties/${propertyId}`;

  // 1. Overall Summary
  const primaryPromise = analyticsdata.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
    },
  });

  // 2. Comparison Summary (if requested)
  const comparePromise = (compareStartDate && compareEndDate)
    ? analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: compareStartDate, endDate: compareEndDate }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
        },
      })
    : Promise.resolve({ data: { rows: [] } });

  // 3. Daily trend
  const dailyPromise = analyticsdata.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    },
  });

  // 4. Traffic Channels
  const channelsPromise = analyticsdata.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: '10',
    },
  });

  // 5. Top landing pages
  const landingPagesPromise = analyticsdata.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'landingPage' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: '25',
    },
  });

  const [primaryRes, compareRes, dailyRes, channelsRes, landingRes] = await Promise.all([
    primaryPromise,
    comparePromise,
    dailyPromise,
    channelsPromise,
    landingPagesPromise,
  ]);

  const pMetrics = primaryRes.data.rows?.[0]?.metricValues || [];
  const activeUsers = Number(pMetrics[0]?.value || 0);
  const sessions = Number(pMetrics[1]?.value || 0);
  const pageViews = Number(pMetrics[2]?.value || 0);
  const bounceRate = Number((Number(pMetrics[3]?.value || 0) * 100).toFixed(1));
  const avgSessionDuration = Number(Number(pMetrics[4]?.value || 0).toFixed(0));

  let compareSummary = null;
  if (compareRes.data.rows?.[0]?.metricValues) {
    const cMetrics = compareRes.data.rows[0].metricValues;
    compareSummary = {
      activeUsers: Number(cMetrics[0]?.value || 0),
      sessions: Number(cMetrics[1]?.value || 0),
      pageViews: Number(cMetrics[2]?.value || 0),
      bounceRate: Number((Number(cMetrics[3]?.value || 0) * 100).toFixed(1)),
      avgSessionDuration: Number(Number(cMetrics[4]?.value || 0).toFixed(0)),
    };
  }

  return {
    summary: {
      activeUsers,
      sessions,
      pageViews,
      bounceRate,
      avgSessionDuration,
    },
    compareSummary,
    dailyTrend: (dailyRes.data.rows || []).map((r) => {
      const rawDate = r.dimensionValues?.[0]?.value || '';
      const formattedDate =
        rawDate.length === 8
          ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
          : rawDate;
      return {
        date: formattedDate,
        activeUsers: Number(r.metricValues?.[0]?.value || 0),
        sessions: Number(r.metricValues?.[1]?.value || 0),
        pageViews: Number(r.metricValues?.[2]?.value || 0),
      };
    }),
    channels: (channelsRes.data.rows || []).map((r) => ({
      channel: r.dimensionValues?.[0]?.value || 'Other',
      sessions: Number(r.metricValues?.[0]?.value || 0),
      activeUsers: Number(r.metricValues?.[1]?.value || 0),
    })),
    landingPages: (landingRes.data.rows || []).map((r) => ({
      landingPage: r.dimensionValues?.[0]?.value || '/',
      sessions: Number(r.metricValues?.[0]?.value || 0),
      activeUsers: Number(r.metricValues?.[1]?.value || 0),
      pageViews: Number(r.metricValues?.[2]?.value || 0),
    })),
  };
}

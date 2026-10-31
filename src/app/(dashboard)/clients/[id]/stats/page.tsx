"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  Percent,
  Search,
  Users,
  Activity,
  Layers,
  RefreshCw,
  Check,
  Copy,
  ExternalLink,
  Globe,
  BarChart3,
  Calendar,
  AlertCircle,
  Settings2,
  ChevronDown,
  ChevronUp,
  Laptop,
  Smartphone,
  Tablet,
  Target,
  Award,
  Flag,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface StatsData {
  summary: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  compareSummary: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  } | null;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    clicksDiff?: number;
    posDiff?: number;
    isNew?: boolean;
  }>;
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  dailyTrend: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  devices?: Array<{
    device: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  countries?: Array<{
    country: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  appearances?: Array<{
    appearance: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

interface GA4StatsData {
  summary: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
  compareSummary: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
  } | null;
  dailyTrend: Array<{
    date: string;
    activeUsers: number;
    sessions: number;
    pageViews: number;
  }>;
  channels: Array<{
    channel: string;
    sessions: number;
    activeUsers: number;
  }>;
  landingPages: Array<{
    landingPage: string;
    sessions: number;
    activeUsers: number;
    pageViews: number;
  }>;
  pagesWithTitles?: Array<{
    title: string;
    path: string;
    views: number;
    activeUsers: number;
    sessions: number;
    bounceRate: number;
  }>;
  events?: Array<{
    eventName: string;
    count: number;
    conversions: number;
  }>;
}

export default function ClientStatsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const clientId = (React.use(params as Promise<{ id: string }>) || (params as any)).id;

  // Single-row configuration fields
  const [clientWebsite, setClientWebsite] = useState("");
  const [inputGa4Property, setInputGa4Property] = useState("");
  const [ga4PropertyId, setGa4PropertyId] = useState("");
  const [isClientLoading, setIsClientLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [serviceAccountEmail] = useState(
    "brandtactics-seo-reader@seo-connectors.iam.gserviceaccount.com"
  );
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Date range presets: "7d" | "28d" | "90d" | "thisMonth"
  const [datePreset, setDatePreset] = useState("28d");
  const [compareEnabled, setCompareEnabled] = useState(true);

  // Data fetching state
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [gscData, setGscData] = useState<StatsData | null>(null);
  const [ga4Data, setGa4Data] = useState<GA4StatsData | null>(null);
  const [gscError, setGscError] = useState<string | null>(null);
  const [ga4Error, setGa4Error] = useState<string | null>(null);

  // Table filters & active tab
  const [querySearch, setQuerySearch] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [activeTab, setActiveTab] = useState("gsc");

  // Calculate dates based on preset
  const dateRange = useMemo(() => {
    const now = new Date();
    // Default GSC end date is 2 days ago due to data latency
    const end = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    let days = 28;

    if (datePreset === "7d") days = 7;
    else if (datePreset === "28d") days = 28;
    else if (datePreset === "90d") days = 90;
    else if (datePreset === "thisMonth") {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const diffTime = Math.max(1, end.getTime() - firstOfMonth.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    const compareEnd = new Date(start.getTime() - 1 * 24 * 60 * 60 * 1000);
    const compareStart = new Date(compareEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    return {
      startDate: fmt(start),
      endDate: fmt(end),
      compareStartDate: compareEnabled ? fmt(compareStart) : undefined,
      compareEndDate: compareEnabled ? fmt(compareEnd) : undefined,
    };
  }, [datePreset, compareEnabled]);

  // Load client from database
  useEffect(() => {
    async function loadClient() {
      setIsClientLoading(true);
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("name, website, official_info")
          .eq("id", clientId)
          .single();

        if (data && !error) {
          const seoStats = data.official_info?.seo_stats || {};
          let web = seoStats.gsc_site_url || data.website || data.official_info?.official_website || "";
          if (web && !web.startsWith("http") && !web.startsWith("sc-domain:")) {
            web = `https://${web.replace(/\/+$/, "")}/`;
          }
          setClientWebsite(web);

          const savedGa4 = seoStats.ga4_property_id || "";
          setInputGa4Property(savedGa4);
          setGa4PropertyId(savedGa4);
        }
      } catch (err) {
        console.error("Error loading client:", err);
      } finally {
        setIsClientLoading(false);
      }
    }

    loadClient();
  }, [clientId]);

  // Fetch stats data
  const fetchStats = async () => {
    if (!clientWebsite) return;

    setIsDataLoading(true);
    setGscError(null);
    setGa4Error(null);

    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      if (dateRange.compareStartDate && dateRange.compareEndDate) {
        params.append("compareStartDate", dateRange.compareStartDate);
        params.append("compareEndDate", dateRange.compareEndDate);
      }

      params.append("website", clientWebsite);
      params.append("gscSiteUrl", clientWebsite);

      if (ga4PropertyId) {
        params.append("ga4PropertyId", ga4PropertyId);
      }

      const res = await fetch(`/api/clients/${clientId}/stats?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setGscData(data.gsc || null);
        setGa4Data(data.ga4 || null);
        if (data.errors?.gsc) setGscError(data.errors.gsc);
        if (data.errors?.ga4) setGa4Error(data.errors.ga4);
      } else {
        toast.error(data.error || "Failed to load statistics");
      }
    } catch (err: unknown) {
      console.error("Fetch stats error:", err);
      toast.error("Network error while fetching stats");
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (!isClientLoading && clientWebsite) {
      fetchStats();
    }
  }, [isClientLoading, clientWebsite, ga4PropertyId, dateRange]);

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      let gscUrl = clientWebsite.trim();
      if (gscUrl && !gscUrl.startsWith("http://") && !gscUrl.startsWith("https://") && !gscUrl.startsWith("sc-domain:")) {
        gscUrl = `https://${gscUrl}/`;
      }

      const res = await fetch(`/api/clients/${clientId}/stats/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gsc_site_url: gscUrl,
          ga4_property_id: inputGa4Property.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClientWebsite(gscUrl);
        setGa4PropertyId(inputGa4Property.trim());
        toast.success("Settings saved successfully");
        fetchStats();
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (err: unknown) {
      toast.error("Save error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    toast.success("אימייל הועתק ללוח!", {
      description: "הוסף אותו כ-Viewer ב-Search Console וב-GA4 (לחץ על 'Where to put this?' לקישורים ישירים).",
    });
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Percentage change calculation
  const calcChange = (curr: number, prev: number | null | undefined, invert = false) => {
    if (prev === null || prev === undefined || prev === 0) return null;
    const diff = ((curr - prev) / prev) * 100;
    const isPositive = invert ? diff <= 0 : diff >= 0;
    return {
      value: Math.abs(Number(diff.toFixed(1))),
      isPositive,
      raw: diff,
    };
  };

  // Country names and flags mapping
  const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
    isr: { name: "ישראל (Israel)", flag: "🇮🇱" },
    usa: { name: "ארצות הברית (USA)", flag: "🇺🇸" },
    gbr: { name: "בריטניה (UK)", flag: "🇬🇧" },
    fra: { name: "צרפת (France)", flag: "🇫🇷" },
    deu: { name: "גרמניה (Germany)", flag: "🇩🇪" },
    can: { name: "קנדה (Canada)", flag: "🇨🇦" },
    rus: { name: "רוסיה (Russia)", flag: "🇷🇺" },
    ukr: { name: "אוקראינה (Ukraine)", flag: "🇺🇦" },
    esp: { name: "ספרד (Spain)", flag: "🇪🇸" },
    ita: { name: "איטליה (Italy)", flag: "🇮🇹" },
    nld: { name: "הולנד (Netherlands)", flag: "🇳🇱" },
    aus: { name: "אוסטרליה (Australia)", flag: "🇦🇺" },
    bra: { name: "ברזיל (Brazil)", flag: "🇧🇷" },
    ind: { name: "הודו (India)", flag: "🇮🇳" },
    tur: { name: "טורקיה (Turkey)", flag: "🇹🇷" },
    che: { name: "שוויץ (Switzerland)", flag: "🇨🇭" },
    bel: { name: "בלגיה (Belgium)", flag: "🇧🇪" },
    swe: { name: "שוודיה (Sweden)", flag: "🇸🇪" },
    pol: { name: "פולין (Poland)", flag: "🇵🇱" },
    grc: { name: "יוון (Greece)", flag: "🇬🇷" },
    cyp: { name: "קפריסין (Cyprus)", flag: "🇨🇾" },
    are: { name: "איחוד האמירויות (UAE)", flag: "🇦🇪" },
  };

  function formatCountry(code: string) {
    const lower = code.toLowerCase();
    if (COUNTRY_MAP[lower]) {
      return `${COUNTRY_MAP[lower].flag} ${COUNTRY_MAP[lower].name}`;
    }
    return `🌐 ${code.toUpperCase()}`;
  }

  // Filter queries
  const filteredQueries = useMemo(() => {
    if (!gscData?.topQueries) return [];
    if (!querySearch.trim()) return gscData.topQueries;
    return gscData.topQueries.filter((q) =>
      q.query.toLowerCase().includes(querySearch.toLowerCase())
    );
  }, [gscData?.topQueries, querySearch]);

  // Striking Distance: queries ranked between #8 and #20 (high potential fast wins)
  const strikingQueries = useMemo(() => {
    if (!gscData?.topQueries) return [];
    return gscData.topQueries
      .filter((q) => q.position >= 8 && q.position <= 20)
      .sort((a, b) => b.impressions - a.impressions);
  }, [gscData?.topQueries]);

  // Winners: queries with positive growth in clicks or rank
  const winners = useMemo(() => {
    if (!gscData?.topQueries) return [];
    return [...gscData.topQueries]
      .filter((q) => (q.clicksDiff ?? 0) > 0 || (q.posDiff ?? 0) > 0)
      .sort((a, b) => (b.clicksDiff ?? 0) - (a.clicksDiff ?? 0) || (b.posDiff ?? 0) - (a.posDiff ?? 0));
  }, [gscData?.topQueries]);

  // Losers: queries with drop in clicks or rank
  const losers = useMemo(() => {
    if (!gscData?.topQueries) return [];
    return [...gscData.topQueries]
      .filter((q) => (q.clicksDiff ?? 0) < 0 || (q.posDiff ?? 0) < 0)
      .sort((a, b) => (a.clicksDiff ?? 0) - (b.clicksDiff ?? 0) || (a.posDiff ?? 0) - (b.posDiff ?? 0));
  }, [gscData?.topQueries]);

  // Countries sorted
  const sortedCountries = useMemo(() => {
    if (!gscData?.countries) return [];
    if (!querySearch.trim()) return gscData.countries;
    const term = querySearch.toLowerCase();
    return gscData.countries.filter(
      (c) =>
        c.country.toLowerCase().includes(term) ||
        formatCountry(c.country).toLowerCase().includes(term)
    );
  }, [gscData?.countries, querySearch]);

  // Filter GA4 pages with titles
  const filteredGa4Pages = useMemo(() => {
    if (!ga4Data?.pagesWithTitles) return [];
    if (!pageSearch.trim()) return ga4Data.pagesWithTitles;
    const term = pageSearch.toLowerCase();
    return ga4Data.pagesWithTitles.filter(
      (p) => p.title.toLowerCase().includes(term) || p.path.toLowerCase().includes(term)
    );
  }, [ga4Data?.pagesWithTitles, pageSearch]);

  // Filter GA4 Events & Conversions
  const filteredEvents = useMemo(() => {
    if (!ga4Data?.events) return [];
    if (!querySearch.trim()) return ga4Data.events;
    const term = querySearch.toLowerCase();
    return ga4Data.events.filter((e) => e.eventName.toLowerCase().includes(term));
  }, [ga4Data?.events, querySearch]);

  function decodePath(url: string): string {
    try {
      const path = url.replace(/^https?:\/\/[^/]+/i, "") || "/";
      return decodeURIComponent(path);
    } catch {
      return url.replace(/^https?:\/\/[^/]+/i, "") || "/";
    }
  }

  // Filter pages (supports searching decoded Hebrew paths too!)
  const filteredPages = useMemo(() => {
    if (!gscData?.topPages) return [];
    if (!pageSearch.trim()) return gscData.topPages;
    const term = pageSearch.toLowerCase();
    return gscData.topPages.filter((p) => {
      const decoded = decodePath(p.page).toLowerCase();
      return p.page.toLowerCase().includes(term) || decoded.includes(term);
    });
  }, [gscData?.topPages, pageSearch]);

  const cleanDisplayWebsite = useMemo(() => {
    if (!clientWebsite) return "";
    return clientWebsite.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  }, [clientWebsite]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Performance & Stats</h1>
            {gscData && (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                Live Data
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time Search Console and Google Analytics intelligence for this client
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector & Dates inline right next to 28D */}
          <div className="flex items-center gap-1.5 bg-muted/30 p-0.5 rounded-lg border border-border/60">
            <Select value={datePreset} onValueChange={(val) => setDatePreset(val || "28d")}>
              <SelectTrigger className="w-[125px] h-8 text-xs bg-background border-none shadow-none font-medium">
                <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="28d">Last 28 Days</SelectItem>
                <SelectItem value="90d">Last 3 Months</SelectItem>
                <SelectItem value="thisMonth">Month to Date</SelectItem>
              </SelectContent>
            </Select>

            {/* Dates displayed immediately beside 28D */}
            <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1 px-2 border-l border-border/60">
              <span className="font-semibold text-foreground">{dateRange.startDate}</span>
              <span>to</span>
              <span className="font-semibold text-foreground">{dateRange.endDate}</span>
              {dateRange.compareStartDate && (
                <span className="text-[11px] text-muted-foreground/80 ml-1">
                  (vs {dateRange.compareStartDate} – {dateRange.compareEndDate})
                </span>
              )}
            </div>
          </div>

          {/* Compare Toggle */}
          <Button
            variant={compareEnabled ? "secondary" : "outline"}
            size="sm"
            className="h-9 text-xs"
            onClick={() => setCompareEnabled(!compareEnabled)}
          >
            {compareEnabled ? "Compare: On" : "Compare: Off"}
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2.5"
            onClick={fetchStats}
            disabled={isDataLoading}
            title="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? "animate-spin" : ""}`} />
          </Button>

          {/* Collapsible Config Toggle Button */}
          <Button
            variant={showConfig ? "secondary" : "outline"}
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Settings</span>
            {showConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Collapsible Configuration Bar (Hidden by default so screen is 100% clean) */}
      {showConfig && (
        <Card className="p-4 shadow-sm border bg-card transition-all">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Field 1: Client Website */}
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                Client Website (Search Console)
              </label>
              <Input
                value={clientWebsite}
                onChange={(e) => setClientWebsite(e.target.value)}
                placeholder="e.g. https://brandtactics.co.il/"
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Field 2: GA4 Property ID with Direct Link to GA4 Admin */}
            <div className="flex-1 w-full space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  Google Analytics 4 Property ID (Optional)
                </label>
                <a
                  href="https://analytics.google.com/analytics/web/#/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-normal text-[11px] inline-flex items-center gap-0.5"
                >
                  <span>Where to find in GA4?</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <Input
                value={inputGa4Property}
                onChange={(e) => setInputGa4Property(e.target.value)}
                placeholder="e.g. 456789123"
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Buttons on the same row */}
            <div className="flex items-center gap-2 shrink-0 self-end">
              <Button
                size="sm"
                className="h-9 text-xs gap-1.5 px-4"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
              >
                {isSavingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Selection
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs text-muted-foreground gap-1 px-3"
                onClick={() => copyToClipboard(serviceAccountEmail)}
                title={`Service email: ${serviceAccountEmail}`}
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmail ? "Copied" : "Copy Service Email"}</span>
              </Button>

              {/* Where to put this email? Interactive Popover / Tooltip */}
              <Popover>
                <PopoverTrigger
                  className="h-9 px-2.5 text-xs text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md border border-dashed flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Where to add this email in Google?"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Where to put this?</span>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3.5 shadow-xl border bg-popover text-popover-foreground rounded-xl" side="bottom" align="end">
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground border-b pb-2">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      <span>Where to add this Google Email?</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">Master Service Account:</p>
                      <div className="flex items-center gap-1.5 bg-muted/60 p-1.5 rounded font-mono text-[10px] break-all border">
                        <span className="flex-1">{serviceAccountEmail}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(serviceAccountEmail)}
                        >
                          {copiedEmail ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Step 1: Search Console */}
                    <div className="space-y-1 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">1. Google Search Console</span>
                        <a
                          href={`https://search.google.com/search-console/users?resource_id=${encodeURIComponent(clientWebsite || "https://brandtactics.co.il/")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-[11px] inline-flex items-center gap-0.5 font-medium"
                        >
                          <span>Open Users ↗</span>
                        </a>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Click <strong>Add user</strong>, paste the email above, and select <strong>Viewer</strong> (or Full) permission.
                      </p>
                    </div>

                    {/* Step 2: GA4 */}
                    <div className="space-y-1 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">2. Google Analytics 4</span>
                        <a
                          href="https://analytics.google.com/analytics/web/#/admin"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] inline-flex items-center gap-0.5 font-medium"
                        >
                          <span>Open GA4 Admin ↗</span>
                        </a>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Go to <strong>Property Access Management</strong>, click <strong>+</strong>, paste this email and assign <strong>Viewer</strong> role.
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Helper Strip with Direct Links directly inside the card */}
          <div className="pt-3 mt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                Give <strong>Viewer</strong> access to <code>{serviceAccountEmail}</code>:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://search.google.com/search-console/users?resource_id=${encodeURIComponent(clientWebsite || "https://brandtactics.co.il/")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline bg-muted/60 px-2.5 py-1 rounded border border-border/60 hover:bg-muted transition-colors"
                title="Open Search Console Users & Permissions for this website"
              >
                <Search className="w-3 h-3" />
                <span>1. Open Search Console Users ↗</span>
              </a>
              <a
                href="https://analytics.google.com/analytics/web/#/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline bg-muted/60 px-2.5 py-1 rounded border border-border/60 hover:bg-muted transition-colors"
                title="Open Google Analytics Admin to manage Property Access"
              >
                <BarChart3 className="w-3 h-3" />
                <span>2. Open GA4 Admin Access ↗</span>
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Notice if GSC error occurs */}
      {gscError && (
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div>
                <p className="font-semibold text-foreground">Google Search Console Notice</p>
                <p className="text-muted-foreground">{gscError}</p>
              </div>

              {gscError.includes("credentials not found") ? (
                <div className="space-y-1.5 pt-1 border-t border-amber-500/20">
                  <p className="text-[11px] text-muted-foreground">
                    To enable live stats on production (Vercel), add the Service Account key to your Vercel Environment Variables:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href="https://vercel.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline bg-background px-2.5 py-1 rounded border border-border"
                    >
                      <span>Open Vercel Dashboard Settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1 border-t border-amber-500/20">
                  <p className="text-[11px] text-muted-foreground">
                    Make sure <strong>{serviceAccountEmail}</strong> has Viewer permission in Google Search Console:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={`https://search.google.com/search-console/users?resource_id=${encodeURIComponent(clientWebsite || "https://brandtactics.co.il/")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline bg-background px-2.5 py-1 rounded border border-border"
                    >
                      <span>Open Search Console Users for {cleanDisplayWebsite || "Website"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1"
                      onClick={() => copyToClipboard(serviceAccountEmail)}
                    >
                      {copiedEmail ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEmail ? "Copied" : "Copy Email"}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state indicator */}
      {isDataLoading && (
        <div className="flex items-center justify-end text-xs text-primary px-1">
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching live metrics...
          </span>
        </div>
      )}

      {/* Main Stats Display */}
      <div className="space-y-6">
        {/* KPI Scorecards Container - Single row on screens >= 960px */}
        <div className={`grid grid-cols-1 ${ga4Data ? "min-[960px]:grid-cols-2" : ""} gap-4`}>
          {/* GSC Scorecards */}
          {gscData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Search Console
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Clicks */}
                <Card className="shadow-sm">
                  <CardContent className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Clicks</span>
                      <MousePointerClick className="w-3.5 h-3.5 text-blue-500 opacity-80" />
                    </div>
                    <div className="text-xl font-bold mt-1">
                      {gscData.summary.clicks.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                {/* Impressions */}
                <Card className="shadow-sm">
                  <CardContent className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Impressions</span>
                      <Eye className="w-3.5 h-3.5 text-purple-500 opacity-80" />
                    </div>
                    <div className="text-xl font-bold mt-1">
                      {gscData.summary.impressions.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                {/* CTR */}
                <Card className="shadow-sm">
                  <CardContent className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">CTR</span>
                      <Percent className="w-3.5 h-3.5 text-emerald-500 opacity-80" />
                    </div>
                    <div className="text-xl font-bold mt-1">
                      {gscData.summary.ctr}%
                    </div>
                  </CardContent>
                </Card>

                {/* Position */}
                <Card className="shadow-sm">
                  <CardContent className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Position</span>
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500 opacity-80" />
                    </div>
                    <div className="text-xl font-bold mt-1">
                      {gscData.summary.position || "—"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* GA4 Scorecards */}
          {ga4Data && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Google Analytics (GA4)
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Users */}
                <Card className="shadow-sm">
                  <CardContent className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Users</span>
                      <Users className="w-3.5 h-3.5 text-emerald-500 opacity-80" />
                    </div>
                    <div className="text-xl font-bold mt-1">
                      {ga4Data.summary.activeUsers.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                {/* Sessions */}
                <Card className="shadow-sm">
                  <CardContent className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Sessions</span>
                      <Activity className="w-3.5 h-3.5 text-blue-500 opacity-80" />
                    </div>
                    <div className="text-xl font-bold mt-1">
                      {ga4Data.summary.sessions.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                {/* Page Views */}
                <Card className="shadow-sm">
                  <CardContent className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Page Views</span>
                      <Layers className="w-3.5 h-3.5 text-purple-500 opacity-80" />
                    </div>
                    <div className="text-xl font-bold mt-1">
                      {ga4Data.summary.pageViews.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                {/* Bounce Rate */}
                <Card className="shadow-sm">
                  <CardContent className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Bounce Rate</span>
                      <Percent className="w-3.5 h-3.5 text-rose-500 opacity-80" />
                    </div>
                    <div className="text-xl font-bold mt-1">
                      {ga4Data.summary.bounceRate}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Visual Performance Charts & Device Breakdown side-by-side */}
        {gscData?.dailyTrend && gscData.dailyTrend.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            {/* Daily Trend Chart (2 columns on desktop) */}
            <Card className="shadow-sm lg:col-span-2 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Search Console Daily Trend
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Daily clicks and organic impressions over the selected timeframe
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 flex-1">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={gscData.dailyTrend}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(str) => str.slice(5)}
                      />
                      <YAxis
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }}
                        formatter={(val) => (val === "Clicks" ? "קליקים (Clicks)" : "חשיפות (Impressions)")}
                      />
                      <Area
                        yAxisId="left"
                        type="linear"
                        dot={{ r: 2.5, strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                        dataKey="clicks"
                        name="Clicks"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#clicksGrad)"
                      />
                      <Area
                        yAxisId="right"
                        type="linear"
                        dot={{ r: 2, strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                        dataKey="impressions"
                        name="Impressions"
                        stroke="#a855f7"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#impressionsGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Devices Breakdown (1 column on desktop) */}
            <Card className="shadow-sm lg:col-span-1 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-primary" />
                  Search Traffic by Device
                </CardTitle>
                <CardDescription className="text-xs">
                  Clicks & organic impressions by device type
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 flex-1 flex flex-col justify-around gap-2.5">
                {gscData.devices && gscData.devices.length > 0 ? (
                  gscData.devices.map((dev) => {
                    const isMobile = dev.device.toUpperCase() === "MOBILE";
                    const isTablet = dev.device.toUpperCase() === "TABLET";
                    const Icon = isMobile ? Smartphone : isTablet ? Tablet : Laptop;
                    const label = isMobile ? "Mobile (טלפונים)" : isTablet ? "Tablet (טאבלטים)" : "Desktop (מחשבים)";

                    return (
                      <div key={dev.device} className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{label}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {dev.impressions.toLocaleString()} חשיפות ({dev.ctr}% CTR)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold text-foreground">
                            {dev.clicks.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">קליקים</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-8">
                    No device data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* GA4 Channels & Daily Traffic (if connected) */}
        {ga4Data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Channels Breakdown */}
            {ga4Data.channels && ga4Data.channels.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    Traffic Acquisition Channels
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sessions breakdown by primary marketing channel
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ga4Data.channels}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis
                          dataKey="channel"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11 }}
                          width={90}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="sessions" name="Sessions" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* GA4 Daily Users */}
            {ga4Data.dailyTrend && ga4Data.dailyTrend.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Daily Active Users (GA4)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Daily visitor activity trend
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={ga4Data.dailyTrend}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(str) => str.slice(5)}
                        />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="activeUsers"
                          name="Active Users"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#usersGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* In-depth Data Tables */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto overflow-x-auto">
                <TabsList className="h-9 flex flex-wrap gap-1 bg-muted/40 p-1">
                  <TabsTrigger value="gsc" className="text-xs gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    Top Queries ({filteredQueries.length})
                  </TabsTrigger>
                  <TabsTrigger value="pages" className="text-xs gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Landing Pages ({filteredPages.length})
                  </TabsTrigger>
                  <TabsTrigger value="striking" className="text-xs gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-500" />
                    Striking Distance ({strikingQueries.length})
                  </TabsTrigger>
                  <TabsTrigger value="winners" className="text-xs gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    Winners & Losers
                  </TabsTrigger>
                  {gscData?.countries && gscData.countries.length > 0 && (
                    <TabsTrigger value="countries" className="text-xs gap-1.5">
                      <Flag className="w-3.5 h-3.5 text-blue-500" />
                      Countries ({gscData.countries.length})
                    </TabsTrigger>
                  )}
                  {ga4Data?.pagesWithTitles && ga4Data.pagesWithTitles.length > 0 && (
                    <TabsTrigger value="ga4pages" className="text-xs gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      GA4 Pages & Titles ({ga4Data.pagesWithTitles.length})
                    </TabsTrigger>
                  )}
                  {ga4Data?.events && ga4Data.events.length > 0 && (
                    <TabsTrigger value="events" className="text-xs gap-1.5">
                      <Award className="w-3.5 h-3.5 text-purple-500" />
                      Key Events & Goals ({ga4Data.events.length})
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>

              {/* Table Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder={
                    activeTab === "pages"
                      ? "Filter pages..."
                      : activeTab === "countries"
                      ? "Filter countries..."
                      : activeTab === "events"
                      ? "Filter events..."
                      : activeTab === "ga4pages"
                      ? "Filter titles & paths..."
                      : "Filter queries..."
                  }
                  className="h-8 pl-8 text-xs"
                  value={activeTab === "pages" || activeTab === "ga4pages" ? pageSearch : querySearch}
                  onChange={(e) => {
                    if (activeTab === "pages" || activeTab === "ga4pages") {
                      setPageSearch(e.target.value);
                    } else {
                      setQuerySearch(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* 1. GSC Top Queries */}
            {activeTab === "gsc" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[45%] text-xs">Query / Keyword</TableHead>
                      <TableHead className="text-right text-xs">Clicks</TableHead>
                      <TableHead className="text-right text-xs">Impressions</TableHead>
                      <TableHead className="text-right text-xs">CTR</TableHead>
                      <TableHead className="text-right text-xs">Avg. Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQueries.length > 0 ? (
                      filteredQueries.slice(0, 50).map((row, idx) => (
                        <TableRow key={idx} className="text-xs hover:bg-muted/40">
                          <TableCell className="font-medium text-foreground max-w-xs truncate" title={row.query}>
                            {row.query}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {row.clicks.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {row.impressions.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {row.ctr}%
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-mono font-normal ${
                                row.position <= 3
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : row.position <= 10
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              #{row.position}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-28 text-center text-xs text-muted-foreground">
                          {isDataLoading ? "Loading search queries..." : "No search queries found for this period."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 2. GSC Landing Pages */}
            {activeTab === "pages" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[50%] text-xs">Landing Page URL</TableHead>
                      <TableHead className="text-right text-xs">Clicks</TableHead>
                      <TableHead className="text-right text-xs">Impressions</TableHead>
                      <TableHead className="text-right text-xs">CTR</TableHead>
                      <TableHead className="text-right text-xs">Avg. Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPages.length > 0 ? (
                      filteredPages.slice(0, 50).map((row, idx) => {
                        const decoded = decodePath(row.page);
                        const isRoot = decoded === "/";
                        const displayName = isRoot ? "דף הבית (/)" : decoded;

                        return (
                          <TableRow key={idx} className="text-xs hover:bg-muted/40">
                            <TableCell className="max-w-md">
                              <div className="flex items-center gap-2">
                                <a
                                  href={row.page}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-muted shrink-0 transition-colors"
                                  title="פתח דף בחלון חדש"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={row.page}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-foreground hover:underline truncate"
                                  title={decoded}
                                  dir="auto"
                                >
                                  {displayName}
                                </a>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {row.clicks.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {row.impressions.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {row.ctr}%
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-mono font-normal ${
                                  row.position <= 3
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : row.position <= 10
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                  : "bg-muted text-muted-foreground"
                                }`}
                              >
                                #{row.position}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-28 text-center text-xs text-muted-foreground">
                          {isDataLoading ? "Loading landing pages..." : "No landing pages found for this period."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 3. Striking Distance (Positions 8 to 20) */}
            {activeTab === "striking" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[45%] text-xs">High-Potential Keyword (Rank #8 – #20)</TableHead>
                      <TableHead className="text-right text-xs">Clicks</TableHead>
                      <TableHead className="text-right text-xs">Impressions</TableHead>
                      <TableHead className="text-right text-xs">CTR</TableHead>
                      <TableHead className="text-right text-xs">Current Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strikingQueries.length > 0 ? (
                      strikingQueries.slice(0, 50).map((row, idx) => (
                        <TableRow key={idx} className="text-xs hover:bg-muted/40">
                          <TableCell className="font-medium text-foreground max-w-xs truncate" title={row.query}>
                            <span className="flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{row.query}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {row.clicks.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {row.impressions.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {row.ctr}%
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-[11px] font-mono bg-amber-500/10 text-amber-600 border-amber-500/30">
                              #{row.position}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-28 text-center text-xs text-muted-foreground">
                          No striking distance keywords (#8 to #20) found in this timeframe.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 4. Winners & Losers */}
            {activeTab === "winners" && (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Winners */}
                <div className="p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Top Growth Queries (זינקו בתוצאות)</span>
                  </div>
                  <div className="space-y-1.5">
                    {winners.slice(0, 15).map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded border bg-muted/20 text-xs">
                        <span className="font-medium truncate max-w-[200px]" title={row.query}>{row.query}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">
                            +{(row.clicksDiff ?? 0) > 0 ? `${row.clicksDiff} clicks` : `${row.posDiff} pos`}
                          </span>
                          <Badge variant="outline" className="text-[10px]">#{row.position}</Badge>
                        </div>
                      </div>
                    ))}
                    {winners.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">No growth comparisons available</p>
                    )}
                  </div>
                </div>

                {/* Losers */}
                <div className="p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
                    <TrendingDown className="w-4 h-4" />
                    <span>Queries Needing Refresh (ירדו בביצועים)</span>
                  </div>
                  <div className="space-y-1.5">
                    {losers.slice(0, 15).map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded border bg-muted/20 text-xs">
                        <span className="font-medium truncate max-w-[200px]" title={row.query}>{row.query}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-500 font-bold">
                            {(row.clicksDiff ?? 0) < 0 ? `${row.clicksDiff} clicks` : `${row.posDiff} pos`}
                          </span>
                          <Badge variant="outline" className="text-[10px]">#{row.position}</Badge>
                        </div>
                      </div>
                    ))}
                    {losers.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">No declining queries in this timeframe</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Countries */}
            {activeTab === "countries" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[45%] text-xs">Country / Region</TableHead>
                      <TableHead className="text-right text-xs">Clicks</TableHead>
                      <TableHead className="text-right text-xs">Impressions</TableHead>
                      <TableHead className="text-right text-xs">CTR</TableHead>
                      <TableHead className="text-right text-xs">Avg. Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCountries.length > 0 ? (
                      sortedCountries.map((row, idx) => (
                        <TableRow key={idx} className="text-xs hover:bg-muted/40">
                          <TableCell className="font-medium text-foreground">
                            {formatCountry(row.country)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {row.clicks.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {row.impressions.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {row.ctr}%
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-[11px] font-mono">
                              #{row.position}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-28 text-center text-xs text-muted-foreground">
                          No country data available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 6. GA4 Pages & Titles */}
            {activeTab === "ga4pages" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[45%] text-xs">Page Title & Path (GA4)</TableHead>
                      <TableHead className="text-right text-xs">Page Views</TableHead>
                      <TableHead className="text-right text-xs">Active Users</TableHead>
                      <TableHead className="text-right text-xs">Sessions</TableHead>
                      <TableHead className="text-right text-xs">Bounce Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGa4Pages.length > 0 ? (
                      filteredGa4Pages.map((row, idx) => (
                        <TableRow key={idx} className="text-xs hover:bg-muted/40">
                          <TableCell className="max-w-md">
                            <p className="font-medium text-foreground truncate" title={row.title} dir="auto">
                              {row.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate" title={row.path}>
                              {row.path}
                            </p>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {row.views.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {row.activeUsers.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {row.sessions.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-[11px] font-mono">
                              {row.bounceRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-28 text-center text-xs text-muted-foreground">
                          No GA4 page title data available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 7. GA4 Key Events & Goals */}
            {activeTab === "events" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[60%] text-xs">Event Name</TableHead>
                      <TableHead className="text-right text-xs">Total Event Count</TableHead>
                      <TableHead className="text-right text-xs">Conversions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.length > 0 ? (
                      filteredEvents.map((row, idx) => (
                        <TableRow key={idx} className="text-xs hover:bg-muted/40">
                          <TableCell className="font-mono text-xs font-semibold text-foreground">
                            <span className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-purple-500" />
                              <span>{row.eventName}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {row.count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.conversions > 0 ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                                {row.conversions.toLocaleString()} Goals
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-28 text-center text-xs text-muted-foreground">
                          No key events or conversions recorded for this timeframe.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

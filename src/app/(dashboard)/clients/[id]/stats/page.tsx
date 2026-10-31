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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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
    toast.success("Service account email copied to clipboard!");
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

  // Filter queries
  const filteredQueries = useMemo(() => {
    if (!gscData?.topQueries) return [];
    if (!querySearch.trim()) return gscData.topQueries;
    return gscData.topQueries.filter((q) =>
      q.query.toLowerCase().includes(querySearch.toLowerCase())
    );
  }, [gscData?.topQueries, querySearch]);

  // Filter pages
  const filteredPages = useMemo(() => {
    if (!gscData?.topPages) return [];
    if (!pageSearch.trim()) return gscData.topPages;
    return gscData.topPages.filter((p) =>
      p.page.toLowerCase().includes(pageSearch.toLowerCase())
    );
  }, [gscData?.topPages, pageSearch]);

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
          {/* Date Range Selector */}
          <Select value={datePreset} onValueChange={(val) => setDatePreset(val || "28d")}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
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
        </div>
      </div>

      {/* Clean Single-Row Configuration Bar */}
      <Card className="p-4 shadow-sm border bg-card">
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

          {/* Field 2: GA4 Property ID */}
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              Google Analytics 4 Property ID (Optional)
            </label>
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
          </div>
        </div>
      </Card>

      {/* Notice if GSC error occurs */}
      {gscError && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Google Search Console Notice</p>
              <p className="text-muted-foreground">{gscError}</p>
              <p className="text-[11px] text-muted-foreground">
                Make sure <strong>{serviceAccountEmail}</strong> has Viewer permission for{" "}
                <strong>{clientWebsite || "the website"}</strong> in Google Search Console.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date range subtitle & loading state */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing data from <strong className="text-foreground">{dateRange.startDate}</strong> to{" "}
          <strong className="text-foreground">{dateRange.endDate}</strong>
          {dateRange.compareStartDate && (
            <> (compared to {dateRange.compareStartDate} – {dateRange.compareEndDate})</>
          )}
        </span>
        {isDataLoading && (
          <span className="flex items-center gap-1.5 text-primary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching live metrics...
          </span>
        )}
      </div>

      {/* Main Stats Display */}
      <div className="space-y-6">
        {/* GSC KPI Scorecards */}
        {gscData && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold tracking-tight">Google Search Console Performance</h3>
              <span className="text-xs text-muted-foreground">({clientWebsite})</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Clicks */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Total Clicks</span>
                    <MousePointerClick className="w-4 h-4 text-blue-500 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {gscData.summary.clicks.toLocaleString()}
                  </div>
                  {compareEnabled && gscData.compareSummary && (() => {
                    const ch = calcChange(gscData.summary.clicks, gscData.compareSummary.clicks);
                    if (!ch) return null;
                    return (
                      <div className={`flex items-center gap-1 text-xs mt-1.5 ${ch.isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                        {ch.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{ch.value}%</span>
                        <span className="text-muted-foreground text-[11px]">vs prev period</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Total Impressions */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Total Impressions</span>
                    <Eye className="w-4 h-4 text-purple-500 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {gscData.summary.impressions.toLocaleString()}
                  </div>
                  {compareEnabled && gscData.compareSummary && (() => {
                    const ch = calcChange(gscData.summary.impressions, gscData.compareSummary.impressions);
                    if (!ch) return null;
                    return (
                      <div className={`flex items-center gap-1 text-xs mt-1.5 ${ch.isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                        {ch.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{ch.value}%</span>
                        <span className="text-muted-foreground text-[11px]">vs prev period</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Average CTR */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Average CTR</span>
                    <Percent className="w-4 h-4 text-emerald-500 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {gscData.summary.ctr}%
                  </div>
                  {compareEnabled && gscData.compareSummary && (() => {
                    const diff = Number((gscData.summary.ctr - gscData.compareSummary.ctr).toFixed(2));
                    const isPos = diff >= 0;
                    return (
                      <div className={`flex items-center gap-1 text-xs mt-1.5 ${isPos ? "text-emerald-500" : "text-rose-500"}`}>
                        {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{Math.abs(diff)}%</span>
                        <span className="text-muted-foreground text-[11px]">vs prev period</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Average Position */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Average Position</span>
                    <TrendingUp className="w-4 h-4 text-amber-500 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {gscData.summary.position || "—"}
                  </div>
                  {compareEnabled && gscData.compareSummary && (() => {
                    const diff = Number((gscData.summary.position - gscData.compareSummary.position).toFixed(1));
                    const improved = diff < 0;
                    return (
                      <div className={`flex items-center gap-1 text-xs mt-1.5 ${improved ? "text-emerald-500" : "text-rose-500"}`}>
                        {improved ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{Math.abs(diff)} pos</span>
                        <span className="text-muted-foreground text-[11px]">{improved ? "improved" : "dropped"}</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* GA4 KPI Scorecards (if connected) */}
        {ga4Data && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold tracking-tight">Google Analytics 4 Overview</h3>
              <span className="text-xs text-muted-foreground">(Property {ga4PropertyId})</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Active Users */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Active Users</span>
                    <Users className="w-4 h-4 text-emerald-500 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {ga4Data.summary.activeUsers.toLocaleString()}
                  </div>
                  {compareEnabled && ga4Data.compareSummary && (() => {
                    const ch = calcChange(ga4Data.summary.activeUsers, ga4Data.compareSummary.activeUsers);
                    if (!ch) return null;
                    return (
                      <div className={`flex items-center gap-1 text-xs mt-1.5 ${ch.isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                        {ch.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{ch.value}%</span>
                        <span className="text-muted-foreground text-[11px]">vs prev period</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Sessions */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Total Sessions</span>
                    <Activity className="w-4 h-4 text-blue-500 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {ga4Data.summary.sessions.toLocaleString()}
                  </div>
                  {compareEnabled && ga4Data.compareSummary && (() => {
                    const ch = calcChange(ga4Data.summary.sessions, ga4Data.compareSummary.sessions);
                    if (!ch) return null;
                    return (
                      <div className={`flex items-center gap-1 text-xs mt-1.5 ${ch.isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                        {ch.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{ch.value}%</span>
                        <span className="text-muted-foreground text-[11px]">vs prev period</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Page Views */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Page Views</span>
                    <Layers className="w-4 h-4 text-purple-500 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {ga4Data.summary.pageViews.toLocaleString()}
                  </div>
                  {compareEnabled && ga4Data.compareSummary && (() => {
                    const ch = calcChange(ga4Data.summary.pageViews, ga4Data.compareSummary.pageViews);
                    if (!ch) return null;
                    return (
                      <div className={`flex items-center gap-1 text-xs mt-1.5 ${ch.isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                        {ch.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{ch.value}%</span>
                        <span className="text-muted-foreground text-[11px]">vs prev period</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Bounce Rate */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Bounce Rate</span>
                    <Percent className="w-4 h-4 text-amber-500 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {ga4Data.summary.bounceRate}%
                  </div>
                  {compareEnabled && ga4Data.compareSummary && (() => {
                    const diff = Number((ga4Data.summary.bounceRate - ga4Data.compareSummary.bounceRate).toFixed(1));
                    const improved = diff <= 0;
                    return (
                      <div className={`flex items-center gap-1 text-xs mt-1.5 ${improved ? "text-emerald-500" : "text-rose-500"}`}>
                        {improved ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{Math.abs(diff)}%</span>
                        <span className="text-muted-foreground text-[11px]">{improved ? "improved" : "increased"}</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Visual Performance Charts */}
        {gscData?.dailyTrend && gscData.dailyTrend.length > 0 && (
          <Card className="shadow-sm">
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
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={gscData.dailyTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
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
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#clicksGrad)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="h-9">
                  <TabsTrigger value="gsc" className="text-xs gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    Top Search Queries ({filteredQueries.length})
                  </TabsTrigger>
                  <TabsTrigger value="pages" className="text-xs gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Top Landing Pages ({filteredPages.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Table Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder={activeTab === "gsc" ? "Filter queries..." : "Filter pages..."}
                  className="h-8 pl-8 text-xs"
                  value={activeTab === "gsc" ? querySearch : pageSearch}
                  onChange={(e) =>
                    activeTab === "gsc"
                      ? setQuerySearch(e.target.value)
                      : setPageSearch(e.target.value)
                  }
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
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
                        <TableRow key={idx} className="text-xs">
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
                        const cleanPath = row.page.replace(/^https?:\/\/[^/]+/i, "") || "/";
                        return (
                          <TableRow key={idx} className="text-xs">
                            <TableCell className="font-mono text-[11px] text-foreground max-w-sm truncate" title={row.page}>
                              <a
                                href={row.page}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center gap-1 group"
                              >
                                <span className="truncate">{cleanPath}</span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 shrink-0" />
                              </a>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

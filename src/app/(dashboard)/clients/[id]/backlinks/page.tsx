"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ClientBacklinkCard } from "@/components/client-backlink-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Search, Link2, TrendingUp, Info, Share2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ClientBacklinksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = React.use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [backlinks, setBacklinks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [clientMappings, setClientMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [showUsed, setShowUsed] = useState(false);
  const [showTasked, setShowTasked] = useState(false);
  const [orderMap, setOrderMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, [clientId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [backRes, catsRes, mappingRes] = await Promise.all([
        supabase.from("backlinks").select("*, backlink_categories(name)"),
        supabase.from("backlink_categories").select("*").order("rank"),
        supabase.from("client_backlinks").select("*").eq("client_id", clientId)
      ]);

      if (backRes.data) {
        let sortedData = backRes.data;
        // Randomly mix on initial load, but keep order consistent after updates
        if (Object.keys(orderMap).length === 0) {
          const map: Record<string, number> = {};
          const shuffled = [...backRes.data].sort(() => Math.random() - 0.5);
          shuffled.forEach((b, i) => map[b.id] = i);
          setOrderMap(map);
          sortedData = shuffled;
        } else {
          sortedData = [...backRes.data].sort((a, b) => (orderMap[a.id] ?? 999) - (orderMap[b.id] ?? 999));
        }
        setBacklinks(sortedData);
      }
      if (catsRes.data) setCategories(catsRes.data);
      if (mappingRes.data) setClientMappings(mappingRes.data);
    } catch (err) {
      console.error("Error fetching backlinks:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const search = searchParams.get("search");
    if (search !== null && search !== searchTerm) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  const filteredBacklinks = backlinks.filter(b => {
    const mapping = clientMappings.find(m => m.backlink_id === b.id);
    const isUsed = mapping?.is_used || false;
    const isTasked = mapping?.is_tasked || false;

    // Filter by visibility toggles
    if (!showUsed && isUsed) return false;
    if (!showTasked && isTasked) return false;

    const matchesSearch = 
      b.website_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.backlink_categories?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !activeCategoryId || b.category_id === activeCategoryId;
    
    return matchesSearch && matchesCategory;
  });

  const usedCount = clientMappings.filter(m => m.is_used).length;
  const totalCount = backlinks.length;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-600 text-white shadow-md overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
             <TrendingUp className="w-16 h-16" />
          </div>
          <CardContent className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Usage Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{usedCount}</span>
              <span className="text-lg opacity-60">/ {totalCount}</span>
            </div>
            <p className="text-[10px] mt-2 font-medium bg-white/10 inline-block px-2 py-0.5 rounded">
              {totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0}% ALIGNMENT
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-white border-dashed border-gray-200">
           <CardContent className="p-6 flex items-center gap-4 h-full">
             <div className="p-3 bg-blue-50 rounded-xl">
               <Info className="w-6 h-6 text-blue-600" />
             </div>
             <div>
               <h4 className="font-bold text-gray-900 text-sm">Client Backlink Strategy</h4>
               <p className="text-xs text-gray-500 leading-relaxed max-w-md">
                 Manage which backlink sources are currently used for this client. 
                 Enter client-specific credentials below to keep track of logins for guest posts and directories.
               </p>
             </div>
           </CardContent>
        </Card>
      </div>

      {/* Search & Categories */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm gap-4">
          <div className="relative w-full max-w-sm">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
             <Input 
               placeholder="Search and filter backlinks..." 
               className="pl-10 h-10 bg-gray-50/50 border-none focus:bg-white transition-all shadow-none"
               value={searchTerm}
               onChange={(e) => {
                 const value = e.target.value;
                 setSearchTerm(value);
                 const params = new URLSearchParams(window.location.search);
                 if (value) params.set("search", value);
                 else params.delete("search");
                 router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
               }}
             />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="showUsed" 
                checked={showUsed} 
                onCheckedChange={(checked) => setShowUsed(checked as boolean)} 
                className="h-4 w-4"
              />
              <Label htmlFor="showUsed" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer">Show Used</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="showTasked" 
                checked={showTasked} 
                onCheckedChange={(checked) => setShowTasked(checked as boolean)} 
                className="h-4 w-4"
              />
              <Label htmlFor="showTasked" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer">Show Tasked</Label>
            </div>
          </div>

          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">
             {filteredBacklinks.length} sources found
          </div>
        </div>

        {/* Category Chips */}
        {!loading && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setActiveCategoryId(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border",
                activeCategoryId === null 
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600"
              )}
            >
              ALL SOURCES
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border",
                  activeCategoryId === cat.id 
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600"
                )}
              >
                {cat.name.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-gray-400 font-medium animate-pulse">SYNCING GLOBAL BACKLINK DIRECTORY...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBacklinks.map((backlink) => {
            const mapping = clientMappings.find(m => m.backlink_id === backlink.id);
            return (
              <ClientBacklinkCard 
                key={backlink.id}
                clientId={clientId}
                backlink={backlink}
                clientData={mapping}
                onUpdated={fetchData}
              />
            );
          })}
        </div>
      )}

      {!loading && filteredBacklinks.length === 0 && (
         <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
           <Link2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
           <h3 className="text-sm font-bold text-gray-400">No backlinks found matching your search</h3>
         </div>
      )}
    </div>
  );
}

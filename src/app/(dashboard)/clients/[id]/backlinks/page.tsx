"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ClientBacklinkCard } from "@/components/client-backlink-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Link2, TrendingUp, Info } from "lucide-react";

export default function ClientBacklinksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = React.use(params);
  const [backlinks, setBacklinks] = useState<any[]>([]);
  const [clientMappings, setClientMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [clientId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [backRes, mappingRes] = await Promise.all([
        supabase.from("backlinks").select("*, backlink_categories(name)").order("rank", { ascending: false }),
        supabase.from("client_backlinks").select("*").eq("client_id", clientId)
      ]);

      if (backRes.data) setBacklinks(backRes.data);
      if (mappingRes.data) setClientMappings(mappingRes.data);
    } catch (err) {
      console.error("Error fetching backlinks:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredBacklinks = backlinks.filter(b => 
    b.website_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.backlink_categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Search & Actions */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full max-w-sm">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
           <Input 
             placeholder="Search and filter backlinks..." 
             className="pl-10 h-10 bg-gray-50/50 border-none focus:bg-white transition-all shadow-none"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">
           {filteredBacklinks.length} sources found
        </div>
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

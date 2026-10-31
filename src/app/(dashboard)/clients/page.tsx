"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

function extractDomain(client: any): string | null {
  const raw = (client.website || client.name || "").trim();
  if (!raw) return null;

  try {
    let urlStr = raw;
    if (!/^https?:\/\//i.test(urlStr)) {
      urlStr = "https://" + urlStr;
    }
    const url = new URL(urlStr);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host && host.includes(".") && !host.endsWith(".")) {
      return host;
    }
  } catch {
    const cleaned = raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^www\./i, "").trim().toLowerCase();
    if (cleaned && cleaned.includes(".") && !cleaned.includes(" ")) {
      return cleaned;
    }
  }
  return null;
}

function isOurSite(client: any): boolean {
  if (client.type === "Our site") return true;
  const name = (client.name || "").toLowerCase();
  const website = (client.website || "").toLowerCase();
  if (name.includes("brandtactics") || website.includes("brandtactics")) {
    return true;
  }
  return false;
}

function ClientFavicon({ client }: { client: any }) {
  const domain = extractDomain(client);
  const [hasError, setHasError] = useState(false);

  if (!domain || hasError) {
    return (
      <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 border border-gray-200">
        <Globe className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 border border-gray-200 shadow-xs">
      <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
        alt=""
        className="w-5 h-5 object-contain"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [clients, setClients] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [showArchived, setShowArchived] = React.useState(false);
  const [filterType, setFilterType] = React.useState<"all" | "client" | "ours">("all");
  const { profile, isLoading: isAuthLoading } = useAuth();
  const isAdmin = profile?.role === 'admin';

  async function fetchClients() {
    setIsLoading(true);
    const { data } = await supabase.from("clients").select("*").order("name");
    
    let finalClients = data || [];
    
    if (profile && !isAdmin) {
      const allowed = profile.accessible_clients || [];
      if (!allowed.includes('all')) {
        finalClients = finalClients.filter(c => allowed.includes(c.id));
      }
    }
    
    setClients(finalClients);
    setIsLoading(false);
  }

  useEffect(() => {
    if (!isAuthLoading) {
      fetchClients();
    }
  }, [isAuthLoading, profile?.id]);

  const filteredClients = clients
    .filter(c => {
      const matchesSearch = (c.name || "").toLowerCase().includes(search.toLowerCase());
      const matchesArchived = showArchived || c.status !== "Archived";
      const isOurs = isOurSite(c);
      const matchesType = 
        filterType === "all" ? true :
        filterType === "ours" ? isOurs :
        !isOurs; // filterType === "client"

      return matchesSearch && matchesArchived && matchesType;
    })
    .sort((a, b) => {
      const aOurs = isOurSite(a) ? 1 : 0;
      const bOurs = isOurSite(b) ? 1 : 0;
      // Clients first (0), Ours last (1)
      if (aOurs !== bOurs) {
        return aOurs - bOurs;
      }
      return (a.name || "").localeCompare(b.name || "");
    });

  const handleNewClient = async () => {
    setIsCreating(true);
    const { data, error } = await supabase
      .from("clients")
      .insert([{ name: "New Client", monthly_fee: 0 }])
      .select()
      .single();
      
    if (error) {
      toast.error("Failed to create client: " + error.message);
      setIsCreating(false);
      return;
    }
    
    if (data) {
      toast.success("Created new client.");
      router.push(`/clients/${data.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">All Clients</h1>
          <p className="text-gray-500 mt-1">Manage all your agency's clients here.</p>
        </div>
        <Button 
          onClick={handleNewClient} 
          disabled={isCreating}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> {isCreating ? "Creating..." : "New Client"}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search clients..."
            className="pl-8 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented filter: All / Clients / Ours */}
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={cn(
                "px-3 py-1 rounded-md transition-all",
                filterType === "all"
                  ? "bg-white text-gray-900 shadow-xs font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType("client")}
              className={cn(
                "px-3 py-1 rounded-md transition-all",
                filterType === "client"
                  ? "bg-white text-blue-700 shadow-xs font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Clients
            </button>
            <button
              type="button"
              onClick={() => setFilterType("ours")}
              className={cn(
                "px-3 py-1 rounded-md transition-all",
                filterType === "ours"
                  ? "bg-white text-purple-700 shadow-xs font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Ours
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Show Archived</span>
            <button 
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                showArchived ? "bg-blue-600" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  showArchived ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-500 py-10">Loading clients...</div>
      ) : filteredClients.length === 0 ? (
        <div className="text-gray-500 text-center py-20 bg-white border border-dashed rounded-lg">
           <h3 className="text-lg font-medium text-gray-900">No clients found</h3>
           <p className="mt-1">Click "New Client" to add your first client into the system.</p>
           <Button onClick={handleNewClient} disabled={isCreating} className="mt-4 bg-blue-600">
             <Plus className="w-4 h-4 mr-2" /> New Client
           </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const isOurs = isOurSite(client);
            return (
              <Card key={client.id} className="hover:shadow-md transition-shadow relative group border-gray-200">
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
                    isOurs
                      ? "bg-purple-50 text-purple-700 ring-purple-600/20"
                      : "bg-blue-50 text-blue-700 ring-blue-600/20"
                  )}>
                    {isOurs ? "Ours" : "Client"}
                  </span>

                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
                    client.status === "Archived" 
                      ? "bg-gray-50 text-gray-700 ring-gray-600/20" 
                      : "bg-green-50 text-green-700 ring-green-600/20"
                  )}>
                    {client.status || "Active"}
                  </span>
                </div>
                
                <Link href={`/clients/${client.id}`} className="block">
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ClientFavicon client={client} />
                      <div className="min-w-0 pr-24">
                        <h3 className="font-bold text-sm text-gray-900 leading-tight truncate">
                          {client.name || "Unnamed Client"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{client.contact_email || "No email"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

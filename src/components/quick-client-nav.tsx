"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronsUpDown, Search, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

interface ClientItem {
  id: string;
  name: string;
  website?: string;
  type?: string;
}

export function QuickClientNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isLoading: isAuthLoading } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract client ID from current path (e.g., /clients/:id/...)
  const clientIdMatch = pathname?.match(/^\/clients\/([^/]+)/);
  const currentClientId = clientIdMatch ? clientIdMatch[1] : null;

  useEffect(() => {
    async function loadActiveClients() {
      setLoading(true);
      const { data } = await supabase
        .from("clients")
        .select("id, name, website, type, status")
        .neq("status", "Archived")
        .order("name");

      let finalClients = data || [];

      if (profile && !isAdmin) {
        const allowed = profile.accessible_clients || [];
        if (!allowed.includes("all")) {
          finalClients = finalClients.filter((c: any) => allowed.includes(c.id));
        }
      }

      setClients(finalClients);
      setLoading(false);
    }

    if (!isAuthLoading) {
      loadActiveClients();
    }
  }, [isAuthLoading, profile?.id, isAdmin]);

  // Focus search input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [open]);

  const currentClient = clients.find((c) => c.id === currentClientId);

  const filteredClients = clients.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (clientId: string | null) => {
    setOpen(false);
    if (!clientId) {
      router.push("/clients");
      return;
    }

    // If currently on a subpage of a client (e.g. /clients/:id/stats), keep the subpage route for the new client!
    if (currentClientId && pathname) {
      const newPath = pathname.replace(`/clients/${currentClientId}`, `/clients/${clientId}`);
      router.push(newPath);
    } else {
      router.push(`/clients/${clientId}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        dir="rtl"
        className={cn(
          "h-9 px-3 flex items-center justify-between gap-2 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-2xs max-w-[210px] sm:max-w-[240px] text-right",
          open && "ring-2 ring-blue-500/20 border-blue-400"
        )}
        title={currentClient?.name || "בחר לקוח"}
      >
        <span className="truncate text-gray-700 flex-1 text-right">
          {currentClient?.name || "בחר לקוח"}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-1" />
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        dir="rtl"
        className="w-64 p-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 text-xs text-right"
      >
        {/* Search Input */}
        <div className="relative mb-1">
          <Search className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            dir="rtl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לקוח..."
            className="w-full pr-7 pl-2.5 py-1.5 text-xs bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-right"
          />
        </div>

        {/* Clients List */}
        <div className="max-h-60 overflow-y-auto space-y-0.5 pl-0.5" dir="rtl">
          {/* Default option: בחר לקוח */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-right transition-colors cursor-pointer text-xs",
              !currentClientId
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <span className="truncate">בחר לקוח (כל הלקוחות)</span>
            {!currentClientId && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
          </button>

          <div className="h-px bg-gray-100 my-1" />

          {loading ? (
            <div className="py-4 text-center text-gray-400 text-xs">טוען לקוחות...</div>
          ) : filteredClients.length === 0 ? (
            <div className="py-4 text-center text-gray-400 text-xs">לא נמצאו לקוחות</div>
          ) : (
            filteredClients.map((client) => {
              const isSelected = client.id === currentClientId;
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelect(client.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-right transition-colors cursor-pointer text-xs",
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <span className="truncate">{client.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

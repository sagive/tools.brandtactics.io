"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, ExternalLink, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QuickActionsSidebar } from "@/components/quick-actions-sidebar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";

export default function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const pathname = usePathname();
  const clientId = React.use(params).id;

  const NAV_LINKS = [
    { href: `/clients/${clientId}`, label: "Overview" },
    { href: `/clients/${clientId}/tasks`, label: "Tasks" },
    { href: `/clients/${clientId}/keywords`, label: "SEO Data" },
    { href: `/clients/${clientId}/articles`, label: "Articles" },
    { href: `/clients/${clientId}/backlinks`, label: "Backlinks" },
    { href: `/clients/${clientId}/emails`, label: "Email Updates" },
    { href: `/clients/${clientId}/description`, label: "Description" },
    { href: `/clients/${clientId}/settings`, label: "Settings", adminOnly: true },
  ];

  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  React.useEffect(() => {
    async function getClient() {
      const { data } = await supabase
        .from("clients")
        .select("name, website")
        .eq("id", clientId)
        .single();
        
      if (data) {
        setClientName(data.name);
        setClientWebsite(data.website);
      }
      setIsLoading(false);
    }
    getClient();
  }, [clientId]);

  const [clientWebsite, setClientWebsite] = useState("");

  const inputClasses = "h-auto px-2 py-1 -ml-2 w-full bg-transparent hover:bg-gray-50 border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-gray-900 shadow-none";

  if (isLoading) {
    return <div className="p-10 flex justify-center text-gray-500">Loading client data...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Breadcrumb / Back Navigation */}
      <div className="flex items-center text-sm text-gray-500 font-medium">
        <Link href="/dashboard" className="flex items-center hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Lobby
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{clientName || "Loading..."}</span>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
          
          {/* Client Header: Logo, Name, Website */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shrink-0">
                {(clientName || "UN").substring(0,2).toUpperCase()}
              </div>
              <div className="space-y-1">
                 <h1 className="text-2xl font-bold tracking-tight text-gray-900">{clientName || "Client Name"}</h1>
                 {clientWebsite && (
                   <div className="flex items-center">
                     <a 
                       href={clientWebsite.startsWith('http') ? clientWebsite : `https://${clientWebsite}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-sm text-blue-600 hover:underline flex items-center gap-1.5"
                     >
                       {clientWebsite.replace(/^https?:\/\//, '')}
                       <ExternalLink className="w-3 h-3" />
                     </a>
                   </div>
                 )}
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 uppercase text-[10px] font-bold tracking-wider">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>

          {/* Client Navigation Tabs */}
          <div className="bg-white border rounded-lg shadow-sm p-1.5 flex space-x-1 overflow-x-auto w-full">
            {NAV_LINKS.filter(l => !l.adminOnly || isAdmin).map((link) => {
              const isActive = link.href === `/clients/${clientId}`
                ? pathname === link.href
                : pathname.startsWith(link.href);
                
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600/10"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex-1">
            {children}
          </div>
        </div>

        {/* Right Sidebar: Quick Actions (Moved up) */}
        <div className="w-full xl:w-80 shrink-0 space-y-4">
          <QuickActionsSidebar clientId={clientId as string} />
        </div>
      </div>
    </div>
  );
}

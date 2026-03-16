"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QuickActionsSidebar } from "@/components/quick-actions-sidebar";

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
    { href: `/clients/${clientId}/emails`, label: "Email Updates" },
  ];

  const [clientName, setClientName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function getClient() {
      const { data } = await supabase
        .from("clients")
        .select("name")
        .eq("id", clientId)
        .single();
        
      if (data) setClientName(data.name);
      setIsLoading(false);
    }
    getClient();
  }, [clientId]);

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

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Main Content Area (Left - 75%) */}
        <div className="flex-1 min-w-0 flex flex-col xl:w-9/12">
          {/* Client Navigation Tabs and Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="bg-white border rounded-lg shadow-sm p-1.5 flex space-x-1 overflow-x-auto w-fit">
              {NAV_LINKS.map((link) => {
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
          </div>

          <div className="flex-1">
            {children}
          </div>
        </div>

        {/* Right Sidebar: Quick Actions */}
        <div className="w-full lg:w-3/12 shrink-0 space-y-4">
          <QuickActionsSidebar clientId={clientId as string} />
        </div>
      </div>
    </div>
  );
}

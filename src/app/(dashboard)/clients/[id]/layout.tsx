"use client";

import React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
    { href: `/clients/${clientId}/articles`, label: "Articles" },
    { href: `/clients/${clientId}/emails`, label: "Email Updates" },
  ];

  return (
    <div className="space-y-6 pb-10">
      
      {/* Breadcrumb / Back Navigation */}
      <div className="flex items-center text-sm text-gray-500 font-medium">
        <Link href="/dashboard" className="flex items-center hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Lobby
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Acme Corp</span>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Sidebar: Client Info Card */}
        <div className="w-full xl:w-72 shrink-0 space-y-4">
          <Card className="shadow-sm border-t-4 border-t-blue-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
                  AC
                </div>
                <div className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </div>
              </div>

              <h2 className="text-xl font-bold tracking-tight mb-1">Acme Corp</h2>
              <a href="https://acme.com" target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline block mb-6">
                acme.com
              </a>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Primary Contact</div>
                  <div className="font-medium">Jane Doe</div>
                  <a href="mailto:jane@acme.com" className="text-gray-500 hover:text-blue-600 truncate block">jane@acme.com</a>
                  <div className="text-gray-500">+1 (555) 123-4567</div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Type</div>
                    <div className="font-medium">Retainer</div>
                  </div>
                  <div>
                    <div className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Monthly Fee</div>
                    <div className="font-medium">$2,500</div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-2">Basic Tools</div>
                  <ul className="space-y-1 text-gray-700 list-disc pl-4 marker:text-blue-600">
                    <li>Google Analytics</li>
                    <li>Google Search Console</li>
                    <li>Ahrefs Tracker</li>
                  </ul>
                </div>

                <div className="h-px bg-gray-100" />
                
                <div className="text-xs text-gray-400 text-center">
                  Joined Oct 12, 2023
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => toast.success("Client deleted.")}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Client
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Client Navigation Tabs */}
          <div className="bg-white border rounded-lg shadow-sm p-1.5 mb-6 flex space-x-1 overflow-x-auto w-fit">
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

          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

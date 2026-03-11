"use client";

import Link from "next/link";
import { LayoutDashboard, Users, FileText, Mail, Settings, Briefcase, PlusCircle, ChevronRight, ChevronLeft, Menu, LayoutGrid } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Briefcase },
  { href: "/tasks", label: "All Tasks", icon: FileText },
  { href: "/email-updates", label: "Email Updates", icon: Mail },
  { href: "/tools", label: "All Tools", icon: LayoutGrid },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    async function fetchClients() {
      const { data } = await supabase.from("clients").select("id, name, contact_email").order("name");
      if (data) setClients(data);
    }
    fetchClients();
  }, []);

  if (!mounted) return <aside className="w-16 border-r bg-white h-screen hidden md:flex" />;

  return (
    <aside 
      className={cn(
        "border-r bg-white h-screen flex flex-col shadow-sm z-20 hidden md:flex transition-all duration-300 relative",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-5 h-8 w-8 rounded-full border shadow-sm bg-white hover:bg-gray-50 z-50 flex items-center justify-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Header / Logo */}
      <div className={cn("h-16 flex items-center border-b overflow-hidden", isExpanded ? "px-6" : "justify-center")}>
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600 shrink-0">
          <div className="bg-blue-600 text-white w-8 h-8 rounded shrink-0 flex items-center justify-center">
            BT
          </div>
          {isExpanded && <span className="truncate">BrandTactics</span>}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden flex flex-col">
        {/* Main Navigation */}
        <div className={cn("mb-6", isExpanded ? "px-4" : "px-2")}>
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={!isExpanded ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-md transition-colors text-sm font-medium",
                      isExpanded ? "gap-3 px-3 py-2" : "justify-center p-2 mx-auto w-10 h-10",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {isExpanded && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Clients List */}
        <div className={cn("flex-1", isExpanded ? "px-4" : "px-2")}>
          <div className={cn("flex items-center mb-2", isExpanded ? "justify-between px-3" : "justify-center")}>
            {isExpanded && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                Active Clients
              </h3>
            )}
            <Link href="/clients" title="New Client" className="text-gray-400 hover:text-blue-600 shrink-0">
              <PlusCircle className="w-4 h-4" />
            </Link>
          </div>
          <ul className="space-y-2">
            {clients.map((client, idx) => {
              const isActive = pathname.includes(`/clients/${client.id}`);
              const initials = (client.name || "UN").substring(0, 2).toUpperCase();
              const colors = ["bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-green-100 text-green-700", "bg-orange-100 text-orange-700"];
              const color = colors[idx % colors.length];

              return (
                <li key={client.id}>
                  <Link
                    href={`/clients/${client.id}`}
                    title={!isExpanded ? client.name : undefined}
                    className={cn(
                      "flex items-center rounded-md transition-colors",
                      isExpanded ? "gap-3 px-3 py-2" : "justify-center p-1 mx-auto w-10 h-10",
                      isActive ? "bg-gray-100" : "hover:bg-gray-50"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-full flex items-center justify-center text-xs font-semibold shrink-0 cursor-pointer",
                        isExpanded ? "w-8 h-8" : "w-7 h-7",
                        color
                      )}
                    >
                      {initials}
                    </div>
                    {isExpanded && (
                      <div className="overflow-hidden">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {client.name}
                        </div>
                        {client.contact_email && (
                          <div className="text-xs text-gray-500 truncate">
                            {client.contact_email}
                          </div>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 border-t mt-auto">
          <Link href="/clients" className="text-sm text-blue-600 font-medium hover:underline flex justify-center w-full">
            View All Clients
          </Link>
        </div>
      )}
    </aside>
  );
}

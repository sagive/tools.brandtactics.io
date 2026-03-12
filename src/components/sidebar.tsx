"use client";

import Link from "next/link";
import { LayoutDashboard, Users, FileText, Mail, Settings, Briefcase, PlusCircle, ChevronRight, ChevronLeft, Menu, LayoutGrid } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";

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

  useEffect(() => {
    setMounted(true);
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
      </div>
    </aside>
  );
}

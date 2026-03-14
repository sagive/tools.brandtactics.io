"use client";

import Link from "next/link";
import { LayoutDashboard, Users, FileText, Mail, Settings, Briefcase, PlusCircle, ChevronRight, ChevronLeft, Menu, LayoutGrid, Command } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

      {/* Keyboard Shortcuts Helper */}
      <div className={cn("border-t p-3 border-gray-100 mt-auto", isExpanded ? "flex items-center" : "flex justify-center")}>
        <Popover>
          <PopoverTrigger>
            <Button variant="ghost" size="icon" className={cn("text-gray-400 hover:text-gray-600 focus-visible:ring-0", isExpanded ? "w-full justify-start px-2 gap-3" : "w-10 h-10")}>
              <Command className="w-4 h-4 shrink-0" />
              {isExpanded && <span className="text-sm font-medium">Shortcuts</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" sideOffset={16} className="w-72 p-0 shadow-lg border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50/80 px-4 py-3 border-b flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-900">Keyboard Shortcuts</span>
              <Command className="w-4 h-4 text-gray-500" />
            </div>
            <div className="p-2 space-y-1">
              
              <div className="flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors group cursor-default">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">New Task</span>
                <div className="flex items-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity">
                  <kbd className="bg-white border shadow-sm px-1.5 py-0.5 rounded text-[10px] font-semibold text-gray-600 tracking-widest uppercase">Alt</kbd>
                  <span className="text-gray-400 text-xs">+</span>
                  <kbd className="bg-white border shadow-sm px-1.5 py-0.5 rounded text-[10px] font-semibold text-gray-600 tracking-widest uppercase">Shift</kbd>
                  <span className="text-gray-400 text-xs">+</span>
                  <kbd className="bg-white border shadow-sm px-2 py-0.5 rounded text-[10px] font-semibold text-gray-600">3</kbd>
                </div>
              </div>

            </div>
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}

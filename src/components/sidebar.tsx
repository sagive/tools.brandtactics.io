"use client";

import Link from "next/link";
import { LayoutDashboard, Users, FileText, Mail, Settings, Briefcase, PlusCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Briefcase },
  { href: "/tasks", label: "All Tasks", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Mock clients for the sidebar list
const MOCK_CLIENTS = [
  { id: "1", name: "Acme Corp", initials: "AC", color: "bg-blue-100 text-blue-700", email: "contact@acme.com" },
  { id: "2", name: "Globex", initials: "GL", color: "bg-purple-100 text-purple-700", email: "info@globex.com" },
  { id: "3", name: "Initech", initials: "IN", color: "bg-green-100 text-green-700", email: "hello@initech.com" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-white h-screen flex flex-col shadow-sm z-10 hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600">
          <div className="bg-blue-600 text-white w-8 h-8 rounded shrink-0 flex items-center justify-center">
            BT
          </div>
          BrandTactics
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-6">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="px-4">
          <div className="flex items-center justify-between mb-2 px-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Clients
            </h3>
            <Link href="/clients/new" className="text-gray-400 hover:text-blue-600">
              <PlusCircle className="w-4 h-4" />
            </Link>
          </div>
          <ul className="space-y-1">
            {MOCK_CLIENTS.map((client) => {
              const isActive = pathname.includes(`/clients/${client.id}`);
              return (
                <li key={client.id}>
                  <Link
                    href={`/clients/${client.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      isActive ? "bg-gray-100" : "hover:bg-gray-50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                        client.color
                      )}
                    >
                      {client.initials}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {client.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {client.email}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      
      <div className="p-4 border-t mt-auto">
        <Link href="/clients" className="text-sm text-blue-600 font-medium hover:underline flex justify-center w-full">
          View All Clients
        </Link>
      </div>
    </aside>
  );
}

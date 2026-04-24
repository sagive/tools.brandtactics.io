"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, FileText, CheckCircle2, ArrowUpRight, ArrowDownRight, Loader2, BarChart3, PieChart, Activity } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";

function ReportsContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const { profile, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!profile || profile.role !== 'admin') {
    redirect("/dashboard");
  }

  const STATS = [
    { label: "Total SEO Updates", value: "1,284", change: "+12.5%", trendingUp: true, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Clients", value: "48", change: "+4", trendingUp: true, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Completed Tasks", value: "856", change: "+18%", trendingUp: true, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Avg. Response Rate", value: "92%", change: "-2.4%", trendingUp: false, icon: Activity, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Reports Hub
          </h1>
          <p className="text-gray-500 mt-1">Analytics and performance insights {clientId ? `for Client #${clientId}` : 'across all accounts'}.</p>
        </div>
        <div className="flex items-center gap-3">
           <Badge variant="outline" className="bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 border-blue-100 ring-4 ring-blue-50">
             Admin View
           </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className={stat.bg + " w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"}>
                <stat.icon className={"w-6 h-6 " + stat.color} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  <span className={stat.trendingUp ? "text-green-600 flex items-center text-xs font-bold" : "text-red-600 flex items-center text-xs font-bold"}>
                    {stat.trendingUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {stat.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart Placeholder */}
        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              SEO Update Velocity
            </CardTitle>
            <span className="text-[10px] uppercase font-bold text-gray-400">Last 30 Days</span>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-64 flex items-end gap-3 px-4">
               {[40, 65, 45, 90, 55, 75, 60, 85, 95, 70, 50, 80].map((h, i) => (
                 <div key={i} className="flex-1 bg-blue-100 rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer relative group" style={{ height: `${h}%` }}>
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                     {h} updates
                   </div>
                 </div>
               ))}
            </div>
            <div className="flex justify-between mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </CardContent>
        </Card>

        {/* Client Distribution Placeholder */}
        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              Client Retention by Industry
            </CardTitle>
            <span className="text-[10px] uppercase font-bold text-gray-400">YTD 2026</span>
          </CardHeader>
          <CardContent className="p-10 flex flex-col items-center">
            <div className="w-48 h-48 rounded-full border-[12px] border-blue-500 relative flex items-center justify-center">
               <div className="absolute inset-0 rounded-full border-[12px] border-purple-400 rotate-90" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }}></div>
               <div className="absolute inset-0 rounded-full border-[12px] border-green-400 rotate-180" style={{ clipPath: 'polygon(50% 50%, 0 50%, 0 100%)' }}></div>
               <div className="text-center">
                 <p className="text-3xl font-black text-gray-900">48</p>
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Active</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-10">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                 <span className="text-xs font-bold text-gray-700">Technology (45%)</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                 <span className="text-xs font-bold text-gray-700">E-commerce (25%)</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-green-400"></div>
                 <span className="text-xs font-bold text-gray-700">Real Estate (15%)</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                 <span className="text-xs font-bold text-gray-700">Other (15%)</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <ReportsContent />
    </Suspense>
  );
}

"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, FileText, CheckCircle2, ArrowUpRight, ArrowDownRight, Loader2, BarChart3, PieChart, Activity, Briefcase } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

function ReportsContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const { profile, isLoading } = useAuth();

  const [statsData, setStatsData] = useState({
    tasksThisMonth: 0,
    tasksLastMonth: 0,
    activeClients: 0,
    retainerClients: [] as any[],
  });
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      
      const { count: tasksThisMonth } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayThisMonth);
        
      const { count: tasksLastMonth } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayLastMonth)
        .lt('created_at', firstDayThisMonth);
        
      const { count: activeClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');
        
      const { data: retainerClients } = await supabase
        .from('clients')
        .select('name, type, monthly_fee')
        .eq('type', 'Retainer');
        
      setStatsData({
        tasksThisMonth: tasksThisMonth || 0,
        tasksLastMonth: tasksLastMonth || 0,
        activeClients: activeClients || 0,
        retainerClients: retainerClients || [],
      });
      setIsDataLoading(false);
    }
    
    if (profile?.role === 'admin') {
      fetchData();
    }
  }, [profile]);

  if (isLoading || isDataLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!profile || profile.role !== 'admin') {
    redirect("/dashboard");
  }

  const tasksChange = statsData.tasksLastMonth === 0 
    ? "+100%" 
    : `${((statsData.tasksThisMonth - statsData.tasksLastMonth) / statsData.tasksLastMonth * 100).toFixed(1)}%`;
  const tasksTrendingUp = statsData.tasksThisMonth >= statsData.tasksLastMonth;

  const STATS = [
    { label: "Tasks This Month", value: statsData.tasksThisMonth.toString(), change: tasksChange, trendingUp: tasksTrendingUp, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Clients", value: statsData.activeClients.toString(), change: "Total", trendingUp: true, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Completed Tasks", value: "856", change: "+18%", trendingUp: true, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Avg. Response Rate", value: "92%", change: "-2.4%", trendingUp: false, icon: Activity, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="p-8 space-y-8 w-full mx-auto">
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
        {/* Retainer Clients Table */}
        <Card className="border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Retainer Clients
            </CardTitle>
            <span className="text-[10px] uppercase font-bold text-gray-400">Current</span>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 sticky top-0">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Client Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Agreement Type</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Monthly Fee ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {statsData.retainerClients.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">No retainer clients found.</td>
                  </tr>
                ) : (
                  statsData.retainerClients.map((client, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{client.name || 'Unnamed Client'}</td>
                      <td className="px-6 py-4 text-gray-500">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none font-bold">
                          {client.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">${client.monthly_fee?.toLocaleString() || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 font-bold text-gray-900 sticky bottom-0 border-t border-gray-200">
                <tr>
                  <td className="px-6 py-4 uppercase text-xs tracking-wider" colSpan={2}>Total Monthly Retainer</td>
                  <td className="px-6 py-4 text-right text-blue-700">${statsData.retainerClients.reduce((sum, c) => sum + (Number(c.monthly_fee) || 0), 0).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
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

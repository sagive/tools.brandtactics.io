"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock, User, ChevronRight } from "lucide-react";
import Link from "next/link";
import { linkifyHtml } from "@/lib/utils";

export function ActivityWidget() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    // Set up real-time subscription for new logs
    const channel = supabase
      .channel('activity_logs_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_logs' 
      }, (payload) => {
        setLogs(prev => [payload.new, ...prev.slice(0, 19)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchLogs() {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setLoading(false);
    }
  }

  const getActionStyles = (type: string) => {
    switch (type) {
      case 'task_created': return "bg-orange-100 text-orange-700 border-orange-200";
      case 'task_status_changed': return "bg-blue-100 text-blue-700 border-blue-200";
      case 'seo_update_sent': return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'task_created': return "Task Created";
      case 'task_status_changed': return "Status Change";
      case 'seo_update_sent': return "SEO Update";
      default: return "Activity";
    }
  };

  return (
    <Card className="shadow-sm border-gray-200 h-full flex flex-col">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between shrink-0">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>Track latest workspace actions</CardDescription>
        </div>
        <Link href="/activity" className="text-xs text-blue-600 hover:underline font-medium">View All</Link>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden relative">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes marquee-up {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          .marquee-container {
            animation: marquee-up 40s linear infinite;
          }
          .marquee-container:hover {
            animation-play-state: paused;
          }
        `}} />
        
        <div className="h-[400px] overflow-hidden relative">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading activity...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 italic">No activity recorded yet.</div>
          ) : (
            <div className="marquee-container">
              {/* Duplicate the list to create a seamless loop */}
              {[...logs, ...logs].map((log, index) => (
                <div key={`${log.id}-${index}`} className="p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getActionStyles(log.action_type)}`}>
                        {getActionLabel(log.action_type)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-tight">
                        <span className="font-bold text-gray-900 mr-1 truncate inline-block max-w-[150px] align-bottom">{log.user_name}</span>
                        <span className="text-gray-600" dangerouslySetInnerHTML={{ __html: linkifyHtml(log.content) }} />
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Fading Gradients for Smoothness */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        </div>
      </CardContent>
    </Card>
  );
}

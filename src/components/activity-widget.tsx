"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock, User, ChevronRight } from "lucide-react";
import Link from "next/link";

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
        setLogs(prev => [payload.new, ...prev.slice(0, 9)]);
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
        .limit(10);

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
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading activity...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 italic">No activity recorded yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getActionStyles(log.action_type)}`}>
                        {getActionLabel(log.action_type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-tight">
                        <span className="font-bold text-gray-900 mr-1">{log.user_name}</span>
                        <span className="text-gray-600" dangerouslySetInnerHTML={{ __html: log.content }} />
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

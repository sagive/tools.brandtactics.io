"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock, Search, Filter, Loader2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

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

  const filteredLogs = logs.filter(log => 
    log.user_name?.toLowerCase().includes(search.toLowerCase()) || 
    log.content?.toLowerCase().includes(search.toLowerCase()) ||
    log.action_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Activity Dashboard</h1>
          <p className="text-sm text-gray-500 italic">Complete history of workspace actions and system events.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search activity logs..." 
            className="pl-9 bg-white border-gray-200" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Event Log
            </CardTitle>
            <Badge variant="outline" className="bg-white">{filteredLogs.length} Events</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm font-medium">Fetching history...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center">
              <Activity className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No activity logs found matching your search.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 pt-1">
                      <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200`}>
                        <User className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">{log.user_name}</span>
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getActionStyles(log.action_type)}`}>
                            {getActionLabel(log.action_type)}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div 
                        className="text-gray-700 text-sm leading-relaxed" 
                        dangerouslySetInnerHTML={{ __html: log.content }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

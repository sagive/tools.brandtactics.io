"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Zap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableTaskList } from "@/components/sortable-task-list";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

export default function ClientTasks({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);
  const { profile } = useAuth();

  const [autoOpenTaskId, setAutoOpenTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchTasks();
    
    // Check URL for direct task link ?task=ID
    const searchParams = new URLSearchParams(window.location.search);
    const taskId = searchParams.get('task');
    if (taskId) setAutoOpenTaskId(taskId);
    
    const handleRefresh = () => { if (id) fetchTasks(); };
    window.addEventListener("taskCreated", handleRefresh);
    return () => window.removeEventListener("taskCreated", handleRefresh);
  }, [id]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`*, clients(name)`)
        .eq("client_id", id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = data.map((t: any) => ({
        ...t,
        client: t.clients?.name || "Unknown Client",
        due: t.end_date ? new Date(t.end_date).toISOString().split('T')[0] : "No date"
      }));
      setTasks(formatted);
    } catch (error: any) {
      toast.error(error.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = (t.title || "").toLowerCase().includes(search.toLowerCase()) || 
                          (t.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesMyTasks = !showOnlyMyTasks || (
      (profile?.full_name && t.assignee === profile.full_name) || 
      (profile?.email && t.assignee === profile.email)
    );
    return matchesSearch && matchesMyTasks;
  });

  const pending = filteredTasks.filter(t => t.status === "Pending");
  const active = filteredTasks.filter(t => t.status === "Working on it" || t.status === "Review");
  const stuck = filteredTasks.filter(t => t.status === "Stuck");
  const completed = filteredTasks.filter(t => t.status === "Completed");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search tasks..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            variant={showOnlyMyTasks ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyMyTasks(!showOnlyMyTasks)}
            className={cn(
              "h-10 px-4 font-semibold transition-all shrink-0",
              showOnlyMyTasks ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-white text-gray-600 border-gray-200"
            )}
          >
            My Tasks
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">Loading tasks...</div>
        ) : (
          <>
            <SortableTaskList title="Pending" initialTasks={pending} onRefresh={fetchTasks} autoOpenTaskId={autoOpenTaskId} />
            <SortableTaskList title="Working on it / Review" initialTasks={active} onRefresh={fetchTasks} autoOpenTaskId={autoOpenTaskId} />
            <SortableTaskList title="Need Help / Stuck" initialTasks={stuck} onRefresh={fetchTasks} autoOpenTaskId={autoOpenTaskId} />
            <SortableTaskList title="Completed" initialTasks={completed} onRefresh={fetchTasks} autoOpenTaskId={autoOpenTaskId} />
            {filteredTasks.length === 0 && (
               <div className="text-center py-10 text-gray-500 bg-white border rounded-lg border-dashed">
                 No tasks found for this client.
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableTaskList } from "@/components/sortable-task-list";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { supabase } from "@/lib/supabase";

export default function ClientTasks({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchTasks();
    
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

  const filteredTasks = tasks.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()));

  const pending = filteredTasks.filter(t => t.status === "Pending");
  const active = filteredTasks.filter(t => t.status === "Working on it" || t.status === "Review");
  const stuck = filteredTasks.filter(t => t.status === "Stuck");
  const completed = filteredTasks.filter(t => t.status === "Completed");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search tasks..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        

      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">Loading tasks...</div>
        ) : (
          <>
            <SortableTaskList title="Pending" initialTasks={pending} onRefresh={fetchTasks} />
            <SortableTaskList title="Working on it / Review" initialTasks={active} onRefresh={fetchTasks} />
            <SortableTaskList title="Need Help / Stuck" initialTasks={stuck} onRefresh={fetchTasks} />
            <SortableTaskList title="Completed" initialTasks={completed} onRefresh={fetchTasks} />
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


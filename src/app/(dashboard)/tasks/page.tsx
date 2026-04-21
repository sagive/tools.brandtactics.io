"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Zap } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { SortableTaskList } from "@/components/sortable-task-list";
import { EditTaskDialog } from "@/components/edit-task-dialog";

export default function GlobalTasksPage() {
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState("All");
  const { profile, isLoading: isAuthLoading } = useAuth();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAuthLoading) {
      fetchTasks();
    }
  }, [isAuthLoading, profile?.id]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          clients (
            name
          )
        `)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      let formatted = data.map((t: any) => ({
        ...t,
        client: t.clients?.name || "Unknown Client",
        client_id: t.client_id, // ensure client_id is kept for filtering
        due: t.end_date ? new Date(t.end_date).toISOString().split('T')[0] : "No date"
      }));
      
      if (profile && !isAdmin) {
        const allowed = profile.accessible_clients || [];
        if (!allowed.includes('all')) {
          formatted = formatted.filter((t: any) => allowed.includes(t.client_id));
        }
      }
      
      setTasks(formatted);
    } catch (error: any) {
      toast.error(error.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase()) || 
                          t.client?.toLowerCase().includes(search.toLowerCase());
    const matchesClient = clientFilter === "All" || t.client === clientFilter;
    return matchesSearch && matchesClient;
  });

  const uniqueClients = Array.from(new Set(tasks.map(t => t.client).filter(Boolean))).sort();

  const pending = filteredTasks.filter(t => t.status === "Pending");
  const active = filteredTasks.filter(t => t.status === "Working on it" || t.status === "Review");
  const stuck = filteredTasks.filter(t => t.status === "Stuck");
  const completed = filteredTasks.filter(t => t.status === "Completed");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">All Tasks</h1>
          <p className="text-gray-500 mt-1">Manage global tasks across all clients.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search tasks or clients..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-9 bg-white">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Clients</SelectItem>
            {uniqueClients.map(c => (
              <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex w-full sm:w-auto items-center gap-2 flex-col sm:flex-row">
          <Link href="/tasks/quick" className="w-full sm:w-auto">
            <Button variant="default" className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 px-3 w-full sm:w-auto" title="Quick Task (AI)">
              <Zap className="w-4 h-4 sm:mr-2" />
              <span className="inline">Quick Add</span>
            </Button>
          </Link>
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Full Task
            </DialogTrigger>
            <EditTaskDialog onTaskCreated={fetchTasks} />
          </Dialog>
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
                 No tasks found matching your search.
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


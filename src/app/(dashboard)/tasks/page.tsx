"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Zap, Languages } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { SortableTaskList } from "@/components/sortable-task-list";
import { EditTaskDialog } from "@/components/edit-task-dialog";

export default function GlobalTasksPage() {
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState("");
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'open' | 'completed'>('open');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const { profile, isLoading: isAuthLoading } = useAuth();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAuthLoading) {
      fetchTasks();
    }
  }, [isAuthLoading, profile?.id, statusFilter]);

  useEffect(() => {
    const saved = localStorage.getItem('tasks-direction');
    if (saved === 'rtl' || saved === 'ltr') {
      setDirection(saved);
    }
  }, []);

  const toggleDirection = () => {
    const newDir = direction === 'ltr' ? 'rtl' : 'ltr';
    setDirection(newDir);
    localStorage.setItem('tasks-direction', newDir);
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          clients (
            name
          )
        `);
      
      if (statusFilter === 'open') {
        query = query.neq('status', 'Completed');
      } else {
        query = query.eq('status', 'Completed');
      }

      const { data, error } = await query.order("created_at", { ascending: false });
        
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
    const matchesClient = clientFilter === "" || t.client === clientFilter;
    const matchesMyTasks = !showOnlyMyTasks || (
      (profile?.full_name && t.assignee === profile.full_name) || 
      (profile?.email && t.assignee === profile.email)
    );
    return matchesSearch && matchesClient && matchesMyTasks;
  });
  
  const myTasksCount = tasks.filter(t => (
    (profile?.full_name && t.assignee === profile.full_name) || 
    (profile?.email && t.assignee === profile.email)
  )).length;

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

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <Button 
            variant={showOnlyMyTasks ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyMyTasks(!showOnlyMyTasks)}
            className={cn(
              "h-10 px-4 font-semibold transition-all relative",
              showOnlyMyTasks ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-white text-gray-600 border-gray-200"
            )}
          >
            My Tasks
            {myTasksCount > 0 && (
              <span className={cn(
                "ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                showOnlyMyTasks ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              )}>
                {myTasksCount}
              </span>
            )}
          </Button>

          <Button 
            variant="outline"
            size="sm"
            onClick={toggleDirection}
            className="h-10 px-3 bg-white text-gray-600 border-gray-200"
          >
            <Languages className={cn("w-4 h-4", direction === 'rtl' && "text-blue-600")} />
            <span className="ml-2 text-[10px] font-bold uppercase">{direction}</span>
          </Button>

          <Select value={clientFilter} onValueChange={(val) => setClientFilter(val || "")}>
            <SelectTrigger className="w-[180px] h-10 bg-white font-medium border-gray-200">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Filter by client</SelectItem>
              {uniqueClients.map(c => (
                <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setStatusFilter('open')}
              className={cn(
                "h-8 px-3 text-xs font-bold transition-all rounded-md",
                statusFilter === 'open' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Open
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setStatusFilter('completed')}
              className={cn(
                "h-8 px-3 text-xs font-bold transition-all rounded-md",
                statusFilter === 'completed' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Completed
            </Button>
          </div>
          
          <Link href="/tasks/quick">
            <Button variant="default" className="h-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4">
              <Zap className="w-4 h-4 mr-2" />
              Quick Add
            </Button>
          </Link>

          <Dialog>
            <DialogTrigger render={<Button className="h-10 bg-blue-600 text-white hover:bg-blue-700 font-semibold px-4" />}>
              <Plus className="w-4 h-4 mr-2" /> Full Task
            </DialogTrigger>
            <EditTaskDialog onTaskCreated={fetchTasks} />
          </Dialog>
        </div>
      </div>

      <div className="space-y-6" dir={direction}>
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">Loading tasks...</div>
        ) : (
          <>
            {statusFilter === 'open' ? (
              <>
                <SortableTaskList title="Pending" initialTasks={pending} onRefresh={fetchTasks} />
                <SortableTaskList title="Working on it / Review" initialTasks={active} onRefresh={fetchTasks} />
                <SortableTaskList title="Need Help / Stuck" initialTasks={stuck} onRefresh={fetchTasks} />
              </>
            ) : (
              <SortableTaskList title="Completed" initialTasks={completed} onRefresh={fetchTasks} />
            )}
            
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


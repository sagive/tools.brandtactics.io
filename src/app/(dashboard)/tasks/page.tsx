"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { SortableTaskList } from "@/components/sortable-task-list";

const MOCK_ALL_TASKS = [
  ...Array.from({ length: 3 }).map((_, i) => ({ id: `p${i}`, client: "Acme Corp", title: `Review Analytics ${i}`, status: "Pending", due: "2023-11-20", priority: "Medium", assignee: "imri" })),
  ...Array.from({ length: 2 }).map((_, i) => ({ id: `s${i}`, client: "Globex", title: `Content Strategy ${i}`, status: "Stuck", due: "2023-11-15", priority: "High", assignee: "sarah" })),
  ...Array.from({ length: 2 }).map((_, i) => ({ id: `i${i}`, client: "Initech", title: `On-Page SEO ${i}`, status: "Working on it", due: "2023-11-25", priority: "Medium", assignee: "mark" })),
  ...Array.from({ length: 2 }).map((_, i) => ({ id: `r${i}`, client: "Initech", title: `Content Edits ${i}`, status: "Review", due: "2023-11-28", priority: "Medium", assignee: "mark" })),
];

export default function GlobalTasksPage() {
  const [search, setSearch] = useState("");

  const filteredTasks = MOCK_ALL_TASKS.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.client.toLowerCase().includes(search.toLowerCase())
  );

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
        
        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> New Task
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select defaultValue="Acme Corp">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acme Corp">Acme Corp</SelectItem>
                    <SelectItem value="Globex">Globex</SelectItem>
                    <SelectItem value="Initech">Initech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Task title..." />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select defaultValue="Pending">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Working on it">Working on it</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Stuck">Stuck</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Save Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <SortableTaskList title="Pending" initialTasks={pending} />
        <SortableTaskList title="Working on it / Review" initialTasks={active} />
        <SortableTaskList title="Need Help / Stuck" initialTasks={stuck} />
        <SortableTaskList title="Completed" initialTasks={completed} />
        
        {filteredTasks.length === 0 && (
           <div className="text-center py-10 text-gray-500 bg-white border rounded-lg border-dashed">
             No tasks found matching your search.
           </div>
        )}
      </div>
    </div>
  );
}


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

const MOCK_ALL_TASKS = [
  ...Array.from({ length: 3 }).map((_, i) => ({ id: `p${i}`, client: "Acme Corp", title: `Review Analytics ${i}`, status: "Pending", due: "2023-11-20", priority: "Medium" })),
  ...Array.from({ length: 2 }).map((_, i) => ({ id: `s${i}`, client: "Globex", title: `Content Strategy ${i}`, status: "Stuck", due: "2023-11-15", priority: "High" })),
  ...Array.from({ length: 4 }).map((_, i) => ({ id: `i${i}`, client: "Initech", title: `On-Page SEO ${i}`, status: "In Progress", due: "2023-11-25", priority: "Medium" })),
];

export default function GlobalTasksPage() {
  const [search, setSearch] = useState("");

  const filteredTasks = MOCK_ALL_TASKS.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.client.toLowerCase().includes(search.toLowerCase())
  );

  const pending = filteredTasks.filter(t => t.status === "Pending" || t.status === "In Progress");
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
                    <SelectItem value="In Progress">In Progress</SelectItem>
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
        <TaskSection title="Pending & In Progress" tasks={pending} />
        <TaskSection title="Need Help / Stuck" tasks={stuck} />
        <TaskSection title="Completed" tasks={completed} />
        
        {filteredTasks.length === 0 && (
           <div className="text-center py-10 text-gray-500 bg-white border rounded-lg border-dashed">
             No tasks found matching your search.
           </div>
        )}
      </div>
    </div>
  );
}

function TaskSection({ title, tasks }: { title: string, tasks: any[] }) {
  if (tasks.length === 0) return null;

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="bg-gray-50/80 px-4 py-3 border-b font-medium text-gray-900">
        {title} ({tasks.length})
      </div>
      <div className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                 <p className="font-medium text-gray-900">{task.title}</p>
                 <Badge variant="outline" className="text-xs">{task.client}</Badge>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>Due: {task.due}</span>
                <span>Priority: {task.priority}</span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <Badge variant={task.status === 'Completed' ? 'outline' : 'secondary'} className={
                task.status === 'Stuck' ? 'bg-red-50 text-red-700' :
                task.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                'bg-gray-100 text-gray-700'
              }>
                {task.status}
              </Badge>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-gray-400 hover:text-blue-600">
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => toast.success("Task deleted.")}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

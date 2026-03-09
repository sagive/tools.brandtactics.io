"use client";

import React from "react";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MOCK_TASKS = [
  ...Array.from({ length: 4 }).map((_, i) => ({ id: `p${i}`, title: `Pending Task ${i}`, status: "Pending", due: "2023-11-20", priority: "Medium" })),
  ...Array.from({ length: 3 }).map((_, i) => ({ id: `s${i}`, title: `Stuck Task ${i}`, status: "Stuck", due: "2023-11-15", priority: "High" })),
  ...Array.from({ length: 5 }).map((_, i) => ({ id: `i${i}`, title: `In Progress Task ${i}`, status: "In Progress", due: "2023-11-25", priority: "Medium" })),
  ...Array.from({ length: 6 }).map((_, i) => ({ id: `c${i}`, title: `Completed Task ${i}`, status: "Completed", due: "2023-11-01", priority: "Low" })),
];

export default function ClientTasks({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params); // Added for side-effects if needed, or just type correction
  const [search, setSearch] = useState("");

  const filteredTasks = MOCK_TASKS.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const pending = filteredTasks.filter(t => t.status === "Pending" || t.status === "In Progress");
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
        <TaskSection title="Pending & In Progress" tasks={pending} headerColor="border-l-4 border-blue-500" />
        <TaskSection title="Need Help / Stuck" tasks={stuck} headerColor="border-l-4 border-red-500" />
        <TaskSection title="Completed" tasks={completed} headerColor="border-l-4 border-green-500" />
      </div>
    </div>
  );
}

function TaskSection({ title, tasks, headerColor }: { title: string, tasks: any[], headerColor: string }) {
  if (tasks.length === 0) return null;

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className={`bg-gray-50/80 px-4 py-3 border-b font-medium text-gray-900 ${headerColor}`}>
        {title} ({tasks.length})
      </div>
      <div className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex-1">
              <p className="font-medium text-gray-900 mb-1">{task.title}</p>
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

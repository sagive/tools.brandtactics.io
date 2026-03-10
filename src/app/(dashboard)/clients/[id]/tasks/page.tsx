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
import { SortableTaskList } from "@/components/sortable-task-list";

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
        <SortableTaskList title="Pending & In Progress" initialTasks={pending} />
        <SortableTaskList title="Need Help / Stuck" initialTasks={stuck} />
        <SortableTaskList title="Completed" initialTasks={completed} />
      </div>
    </div>
  );
}


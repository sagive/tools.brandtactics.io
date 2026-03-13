"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Gauge, Calendar, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function SortableTaskItem({ task, onDelete, onUpdate, autoOpenTaskId }: { task: any, onDelete?: () => void, onUpdate?: () => void, autoOpenTaskId?: string | null }) {
  const [status, setStatus] = useState(task.status);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const handleStatusChange = async (val: string) => {
    setStatus(val);
    try {
      const { error } = await supabase.from('tasks').update({ status: val }).eq('id', task.id);
      if (error) throw error;
      toast.success(`Task status updated to ${val}`);
    } catch (error: any) {
      toast.error("Failed to update status");
      setStatus(task.status); // revert
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;
      onDelete?.();
      toast.success("Task deleted");
    } catch (error: any) {
      toast.error("Failed to delete task");
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white border-b hover:bg-slate-50 group">
      
      {/* Mobile-friendly container for order handle & Title */}
      <div className="flex items-center flex-1 gap-2 min-w-0">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0 touch-none">
          <GripVertical className="w-5 h-5" />
        </button>
        
        <Dialog defaultOpen={autoOpenTaskId === task.id}>
          <DialogTrigger className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 cursor-pointer min-w-0 bg-transparent border-0 text-left p-0 mx-0 outline-none w-full">
            <span className="font-medium text-sm text-gray-900 truncate pr-4 block">{task.title}</span>
            
            {/* Metadata Area (Visible on tablets and up) */}
            <div className="hidden md:flex items-center text-[11px] sm:text-xs text-gray-500 shrink-0 ml-auto gap-6 pr-4">
               
               {/* Unified Actor Flow (Requester -> Assignee) */}
               <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-medium text-[10px] border border-gray-200/50" title={`Requested by: ${task.requester || 'Client'}`}>
                    {task.requester || 'Client'}
                  </div>
                  
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 shrink-0"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  
                  <div className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-medium text-[10px] border border-gray-200/50 flex items-center gap-1.5" title={`Assigned to: ${task.assignee || 'Unassigned'}`}>
                    {task.assignee ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600 shrink-0">
                          {task.assignee.charAt(0).toUpperCase()}
                        </div>
                        {task.assignee}
                      </>
                    ) : (
                      <span className="italic opacity-60 text-gray-400 font-normal">Unassigned</span>
                    )}
                  </div>
               </div>

               <div className="flex items-center gap-1.5 min-w-[100px]" title="Due Date">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium text-gray-700">{task.due}</span>
               </div>

               <div className="flex items-center gap-1.5" title="Priority">
                  <Gauge className="w-3.5 h-3.5 text-gray-400" />
                  <span className={cn(
                    "font-bold uppercase text-[9px] tracking-wider",
                    task.priority === 'High' ? 'text-red-500' : task.priority === 'Medium' ? 'text-yellow-600' : 'text-gray-400'
                  )}>
                    {task.priority === 'Medium' ? 'NORMAL' : task.priority}
                  </span>
               </div>
            </div>
          </DialogTrigger>
          <EditTaskDialog task={task} onTaskCreated={onUpdate} />
        </Dialog>
      </div>

      {/* Right side actions and status */}
      <div className="flex items-center justify-between sm:justify-start gap-2 pl-7 sm:pl-0 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
        
        <div className="w-[130px] shrink-0">
          <Select 
            value={status} 
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className={`h-6 text-[10px] sm:text-xs font-medium px-3 py-0 border-0 focus:ring-0 shadow-none rounded-full w-full ${
                status === 'Stuck' ? 'bg-red-50 text-red-700 hover:bg-red-100' :
                status === 'Working on it' ? 'bg-amber-100 text-black hover:bg-amber-200' :
                status === 'Review' ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' :
                status === 'Completed' ? 'bg-green-50 text-green-700 hover:bg-green-100' :
                'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Working on it">Working on it</SelectItem>
              <SelectItem value="Review">Review</SelectItem>
              <SelectItem value="Stuck">Stuck</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog>
          <DialogTrigger className="text-gray-400 hover:text-blue-600 cursor-pointer hidden sm:flex items-center justify-center bg-transparent border-0 p-0 outline-none w-8 h-8 rounded-full hover:bg-gray-100 shrink-0" title="Edit">
             <Pencil className="w-4 h-4" />
          </DialogTrigger>
          <EditTaskDialog task={task} onTaskCreated={onUpdate} />
        </Dialog>
        
        {/* Delete functionality removed per user request */}
      </div>

    </div>
  );
}

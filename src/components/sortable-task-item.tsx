"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export function SortableTaskItem({ task, onDelete }: { task: any, onDelete?: () => void }) {
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
        
        <Dialog>
          <DialogTrigger className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 cursor-pointer min-w-0 bg-transparent border-0 text-left p-0 mx-0 outline-none w-full">
            <span className="font-medium text-sm text-gray-900 truncate flex-1 pr-2 block">{task.title}</span>
            {task.client && <Badge variant="outline" className="hidden lg:inline-flex text-[10px] text-gray-500 font-medium shrink-0 bg-transparent mr-2">{task.client}</Badge>}
            
            {/* Due Date and Priority (Hidden on small screens) */}
            <div className="hidden md:flex items-center text-[11px] sm:text-xs text-gray-500 shrink-0">
               
               {/* Assigned User */}
               <div className="flex items-center gap-1.5 w-24 shrink-0">
                 {task.assignee ? (
                   <>
                     <Avatar className="w-5 h-5 border shadow-sm">
                       <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignee}`} />
                       <AvatarFallback className="text-[9px]">{task.assignee.substring(0, 2).toUpperCase()}</AvatarFallback>
                     </Avatar>
                     <span className="font-medium text-gray-700 hidden xl:inline-block truncate">{task.assignee}</span>
                   </>
                 ) : (
                   <span className="text-gray-400 italic">Unassigned</span>
                 )}
               </div>

               <span className="w-32 shrink-0">Due: {task.due}</span>
               <span className="flex items-center gap-1 w-32 shrink-0">Priority: <span className={task.priority === 'High' ? 'text-red-500 font-medium' : task.priority === 'Medium' ? 'text-yellow-600 font-medium' : 'text-gray-500'}>{task.priority}</span></span>
            </div>
          </DialogTrigger>
          <EditTaskDialog task={task} />
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
                status === 'Working on it' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
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
          <DialogTrigger className="text-gray-400 text-xs font-semibold hover:text-blue-600 cursor-pointer hidden sm:inline-block bg-transparent border-0 p-0 outline-none w-10 text-center shrink-0">
             Edit
          </DialogTrigger>
          <EditTaskDialog task={task} />
        </Dialog>
        
        <button 
          onClick={handleDelete}
          className="text-gray-300 hover:text-red-600 p-1 sm:opacity-0 group-hover:opacity-100 transition-opacity w-8 flex justify-center shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}

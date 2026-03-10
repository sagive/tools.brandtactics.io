"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditTaskDialog } from "@/components/edit-task-dialog";

export function SortableTaskItem({ task, onDelete }: { task: any, onDelete?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

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
          <DialogTrigger className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 cursor-pointer min-w-0 bg-transparent border-0 text-left p-0 mx-0 outline-none">
            <span className="font-medium text-sm text-gray-900 truncate sm:max-w-[300px] shrink-0 block">{task.title}</span>
            {task.client && <Badge variant="outline" className="hidden lg:inline-flex text-[10px] text-gray-500 font-medium shrink-0 bg-transparent">{task.client}</Badge>}
            
            {/* Due Date and Priority (Hidden on small screens) */}
            <div className="hidden md:flex items-center gap-4 text-[11px] sm:text-xs text-gray-500 truncate flex-1 justify-end sm:mr-4">
               
               {/* Assigned User */}
               <div className="flex items-center gap-1.5 mr-2">
                 {task.assignee ? (
                   <>
                     <Avatar className="w-5 h-5 border shadow-sm">
                       <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignee}`} />
                       <AvatarFallback className="text-[9px]">{task.assignee.substring(0, 2).toUpperCase()}</AvatarFallback>
                     </Avatar>
                     <span className="font-medium text-gray-700 hidden lg:inline-block">{task.assignee}</span>
                   </>
                 ) : (
                   <span className="text-gray-400 italic">Unassigned</span>
                 )}
               </div>

               <span className="w-24 shrink-0 text-right">Due: {task.due}</span>
               <span className="flex items-center gap-1 w-24 shrink-0 justify-end">Priority: <span className={task.priority === 'High' ? 'text-red-500 font-medium' : task.priority === 'Medium' ? 'text-yellow-600 font-medium' : 'text-gray-500'}>{task.priority}</span></span>
            </div>
          </DialogTrigger>
          <EditTaskDialog task={task} />
        </Dialog>
      </div>

      {/* Right side actions and status */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
        <Badge variant="secondary" className={`shrink-0 text-[10px] sm:text-xs font-medium px-2 py-0 h-5 sm:h-6 ${
            task.status === 'Stuck' ? 'bg-red-50 text-red-700 hover:bg-red-50' :
            task.status === 'Working on it' ? 'bg-blue-50 text-blue-700 hover:bg-blue-50' :
            task.status === 'Review' ? 'bg-purple-50 text-purple-700 hover:bg-purple-50' :
            task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50' :
            'bg-gray-100 text-gray-700 hover:bg-gray-100'
          }`}>
          {task.status}
        </Badge>

        <Dialog>
          <DialogTrigger className="text-gray-400 text-xs font-semibold hover:text-blue-600 cursor-pointer hidden sm:inline-block bg-transparent border-0 p-0 outline-none">
             Edit
          </DialogTrigger>
          <EditTaskDialog task={task} />
        </Dialog>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          className="text-gray-300 hover:text-red-600 p-1 sm:opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}

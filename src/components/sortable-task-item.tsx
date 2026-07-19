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
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

function stripHtml(html: string) {
  if (!html) return "";
  // First, replace common block elements with spaces to avoid merging words
  let text = html.replace(/<(p|br|div|li|h[1-6])[^>]*>/gi, ' ');
  // Then remove all other tags
  text = text.replace(/<[^>]*>?/gm, '');
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"');
  // Collapse multiple spaces
  return text.replace(/\s+/g, ' ').trim();
}

export function SortableTaskItem({ task, onDelete, onUpdate, autoOpenTaskId, hideClientBadge }: { task: any, onDelete?: () => void, onUpdate?: () => void, autoOpenTaskId?: string | null, hideClientBadge?: boolean }) {
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
    <div ref={setNodeRef} style={style} data-id={task.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-1.5 py-1 sm:py-1.5 bg-white border-b hover:bg-slate-50 group">
      
      <div className="flex items-center flex-1 gap-1.5 sm:gap-2 min-w-0">
        {/* Grip Handle — moved to before the title */}
        <button {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0 touch-none">
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Task Description */}
        <Dialog defaultOpen={autoOpenTaskId === task.id}>
          <DialogTrigger className={cn(
            "flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 cursor-pointer min-w-0 bg-transparent border-0 p-0 mx-0 outline-none group/title",
            "text-left rtl:text-right"
          )}>
            <span className="font-medium text-sm text-gray-900 truncate pr-2 block group-hover/title:text-blue-600 transition-colors">
              {stripHtml(task.description || task.title).substring(0, 75)}
              {stripHtml(task.description || task.title).length > 75 ? '...' : ''}
            </span>
          </DialogTrigger>
          <EditTaskDialog task={task} onTaskCreated={onUpdate} />
        </Dialog>

        {/* Icons Area (Metadata + Actions) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Metadata Area (Visible on tablets and up) */}
          <div className="hidden md:flex items-center text-[11px] sm:text-xs text-gray-500 gap-3">
            {/* Client Box — hidden inside client page, shown in global tasks */}
            {!hideClientBadge && (
              <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 border-blue-200 uppercase tracking-wide truncate max-w-[130px] shrink-0 font-bold px-1.5 py-0">
                {task.client}
              </Badge>
            )}

            {/* Unified Actor Flow (Requester -> Assignee) */}
            <div className="flex items-center gap-1">
              <TooltipProvider delay={300}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-medium text-[10px] border border-gray-200/50 cursor-default">
                      {task.requester || 'Client'}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Requested by: {task.requester || 'Client'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 shrink-0"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              
              <TooltipProvider delay={300}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-medium text-[10px] border border-gray-200/50 flex items-center gap-1.5 cursor-default">
                      {task.assignee ? (
                        <>
                          <div className="w-3 h-3 rounded-full bg-blue-100 flex items-center justify-center text-[7px] font-bold text-blue-600 shrink-0">
                            {task.assignee.charAt(0).toUpperCase()}
                          </div>
                          {task.assignee}
                        </>
                      ) : (
                        <span className="italic opacity-60 text-gray-400 font-normal">Unassigned</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Assigned to: {task.assignee || 'Unassigned'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <TooltipProvider delay={300}>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 cursor-default px-0.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-gray-700">{task.due}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Due Date</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delay={300}>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center px-1">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-sm shrink-0",
                      task.priority === 'High' ? 'bg-red-500' : 
                      task.priority === 'Medium' ? 'bg-green-500' : 
                      'bg-gray-400'
                    )} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Priority</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Status Dropdown */}
          <div className="w-[100px] shrink-0">
            <Select 
              value={status} 
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className={cn(
                "h-[30px] min-h-[30px] text-[10px] sm:text-xs font-medium px-2 leading-none border-0 focus:ring-0 shadow-none rounded-none w-full",
                status === 'Stuck' ? 'bg-red-50 text-red-700 hover:bg-red-100' :
                status === 'Working on it' ? 'bg-amber-100 text-black hover:bg-amber-200' :
                status === 'Review' ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' :
                status === 'Completed' ? 'bg-green-50 text-green-700 hover:bg-green-100' :
                'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}>
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

          {/* Edit Button — far right */}
          {hideClientBadge ? (
            <Dialog>
              <DialogTrigger data-name="edit-task" data-task-id={task.id} className="focus:outline-none">
                <Badge variant="outline" className="text-[10px] text-gray-600 bg-gray-100 border-gray-200 uppercase tracking-wide shrink-0 font-bold px-2 h-[30px] cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-1 rounded-none">
                  <Pencil className="w-3 h-3" />
                  Edit
                </Badge>
              </DialogTrigger>
              <EditTaskDialog task={task} onTaskCreated={onUpdate} />
            </Dialog>
          ) : (
            <Dialog>
              <TooltipProvider delay={300}>
                <Tooltip>
                  <TooltipTrigger render={
                    <DialogTrigger data-name="edit-task" data-task-id={task.id} className="text-gray-400 hover:text-blue-600 cursor-pointer flex items-center justify-center bg-transparent border-0 p-0 outline-none w-7 h-7 rounded-full hover:bg-gray-100 shrink-0">
                        <Pencil className="w-4 h-4" />
                    </DialogTrigger>
                  } />
                  <TooltipContent side="top">
                    <p>Edit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <EditTaskDialog task={task} onTaskCreated={onUpdate} />
            </Dialog>
          )}
        </div>
      </div>

      {/* Right side actions removed - moved to the start */}

    </div>
  );
}

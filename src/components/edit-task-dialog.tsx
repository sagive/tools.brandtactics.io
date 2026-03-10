"use client";

import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BellIcon, Link2, List, Bold, Italic, Underline, Strikethrough, SmilePlus, X, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function EditTaskDialog({ task, defaultClientId, onTaskCreated }: { task?: any, defaultClientId?: string, onTaskCreated?: () => void }) {
  const isEditing = !!task;
  const [isOpen, setIsOpen] = useState(true); // Internal state for Dialog if needed, but we typically use DialogClose or parent state.
  // Actually, the dialog is controlled by the parent <Dialog> in sortable-task-item and client-tasks.
  // However, DialogClose can be triggered via a ref or by just clicking it.
  // But wait, the standard way in Shadcn is to provide an onOpenChange.
  // Let's check how it's called.
  const [newComment, setNewComment] = useState("");
  const [isEditingComment, setIsEditingComment] = useState(false);
  
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState(task?.status || "Pending");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [assignee, setAssignee] = useState(task?.assignee || "mark");
  const [estimateHours, setEstimateHours] = useState<number>(task?.estimate_hours || 0);
  const [comments, setComments] = useState<any[]>(task?.comments || []);
  const [clientId, setClientId] = useState(task?.client_id || defaultClientId || "");
  const [dueDate, setDueDate] = useState<string>(task?.end_date ? new Date(task.end_date).toISOString().split('T')[0] : "");
  const [clients, setClients] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Field display names for toasts
  const FIELD_LABELS: Record<string, string> = {
    title: "Title",
    description: "Description",
    status: "Status",
    priority: "Priority",
    assignee: "Assignee",
    estimate_hours: "Estimate",
    end_date: "Due Date",
    comments: "Comments",
    client_id: "Client"
  };

  useEffect(() => {
    if (!isEditing && !defaultClientId) {
      supabase.from('clients').select('id, name').order('name').then(({data}) => {
         if (data) setClients(data);
      });
    }
  }, [isEditing, defaultClientId]);

  const createdDate = task?.created_at 
    ? new Date(task.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : "Unknown date";

  // Debounced auto-save for text fields
  useEffect(() => {
    if (!isEditing) return;
    const timeoutId = setTimeout(() => {
      if (title !== task.title || description !== task.description) {
        supabase.from('tasks').update({ title, description }).eq('id', task.id)
          .then(({error}) => { 
             if (error) toast.error("Failed to auto-save task"); 
          });
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [title, description, isEditing, task?.id, task?.title, task?.description]);

  const updateField = async (field: string, value: any) => {
    if (!isEditing) return;
    try {
      const { error } = await supabase.from('tasks').update({ [field]: value }).eq('id', task.id);
      if (error) throw error;
      toast.success(`${FIELD_LABELS[field] || field} saved`);
    } catch (err: any) {
      toast.error(`Failed to save ${FIELD_LABELS[field] || field}`);
    }
  };

  const handleUpdateTask = async () => {
    if (!isEditing) return;
    if (!title.trim()) { toast.error("Title is required"); return; }
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('tasks').update({
        title,
        description,
        status,
        priority,
        assignee,
        estimate_hours: estimateHours,
        end_date: dueDate || null,
        comments
      }).eq('id', task.id);
      
      if (error) throw error;
      toast.success("Task updated successfully");
      onTaskCreated?.(); // Refresh parent list
      
      // We need a way to close the dialog. Since we are inside DialogContent, 
      // the CSS class "DialogClose" or a click on it works. 
      // For programmatic close, we usually need the state from the parent or a hidden button.
      const closeButton = document.querySelector('[data-slot="dialog-close"]') as HTMLButtonElement;
      if (closeButton) closeButton.click();
      
    } catch (err: any) {
      toast.error(err.message || "Failed to update task");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePublishComment = async () => {
    if (!newComment.trim() || !isEditing) return;
    const comment = { 
      id: Date.now().toString(), 
      user: 'ME', 
      text: newComment.trim(), 
      timestamp: new Date().toISOString() 
    };
    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    setNewComment("");
    await updateField("comments", updatedComments);
  };

  const handleCreateTask = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!clientId) { toast.error("Client is required"); return; }
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase.from('tasks').insert([{
        title,
        description,
        status,
        priority,
        assignee,
        estimate_hours: estimateHours,
        end_date: dueDate || null,
        client_id: clientId,
        comments
      }]).select().single();
      
      if (error) throw error;
      toast.success("Task created successfully");
      onTaskCreated?.();
      
      // Programmatic close
      const closeButton = document.querySelector('[data-slot="dialog-close"]') as HTMLButtonElement;
      if (closeButton) closeButton.click();
      
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DialogContent showCloseButton={false} className="max-w-[100%] sm:max-w-none sm:min-w-[850px] w-full sm:w-auto p-0 overflow-hidden bg-white">
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <DialogTitle className="text-xl font-bold">{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
          <div className="flex items-center gap-6 text-sm text-gray-500">
             
             {/* Date Picker Auto-save wrapper */}
             <div className="relative flex items-center gap-2 group cursor-pointer hover:text-gray-900">
               <span className="font-medium">Due: {dueDate ? new Date(dueDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : "Set Date"}</span>
               <Input 
                 type="date" 
                 value={dueDate}
                 className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 m-0 z-10" 
                 onChange={(e) => { 
                   setDueDate(e.target.value); 
                   updateField('end_date', e.target.value); 
                 }}
               />
             </div>
             
             {/* Reminder Dropdown */}
             <DropdownMenu>
               <DropdownMenuTrigger className="hover:text-gray-900 focus:outline-none outline-none ring-0 border-0 bg-transparent p-0 flex items-center shadow-none h-auto w-auto">
                 <BellIcon className="w-4 h-4" />
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-48">
                 <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Remind me in...</div>
                 <DropdownMenuItem>1 hour</DropdownMenuItem>
                 <DropdownMenuItem>4 hours</DropdownMenuItem>
                 <DropdownMenuItem>1 day</DropdownMenuItem>
                 <DropdownMenuItem>3 days</DropdownMenuItem>
                 <DropdownMenuItem>1 week</DropdownMenuItem>
                 <DropdownMenuItem>Next month</DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>

             {/* Close Button inline with gap */}
             <DialogClose className="hover:text-gray-900 focus:outline-none rounded-sm opacity-70 transition-opacity hover:opacity-100 outline-none ring-0 border-0 bg-transparent p-0 flex items-center shadow-none h-auto w-auto">
               <X className="w-5 h-5" />
               <span className="sr-only">Close</span>
             </DialogClose>

          </div>
        </div>

        {/* Body Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
          {/* Left Column Component */}
          <div className="flex-1 p-6 space-y-6 md:border-r border-gray-100">
            
            <div className="space-y-2">
              <Label className="text-gray-600 text-[13px] font-medium">Task title <span className="text-red-500">*</span></Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Design new website homepage" 
                className="font-medium text-base h-11" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 text-[13px] font-medium">Description</Label>
              <div className="border rounded-md overflow-hidden bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                 {/* Fake toolbar */}
                 <div className="flex items-center gap-1 border-b bg-gray-50/50 p-2 text-gray-500">
                   <Button variant="ghost" size="icon" className="h-7 w-7"><Bold className="w-3.5 h-3.5" /></Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7"><Italic className="w-3.5 h-3.5" /></Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7"><Underline className="w-3.5 h-3.5" /></Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7"><Strikethrough className="w-3.5 h-3.5" /></Button>
                   <div className="w-px h-4 bg-gray-300 mx-1" />
                   <Button variant="ghost" size="icon" className="h-7 w-7"><List className="w-4 h-4" /></Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7"><Link2 className="w-4 h-4" /></Button>
                 </div>
                 <Textarea 
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   className="min-h-[120px] resize-none border-0 focus-visible:ring-0 rounded-none shadow-none" 
                   placeholder="Describe this task..."
                 />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <Label className="text-gray-900 font-bold text-base">Comments</Label>
              <div className="space-y-6">
                
                {/* Dynamically Render Comments */}
                {comments.length === 0 && <p className="text-sm text-gray-500 italic">No comments yet.</p>}
                
                {comments.map((comment: any) => (
                  <div key={comment.id || comment.timestamp} className="flex items-start gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-xs shrink-0 pt-0.5">
                      {comment.user === 'ME' ? 'ME' : 'MJ'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                         <span className="font-semibold text-sm text-gray-900">{comment.user === 'ME' ? 'You' : 'Collaborator'}</span>
                         <span className="text-xs text-gray-400">
                           {new Date(comment.timestamp || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                         </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                      
                      {/* Interaction Actions */}
                      <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-gray-500">
                        <button className="hover:text-blue-600">Reply</button>
                        <button className="hover:text-blue-600">Like</button>
                        {comment.user === 'ME' && (
                          <button onClick={() => setIsEditingComment(true)} className="hover:text-blue-600">Edit</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              </div>

              {/* Add Comment Input */}
              <div className="flex gap-3 pt-4 border-t mt-4 relative">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-xs shrink-0 mt-1">ME</div>
                <div className="relative flex-1 flex flex-col items-end">
                  <Input 
                    placeholder="Write a comment..." 
                    className="pr-10 bg-gray-50/50" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newComment.trim()) {
                         e.preventDefault();
                         handlePublishComment();
                      }
                    }}
                  />
                  {!newComment.trim() && <SmilePlus className="w-4 h-4 absolute right-3 top-3 text-gray-400 cursor-pointer hover:text-gray-600" />}
                  {newComment.trim() && (
                    <Button 
                      size="sm" 
                      className="mt-2 h-7 rounded bg-[#4640A0] hover:bg-[#342e81] text-xs font-semibold px-3"
                      onClick={handlePublishComment}
                    >
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column Component */}
          <div className="w-full md:w-80 bg-gray-50/30 p-6 space-y-6 flex flex-col">
            
            {!isEditing && !defaultClientId && (
              <div className="space-y-2">
                <Label className="text-gray-600 text-[13px] font-medium">Client <span className="text-red-500">*</span></Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="bg-white px-3 w-full border-gray-200">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600 text-[13px] font-medium">Status</Label>
                <Select 
                  value={status} 
                  onValueChange={(val) => { 
                    setStatus(val); 
                    updateField("status", val); 
                  }}
                >
                  <SelectTrigger className="bg-white w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Working on it">
                      <span className="flex items-center gap-2 truncate">
                        <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shrink-0" /> Working on it
                      </span>
                    </SelectItem>
                    <SelectItem value="Review">
                      <span className="flex items-center gap-2 truncate">
                        <div className="w-2.5 h-2.5 rounded-sm bg-purple-500 shrink-0" /> Review
                      </span>
                    </SelectItem>
                    <SelectItem value="Stuck">
                      <span className="flex items-center gap-2 truncate">
                        <div className="w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0" /> Stuck
                      </span>
                    </SelectItem>
                    <SelectItem value="Completed">
                      <span className="flex items-center gap-2 truncate">
                        <div className="w-2.5 h-2.5 rounded-sm bg-green-500 shrink-0" /> Completed
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 text-[13px] font-medium">Priority</Label>
                <Select 
                  value={priority}
                  onValueChange={(val) => { 
                    setPriority(val); 
                    updateField("priority", val); 
                  }}
                >
                  <SelectTrigger className="bg-white w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low"><span className="text-gray-600 font-medium">Low</span></SelectItem>
                    <SelectItem value="Medium"><span className="text-yellow-600 font-medium">Medium</span></SelectItem>
                    <SelectItem value="High"><span className="text-red-600 font-medium">High</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600 text-[13px] font-medium">Estimate (Hours)</Label>
                <Input 
                  type="number" 
                  min="0"
                  value={estimateHours} 
                  onChange={(e) => { 
                    const val = Number(e.target.value);
                    setEstimateHours(val); 
                    updateField("estimate_hours", val); 
                  }}
                  className="bg-white h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 text-[13px] font-medium">Assigned to</Label>
                <Select 
                  value={assignee}
                  onValueChange={(val) => { 
                    setAssignee(val); 
                    updateField("assignee", val); 
                  }}
                >
                  <SelectTrigger className="bg-white px-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mark">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">MJ</div>
                        <span className="truncate">Mark J.</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <hr className="border-gray-200 mt-6" />
            
            {isEditing ? (
              <div className="space-y-4 mt-6">
                <Button 
                  onClick={handleUpdateTask} 
                  disabled={isUpdating || !title.trim()}
                  className="w-full bg-[#4640A0] hover:bg-[#342e81] text-white shadow-sm font-semibold"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
                <p className="text-center text-[12px] text-gray-400 font-medium">Created: {createdDate}</p>
              </div>
            ) : (
              <Button 
                onClick={handleCreateTask} 
                disabled={isCreating || !title.trim() || !clientId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm mt-4 font-semibold"
              >
                {isCreating ? "Creating..." : "Create Task"}
              </Button>
            )}

          </div>
        </div>

      </div>
    </DialogContent>
  );
}

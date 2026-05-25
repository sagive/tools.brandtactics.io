"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BellIcon, Link2, List, Bold, Italic, Underline, Strikethrough, SmilePlus, X, Send, Trash2, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity-logger";
import { linkifyHtml } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const TASK_QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
  ],
};

function stripHtml(html: string) {
  if (typeof document === 'undefined') return html;
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  const text = tmp.textContent || tmp.innerText || "";
  return text.trim();
}

const STORAGE_KEY = 'last_task_choices';

export function EditTaskDialog({ task, defaultClientId, defaultDescription, onTaskCreated }: { task?: any, defaultClientId?: string, defaultDescription?: string, onTaskCreated?: () => void }) {
  const isEditing = !!task;
  const [isOpen, setIsOpen] = useState(true); // Internal state for Dialog if needed, but we typically use DialogClose or parent state.
  // Actually, the dialog is controlled by the parent <Dialog> in sortable-task-item and client-tasks.
  // However, DialogClose can be triggered via a ref or by just clicking it.
  // But wait, the standard way in Shadcn is to provide an onOpenChange.
  // Let's check how it's called.
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const { profile } = useAuth();
  
  const pathname = usePathname();
  const pathnameClientId = pathname?.match(/\/clients\/([a-f0-9-]{36})/i)?.[1] || null;

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || (defaultDescription ? `<p>${defaultDescription}</p>` : ""));
  const [status, setStatus] = useState(task?.status || "Pending");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [requester, setRequester] = useState(task?.requester || "");
  const [comments, setComments] = useState<any[]>(task?.comments || []);
  const [clientId, setClientId] = useState(task?.client_id || defaultClientId || pathnameClientId || "");
  const [isEditingDesc, setIsEditingDesc] = useState(!isEditing);
  
  // Sync clientId with defaultClientId or pathnameClientId when they change (for new tasks)
  useEffect(() => {
    if (!isEditing) {
      const target = defaultClientId || pathnameClientId;
      if (target) {
        setClientId(target);
      }
    }
  }, [defaultClientId, pathnameClientId, isEditing]);

  const [dueDate, setDueDate] = useState<string>(task?.end_date ? new Date(task.end_date).toISOString().split('T')[0] : "");
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load from localStorage on mount for new tasks
  useEffect(() => {
    if (!isEditing) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.status) setStatus(parsed.status);
          if (parsed.priority) setPriority(parsed.priority);
          if (parsed.assignee) setAssignee(parsed.assignee);
          if (parsed.requester) setRequester(parsed.requester);
          if (parsed.dueDate) setDueDate(parsed.dueDate);
          
          const target = defaultClientId || pathnameClientId;
          if (target) {
            setClientId(target);
          } else if (parsed.clientId) {
            setClientId(parsed.clientId);
          }
        } catch (e) {
          console.error("Failed to parse saved task choices", e);
        }
      } else {
        const target = defaultClientId || pathnameClientId;
        if (target) {
          setClientId(target);
        }
      }
    }
  }, [isEditing, defaultClientId, pathnameClientId]);

  // Save to localStorage whenever these change (only for new tasks)
  useEffect(() => {
    if (!isEditing) {
      const choices = { title, status, priority, assignee, requester, clientId, dueDate };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choices));
    }
  }, [isEditing, title, status, priority, assignee, requester, clientId, dueDate]);

  const handleResetFields = () => {
    setTitle("");
    setDescription("");
    setStatus("Pending");
    setPriority("Medium");
    setAssignee("");
    setRequester("");
    setClientId(defaultClientId || "");
    setDueDate("");
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Fields reset");
  };

  // Field display names for toasts
  const FIELD_LABELS: Record<string, string> = {
    title: "Title",
    description: "Description",
    status: "Status",
    priority: "Priority",
    assignee: "Assignee",
    requester: "Requester",
    end_date: "Due Date",
    comments: "Comments",
    client_id: "Client"
  };

  useEffect(() => {
    async function fetchData() {
      const targetId = task?.client_id || defaultClientId || clientId;
      
      try {
        // Fetch everything in parallel
        const [clientsRes, usersRes] = await Promise.all([
          supabase.from('clients').select('id, name').order('name'),
          supabase.from('users').select('id, full_name, email').order('full_name')
        ]);

        let finalClients = clientsRes.data || [];
        
        // If our current client isn't in the full list, fetch it specifically
        if (targetId && !finalClients.some(c => c.id === targetId)) {
          const { data: specific } = await supabase.from('clients').select('id, name').eq('id', targetId).single();
          if (specific) {
            finalClients = [specific, ...finalClients];
          }
        }

        setClients(finalClients);
        if (usersRes.data) setUsers(usersRes.data);
      } catch (error) {
        console.error("Failed to fetch task dialog data:", error);
      }
    }

    fetchData();
  }, [isEditing, defaultClientId, task?.client_id]);

  const createdDate = task?.created_at 
    ? new Date(task.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : "Unknown date";

  // Debounced auto-save for description field
  useEffect(() => {
    if (!isEditing) return;
    const timeoutId = setTimeout(() => {
      const plainText = stripHtml(description);
      const generatedTitle = plainText.substring(0, 100) || "Untitled Task";
      
      if (description !== task.description) {
        supabase.from('tasks').update({ 
          title: generatedTitle,
          description 
        }).eq('id', task.id)
          .then(({error}) => { 
             if (error) toast.error("Failed to auto-save task"); 
          });
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [description, isEditing, task?.id, task?.description]);

  const updateField = async (field: string, value: any) => {
    if (!isEditing) return;
    try {
      const { error } = await supabase.from('tasks').update({ [field]: value }).eq('id', task.id);
      if (error) throw error;
      toast.success(`${FIELD_LABELS[field] || field} saved`);

      if (field === 'status') {
        const clientName = clients.find(c => c.id === task.client_id)?.name || "Client";
        logActivity({
          userName: profile?.full_name || profile?.email || "Someone",
          clientId: task.client_id,
          actionType: 'task_status_changed',
          content: `changed status of task <b>"${task.title}"</b> to <b>${value}</b> for <b>${clientName}</b>`
        });
      }
    } catch (err: any) {
      toast.error(`Failed to save ${FIELD_LABELS[field] || field}: ${err.message}`);
    }
  };

  const handleUpdateTask = async () => {
    if (!isEditing) return;
    const plainText = stripHtml(description);
    if (!plainText) { toast.error("Description is required"); return; }
    
    const generatedTitle = plainText.substring(0, 100);
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('tasks').update({
        title: generatedTitle,
        description,
        status,
        priority,
        assignee,
        requester,
        end_date: dueDate || null,
        comments
      }).eq('id', task.id);
      
      if (error) throw error;
      toast.success("Task updated successfully");
      setIsEditingDesc(false);
      onTaskCreated?.(); // Refresh parent list
      
      // If assignment changed, send email
      if (assignee && assignee !== task.assignee) {
        const targetUser = users.find(u => u.full_name === assignee || u.email === assignee);
        if (targetUser && targetUser.email) {
          const assignerName = profile?.full_name || profile?.email || "Someone";
          const taskUrl = `${window.location.origin}/clients/${clientId}/tasks?task=${task.id}`;
          
          fetch('/api/notify-assignment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetUser.email, assignerName, taskTitle: generatedTitle, taskUrl })
          }).catch(err => console.error("Failed to trigger assignment email", err));
        }
      }
      
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

  const handleDeleteTask = async () => {
    if (!isEditing || !task.id) return;
    if (!confirm("Are you sure you want to permanently delete this task?")) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;
      
      toast.success("Task deleted successfully");
      onTaskCreated?.(); // Refresh parent list
      
      // Close dialog
      const closeButton = document.querySelector('[data-slot="dialog-close"]') as HTMLButtonElement;
      if (closeButton) closeButton.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublishComment = async () => {
    if (!newComment.trim() || newComment === '<p><br></p>' || !isEditing) return;
    
    const currentUserEmail = profile?.email || 'ME';
    const currentUserName = profile?.full_name || currentUserEmail;
    
    const comment = { 
      id: Date.now().toString(), 
      user: currentUserName, 
      text: newComment.trim(), 
      timestamp: new Date().toISOString() 
    };
    
    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    setNewComment("");
    await updateField("comments", updatedComments);
    
    // NOTIFICATION LOGIC
    // Figure out who should receive this notification (Assignee and/or Requester)
    const targets = new Set<string>();
    
    // We only have names/emails in assignee/requester, not the strict UUID.
    // If assignee or requester is an email, it's easy. If it's a full_name, we have to look it up or hope the trigger logic matches.
    // Let's find the email of the assignee and requester 
    const isAssigneeMe = (assignee === currentUserEmail || assignee === currentUserName);
    const isRequesterMe = (requester === currentUserEmail || requester === currentUserName);
    
    const fetchTargetEmail = (identifier: string) => {
       const user = users.find(u => u.email === identifier || u.full_name === identifier);
       return user ? user.email : null;
    };
    
    if (assignee && !isAssigneeMe) {
       const email = fetchTargetEmail(assignee);
       if (email) targets.add(email);
    }
    
    if (requester && !isRequesterMe) {
       const email = fetchTargetEmail(requester);
       if (email) targets.add(email);
    }
    
    // Send notifications
    for (const targetEmail of targets) {
       supabase.from('notifications').insert([{
         user_email: targetEmail,
         title: "New Task Comment",
         message: `${currentUserName} commented on "${title}"`,
         action_url: `/clients/${clientId}/tasks?task=${task.id}`,
         type: 'comment'
       }]).then(({error}) => {
         if (error) console.error("Failed to insert notification:", error);
       });
    }
  };

  const handleSaveEditComment = async (id: string, newText: string) => {
    if (!newText.trim() || newText === '<p><br></p>') return;
    const updatedComments = comments.map(c => c.id === id ? { ...c, text: newText } : c);
    setComments(updatedComments);
    setEditingCommentId(null);
    setEditingCommentText("");
    await updateField("comments", updatedComments);
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    const updatedComments = comments.filter(c => c.id !== id);
    setComments(updatedComments);
    await updateField("comments", updatedComments);
  };

  const handleSetReminder = async (hours: number, label: string) => {
    if (!task?.id || !profile?.email) {
      toast.error("Please save the task first before setting a reminder.");
      return;
    }
    
    const triggerTime = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase.from('scheduled_reminders').insert([{
      task_id: task.id,
      user_email: profile.email,
      task_title: title,
      action_url: `/clients/${clientId}/tasks?task=${task.id}`,
      trigger_time: triggerTime
    }]);
    
    if (error) {
      console.error(error);
      toast.error("Failed to set reminder");
    } else {
      toast.success(`Reminder set for ${label}`);
    }
  };

  const handleCreateTask = async () => {
    const plainText = stripHtml(description);
    if (!plainText) { toast.error("Description is required"); return; }
    if (!clientId) { toast.error("Client is required"); return; }
    
    const generatedTitle = plainText.substring(0, 100);

    setIsCreating(true);
    try {
      const { data, error } = await supabase.from('tasks').insert([{
        title: generatedTitle,
        description,
        status,
        priority,
        assignee,
        requester,
        end_date: dueDate || null,
        client_id: clientId,
        comments
      }]).select().single();
      
      if (error) throw error;
      toast.success("Task created successfully");
      onTaskCreated?.();

      const clientName = clients.find(c => c.id === clientId)?.name || "Client";
      logActivity({
        userName: profile?.full_name || profile?.email || "Someone",
        clientId: clientId,
        actionType: 'task_created',
        content: `created task <b>"${generatedTitle}"</b> for <b>${clientName}</b>`
      });
      
      // Check if there is an assignee to notify
      if (assignee) {
        const targetUser = users.find(u => u.full_name === assignee || u.email === assignee);
        if (targetUser && targetUser.email) {
          const assignerName = profile?.full_name || profile?.email || "Someone";
          const taskUrl = `${window.location.origin}/clients/${clientId}/tasks?task=${data.id}`;
          
          fetch('/api/notify-assignment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetUser.email, assignerName, taskTitle: generatedTitle, taskUrl })
          }).catch(err => console.error("Failed to trigger assignment email", err));
        }
      }
      
      // Keep dialog open but reset content (except title as requested)
      // setTitle(""); 
      setDescription("");
      
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DialogContent showCloseButton={false} className="max-w-[100%] sm:max-w-[95vw] md:max-w-[850px] lg:max-w-5xl xl:max-w-6xl w-full p-0 overflow-hidden bg-white">
      <div className="flex flex-col h-[95vh] max-h-[95vh] min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <DialogTitle className="text-xl font-bold">{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
          <div className="flex items-center gap-6 text-sm text-gray-500">
             
             {!isEditing && (
               <button 
                 onClick={handleResetFields} 
                 className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
               >
                 Reset fields
               </button>
             )}

             {/* Date Picker Auto-save wrapper */}
             <div className="flex items-center gap-2 text-gray-500">
               <span className="font-medium whitespace-nowrap">Due:</span>
               <DateTimePicker
                 isDateOnly
                 value={dueDate}
                 onChange={(val: string) => { 
                   setDueDate(val); 
                   updateField('end_date', val); 
                 }}
                 className="h-8 py-1 px-3 bg-transparent border-transparent hover:border-gray-300 hover:bg-gray-50 shadow-none font-medium text-gray-900 w-auto min-w-[120px]"
               />
             </div>
             
             {/* Reminder Dropdown */}
             <DropdownMenu>
               <DropdownMenuTrigger className="hover:text-gray-900 focus:outline-none outline-none ring-0 border-0 bg-transparent p-0 flex items-center shadow-none h-auto w-auto">
                 <BellIcon className="w-4 h-4" />
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-48">
                 <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Remind me in...</div>
                 <DropdownMenuItem onClick={() => handleSetReminder(1, "1 hour")}>1 hour</DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleSetReminder(4, "4 hours")}>4 hours</DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleSetReminder(24, "1 day")}>1 day</DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleSetReminder(72, "3 days")}>3 days</DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleSetReminder(168, "1 week")}>1 week</DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleSetReminder(720, "Next month")}>Next month</DropdownMenuItem>
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
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto min-w-0">
          {/* Left Column Component */}
          <div className="flex-1 md:max-w-[65%] p-6 space-y-6 md:border-r border-gray-100 min-w-0">
            
            {/* Title field hidden per user request - summary generated from description */}
            <div className="hidden">
              <Label className="text-gray-600 text-[13px] font-medium">Task title <span className="text-red-500">*</span></Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (auto-generated)" 
                className="font-medium text-base h-11" 
              />
            </div>

            <div className="space-y-2 max-w-full">
              <div className="flex items-center justify-between">
                <Label className="text-gray-900 font-bold text-lg">Description <span className="text-red-500">*</span></Label>
                {isEditing && !isEditingDesc && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsEditingDesc(true)}
                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {isEditingDesc ? (
                <div id="task-description-container" className="border rounded-md bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-gray-50/50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:overflow-x-auto flex-1 min-w-0">
                   <ReactQuill 
                     theme="snow"
                     value={description}
                     onChange={setDescription}
                     modules={TASK_QUILL_MODULES}
                     placeholder="Describe this task (you can paste screenshots)..."
                   />
                </div>
              ) : (
                <div 
                  className="p-4 border rounded-md bg-gray-50/30 prose prose-sm max-w-none min-h-[120px] overflow-x-auto
                    [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-4 [&_a]:font-medium hover:[&_a]:text-blue-800
                    [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4
                    [&_img]:max-w-full [&_img]:rounded-lg [&_img]:shadow-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: linkifyHtml(description || "<p class='text-gray-400 italic'>No description provided.</p>")
                  }}
                />
              )}
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
                         <span className="font-semibold text-sm text-gray-900">{comment.user === 'ME' ? 'You' : (profile && profile.full_name === comment.user ? 'You' : comment.user)}</span>
                         <span className="text-xs text-gray-400">
                           {new Date(comment.timestamp || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                         </span>
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="mt-2 mb-1 w-full border rounded-md bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-gray-50/50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[80px]">
                           <ReactQuill 
                             theme="snow"
                             value={editingCommentText}
                             onChange={setEditingCommentText}
                             modules={TASK_QUILL_MODULES}
                           />
                           <div className="flex gap-2 p-2 bg-gray-50 justify-end border-t border-gray-100">
                              <Button variant="ghost" size="sm" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                              <Button size="sm" className="bg-[#4640A0] hover:bg-[#342e81]" onClick={() => handleSaveEditComment(comment.id, editingCommentText)}>Save</Button>
                           </div>
                        </div>
                      ) : (
                        <div className="text-[13px] text-gray-700 [&>p]:mb-2 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 [&_img]:max-w-[150px] [&_img]:rounded-md [&_a]:text-blue-600 [&_a]:underline" dangerouslySetInnerHTML={{ __html: linkifyHtml(comment.text) }} />
                      )}
                      
                      {/* Interaction Actions */}
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-gray-500">
                        <button className="hover:text-blue-600 transition-colors">Reply</button>
                        <button className="hover:text-blue-600 transition-colors">Like</button>
                        {(comment.user === 'ME' || (profile && profile.full_name === comment.user)) && (
                          <>
                            {editingCommentId !== comment.id && (
                              <button onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.text); }} className="hover:text-blue-600 transition-colors">Edit</button>
                            )}
                            <button onClick={() => handleDeleteComment(comment.id)} className="hover:text-red-600 transition-colors">Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              </div>

              {/* Add Comment Input */}
              <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6 relative pb-10">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-1">ME</div>
                <div className="relative flex-1 flex flex-col items-end">
                  <div className="w-full border border-gray-200 rounded-md bg-white focus-within:ring-1 focus-within:ring-[#4640A0] focus-within:border-[#4640A0] [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-gray-50/50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[80px]">
                     <ReactQuill 
                       theme="snow"
                       value={newComment}
                       onChange={setNewComment}
                       modules={TASK_QUILL_MODULES}
                       placeholder="Write a comment..."
                     />
                  </div>
                  {(newComment && newComment !== '<p><br></p>') && (
                    <Button 
                      size="sm" 
                      className="mt-3 bg-[#4640A0] hover:bg-[#342e81] text-white shadow-sm font-semibold px-5"
                      onClick={handlePublishComment}
                    >
                      Publish Comment
                    </Button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column Component */}
          <div className="w-full md:w-80 shrink-0 bg-gray-50/30 p-6 space-y-6 flex flex-col">
            
            {!isEditing && (
              <div className="space-y-2">
                <Label className="text-gray-600 text-[13px] font-medium">Client <span className="text-red-500">*</span></Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="bg-white px-3 w-full border-gray-200">
                    <SelectValue placeholder="Select a client">
                      {clients.find(c => c.id === clientId)?.name || (clientId ? "Loading..." : "Select a client")}
                    </SelectValue>
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
                    <SelectItem value="Medium"><span className="text-yellow-600 font-medium">Normal</span></SelectItem>
                    <SelectItem value="High"><span className="text-red-600 font-medium">High</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600 text-[13px] font-medium">Requester</Label>
                <Select 
                   value={requester} 
                   onValueChange={(val) => { 
                     setRequester(val); 
                     updateField("requester", val); 
                   }}
                >
                  <SelectTrigger className="bg-white w-full h-9">
                    <SelectValue placeholder="Pick User" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.full_name || u.email}>
                        <span className="truncate">{u.full_name || u.email}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectValue placeholder="Pick User" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.full_name || u.email}>
                        <span className="truncate">{u.full_name || u.email}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <hr className="border-gray-200 mt-6" />
            
            {isEditing ? (
              <div className="flex flex-col flex-1 mt-2">
                <Button 
                  onClick={handleUpdateTask} 
                  disabled={isUpdating || !title.trim() || isDeleting}
                  className="w-full bg-[#4640A0] hover:bg-[#342e81] text-white shadow-sm font-semibold mb-2"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
                
                <div className="px-1 text-center">
                  <p className="text-[10px] text-gray-400 font-medium">Created: {createdDate}</p>
                </div>
                
                <div className="mt-[50px] flex items-center justify-center pb-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 px-2 uppercase tracking-widest font-normal"
                    onClick={handleDeleteTask}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    {isDeleting ? "Deleting..." : "Delete Task"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleCreateTask} 
                disabled={isCreating || !stripHtml(description) || !clientId}
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

"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, ListChecks, FileText, ChevronDownIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface BulkTaskDialogProps {
  clientId: string;
  selectedBacklinks: any[];
  users: any[];
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
}

export function BulkTaskDialog({ clientId, selectedBacklinks, users, onSuccess, open: externalOpen, onOpenChange: externalOnOpenChange, trigger }: BulkTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (newOpen: boolean) => {
    if (externalOnOpenChange) externalOnOpenChange(newOpen);
    setInternalOpen(newOpen);
  };

  const { profile } = useAuth();
  const [baseTitle, setBaseTitle] = useState("Create a company profile");
  const [generalDescription, setGeneralDescription] = useState("Please create a profile for this client on the following website - with logos and links etc");
  const [status, setStatus] = useState("Pending");
  const [priority, setPriority] = useState("Medium");
  const [requester, setRequester] = useState("");
  const [assignee, setAssignee] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskTemplates, setTaskTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (profile && !requester) {
      setRequester(profile.full_name || profile.email || "");
    }
  }, [profile, requester]);

  useEffect(() => {
    try {
      supabase.from('task_templates').select('*').order('created_at', { ascending: true })
        .then(({ data }) => { if (data) setTaskTemplates(data); });
    } catch {}
  }, []);

  const handleBulkCreate = async () => {
    if (!baseTitle) return toast.error("Please enter a base title");
    if (selectedBacklinks.length === 0) return toast.error("No backlinks selected");
    
    setIsSubmitting(true);

    try {
      const tasks = selectedBacklinks.map(b => ({
        client_id: clientId,
        title: `${baseTitle.trim()} ${b.website_name}`,
        description: `${generalDescription.trim()}\n\nURL: ${b.url}`,
        status,
        priority,
        requester,
        assignee
      }));

      // 1. Create tasks
      const { error: taskError } = await supabase.from('tasks').insert(tasks);
      if (taskError) throw taskError;

      // 2. Mark backlinks as Tasked
      const mappings = selectedBacklinks.map(backlink => ({
        client_id: clientId,
        backlink_id: backlink.id,
        is_tasked: true
      }));

      const { error: mappingError } = await supabase
        .from('client_backlinks')
        .upsert(mappings, { onConflict: 'client_id,backlink_id' });
      
      if (mappingError) throw mappingError;

      toast.success(`Successfully created ${tasks.length} tasks!`);
      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create bulk tasks");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        render={trigger || (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold uppercase tracking-tight h-10 shadow-md">
            <ListChecks className="w-4 h-4" /> Bulk Create Tasks ({selectedBacklinks.length})
          </Button>
        )}
      />
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-[#4640A0]" />
            Bulk Create Tasks
          </DialogTitle>
          <p className="text-sm text-gray-500">
            You are about to create <strong>{selectedBacklinks.length}</strong> separate tasks.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Base Title</Label>
              <Input 
                placeholder="e.g. Create profile in" 
                value={baseTitle} 
                onChange={(e) => setBaseTitle(e.target.value)} 
                className="bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-500 uppercase">General Description</Label>
              {taskTemplates.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-1 h-7 px-3 text-[10px] font-medium rounded-md border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300">
                      <FileText className="w-3 h-3" />
                      Templates
                      <ChevronDownIcon className="w-2.5 h-2.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inject Template</div>
                    {taskTemplates.map(t => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setGeneralDescription(t.content || "");
                          toast.success(`Template "${t.name}" injected`);
                        }}
                        className="relative flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0 text-green-500" />
                        {t.name}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <Textarea 
              placeholder="Instructions for the team..." 
              value={generalDescription} 
              onChange={(e) => setGeneralDescription(e.target.value)} 
              className="min-h-[100px] bg-gray-50/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Status</Label>
              <Select value={status} onValueChange={(val) => setStatus(val || "Pending")}>
                <SelectTrigger className="bg-gray-50/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Working on it">Working on it</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Update Ready">Update Ready</SelectItem>
                  <SelectItem value="Stuck">Stuck</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Priority</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val || "Medium")}>
                <SelectTrigger className="bg-gray-50/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Requester</Label>
              <Select value={requester} onValueChange={(val) => setRequester(val || "")}>
                <SelectTrigger className="bg-gray-50/30">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.full_name || u.email} data-name={u.full_name || u.email}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Assignee</Label>
              <Select value={assignee} onValueChange={(val) => setAssignee(val || "")}>
                <SelectTrigger className="bg-gray-50/30">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.full_name || u.email} data-name={u.full_name || u.email}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button 
            className="w-full bg-[#4640A0] hover:bg-[#342e81] h-12 text-sm font-bold shadow-lg shadow-blue-900/10" 
            onClick={handleBulkCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ListChecks className="w-5 h-5 mr-2" />}
            Create {selectedBacklinks.length} Tasks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { Loader2, ListChecks } from "lucide-react";

interface BulkTaskDialogProps {
  clientId: string;
  selectedBacklinks: any[]; // Array of full backlink objects
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function BulkTaskDialog({ clientId, selectedBacklinks, onSuccess, trigger }: BulkTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("Create profile in");
  const [description, setDescription] = useState("Please create a profile for this client on the following website.");
  const [status, setStatus] = useState("Pending");
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("");
  const [requester, setRequester] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
        if (error) throw error;
        if (data) setUsers(data);
      } catch (err: any) {
        console.error("Profiles fetch error:", err);
      }
    }
    if (isOpen) {
      fetchUsers();
      // Try to load last choices from localStorage if they exist (reusing some patterns from EditTaskDialog)
      const saved = localStorage.getItem('bulk_task_choices');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.status) setStatus(parsed.status);
          if (parsed.priority) setPriority(parsed.priority);
          if (parsed.assignee) setAssignee(parsed.assignee);
          if (parsed.requester) setRequester(parsed.requester);
        } catch (e) {}
      }
    }
  }, [isOpen]);

  const handleBulkCreate = async () => {
    if (!title) return toast.error("Please enter a base title");
    if (selectedBacklinks.length === 0) return toast.error("No backlinks selected");
    
    setIsSubmitting(true);

    try {
      // Save choices for next time
      localStorage.setItem('bulk_task_choices', JSON.stringify({ status, priority, assignee, requester }));

      const tasks = selectedBacklinks.map(backlink => ({
        client_id: clientId,
        title: `${title} ${backlink.website_name}`,
        description: `${description}\n\nWebsite: ${backlink.url}`,
        status,
        priority,
        assignee_id: assignee || null,
        requester_id: requester || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // 1. Create tasks
      const { error: taskError } = await supabase.from('tasks').insert(tasks);
      if (taskError) throw taskError;

      // 2. Mark backlinks as Tasked
      const mappings = selectedBacklinks.map(backlink => ({
        client_id: clientId,
        backlink_id: backlink.id,
        is_tasked: true,
        updated_at: new Date().toISOString()
      }));

      const { error: mappingError } = await supabase
        .from('client_backlinks')
        .upsert(mappings, { onConflict: 'client_id,backlink_id' });
      
      if (mappingError) throw mappingError;

      toast.success(`Successfully created ${tasks.length} tasks!`);
      setIsOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create bulk tasks");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        render={(trigger as any) || (
          <Button variant="outline" className="gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800">
            <ListChecks className="w-4 h-4" />
            Bulk Create Tasks ({selectedBacklinks.length})
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
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="bg-white"
              />
              <p className="text-[10px] text-gray-400 italic">Example output: "{title} Indeed.com"</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-500 uppercase">General Description</Label>
            <Textarea 
              placeholder="Instructions for the team..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="min-h-[100px] bg-gray-50/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Status</Label>
              <Select value={status} onValueChange={(v: string | null) => v && setStatus(v)}>
                <SelectTrigger className="bg-gray-50/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Working on it">Working on it</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Priority</Label>
              <Select value={priority} onValueChange={(v: string | null) => v && setPriority(v)}>
                <SelectTrigger className="bg-gray-50/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Requester</Label>
              <Select value={requester} onValueChange={setRequester as any}>
                <SelectTrigger className="bg-gray-50/30">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {users.length === 0 && (
                    <SelectItem value="none" disabled>No users found</SelectItem>
                  )}
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Assignee</Label>
              <Select value={assignee} onValueChange={setAssignee as any}>
                <SelectTrigger className="bg-gray-50/30">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {users.length === 0 && (
                    <SelectItem value="none" disabled>No users found</SelectItem>
                  )}
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
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

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, FileText, AlertCircle, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface SendSeoUpdateDialogProps {
  defaultClientId?: string;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SendSeoUpdateDialog({ defaultClientId, trigger, onSuccess, open: externalOpen, onOpenChange: externalOnOpenChange }: SendSeoUpdateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  
  const setIsOpen = (newOpen: boolean) => {
    if (externalOnOpenChange) externalOnOpenChange(newOpen);
    setInternalOpen(newOpen);
  };

  const [clientId, setClientId] = useState(defaultClientId || "");
  const [openClientDropdown, setOpenClientDropdown] = useState(false);
  const [subject, setSubject] = useState("SEO Update from BrandTactics");
  const [body, setBody] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [sending, setSending] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [openTemplateDropdown, setOpenTemplateDropdown] = useState(false);
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchTemplates();
      if (defaultClientId) setClientId(defaultClientId);
    }
  }, [isOpen, defaultClientId]);

  async function fetchClients() {
    const { data } = await supabase.from("clients").select("id, name, contact_email, status").order("name");
    if (data) setClients(data);
  }

  async function fetchTemplates() {
    try {
      const { data } = await supabase.from("email_templates").select("*").order("name");
      if (data) setTemplates(data);
    } catch (e) {
      console.log("Templates table might not exist yet");
    }
  }

  const handleSendUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }
    setSending(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ clientId, subject, body, scheduledFor }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      
      if (data.simulated) {
        toast.success(`[Simulated] Update saved. Add RESEND_API_KEY to actually send.`);
      } else {
        toast.success(`Update sent successfully!`);
      }
      setBody("");
      setIsOpen(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSending(false);
    }
  };

  const selectedClient = clients.find(c => c.id === clientId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        trigger || (
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold uppercase tracking-tight h-10 shadow-md">
            <Send className="w-4 h-4" /> Send SEO Update
          </Button>
        )
      }/>
      <DialogContent className="max-w-5xl sm:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Send SEO Update
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSendUpdate} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</Label>
              <Popover open={openClientDropdown} onOpenChange={setOpenClientDropdown}>
                <PopoverTrigger render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openClientDropdown}
                    className={cn(
                      "w-full justify-between bg-white font-normal h-10 px-3",
                      !clientId && "text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                        {clientId ? clients.find(c => c.id === clientId)?.name?.substring(0,1).toUpperCase() : "?"}
                      </div>
                      {clientId
                        ? clients.find((c) => c.id === clientId)?.name
                        : "Select a client..."}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                }/>
                <PopoverContent className="w-[var(--base-ui-popover-trigger-width)] p-0" align="start">
                  <Command className="w-full">
                    <CommandInput placeholder="Search clients..." className="h-10" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>No client found.</CommandEmpty>
                      <CommandGroup>
                        {clients.filter(c => c.status === 'Active').map((client) => {
                          const hasEmail = !!client.contact_email;
                          return (
                            <CommandItem
                              key={client.id}
                              value={client.name}
                              onSelect={() => {
                                setClientId(client.id);
                                setOpenClientDropdown(false);
                              }}
                              className="flex flex-col items-start px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50"
                            >
                              <div className="flex items-center w-full">
                                <div className="flex-1 font-bold text-gray-900">{client.name}</div>
                                {clientId === client.id && (
                                  <Check className="ml-auto h-4 w-4 text-blue-600 shrink-0" />
                                )}
                              </div>
                              <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mt-0.5">
                                {hasEmail ? client.contact_email : "⚠️ Missing Email"}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {clientId && !selectedClient?.contact_email && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs text-red-600 font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Missing contact email. Cannot send update.
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2 flex flex-col justify-start">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Templates</Label>
              <Popover open={openTemplateDropdown} onOpenChange={setOpenTemplateDropdown}>
                <PopoverTrigger render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openTemplateDropdown}
                    className={cn(
                      "w-full justify-between bg-white font-normal h-10 px-3",
                      !templateId && "text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      {templateId
                        ? templates.find((t) => t.id === templateId)?.name
                        : "Select a template..."}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                }/>
                <PopoverContent className="w-[var(--base-ui-popover-trigger-width)] min-w-[300px] p-0" align="start">
                  <Command className="w-full">
                    <CommandInput placeholder="Search templates..." className="h-10" />
                    <CommandList className="max-h-[300px]">
                      {templates.length === 0 ? (
                        <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                          No templates found.<br/>Add them in Settings.
                        </CommandEmpty>
                      ) : (
                        <CommandEmpty>No template found.</CommandEmpty>
                      )}
                      <CommandGroup>
                        {templates.map((template) => (
                          <CommandItem
                            key={template.id}
                            value={template.name}
                            onSelect={() => {
                              setTemplateId(template.id);
                              setOpenTemplateDropdown(false);
                              setBody(prev => {
                                const separator = prev && !prev.endsWith('<p><br></p>') && !prev.endsWith('</p>') ? '<br/><br/>' : '';
                                return prev + separator + template.content;
                              });
                              toast.success("Template text injected");
                            }}
                            className="flex flex-col items-start px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50"
                          >
                            <div className="flex items-center w-full">
                              <div className="flex-1 font-bold text-gray-900">{template.name}</div>
                              {templateId === template.id && (
                                <Check className="ml-auto h-4 w-4 text-blue-600 shrink-0" />
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule Send (Optional)</Label>
              <DateTimePicker
                value={scheduledFor} 
                onChange={setScheduledFor} 
                className="bg-white" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</Label>
            <div className="bg-white rounded-md border border-input shadow-sm [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-gray-50/50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[200px]">
              <ReactQuill 
                theme="snow" 
                value={body} 
                onChange={setBody}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              disabled={sending || !clientId || !selectedClient?.contact_email} 
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] font-bold uppercase tracking-tight"
            >
              {sending ? "Sending..." : "Send Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

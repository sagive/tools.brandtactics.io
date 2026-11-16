"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, FileText, AlertCircle, Plus, Send, Code2, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { logActivity } from "@/lib/activity-logger";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { processAndUploadEmailImages } from "@/lib/email-image-upload";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

import { sanitizeAndFixLinks } from "@/lib/link-utils";

export const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['link'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
  clipboard: {
    matchers: [
      [3, (node: any, delta: any) => {
        const urlRegex = /https?:\/\/[^\s]+/g;
        if (typeof node.data !== 'string') return delta;
        const matches = node.data.match(urlRegex);
        if (matches && matches.length > 0) {
          const ops: any[] = [];
          let str = node.data;
          let lastIndex = 0;
          let match;
          urlRegex.lastIndex = 0;
          while ((match = urlRegex.exec(str)) !== null) {
            const before = str.slice(lastIndex, match.index);
            if (before) ops.push({ insert: before });
            ops.push({ insert: match[0], attributes: { link: match[0] } });
            lastIndex = urlRegex.lastIndex;
          }
          const after = str.slice(lastIndex);
          if (after) ops.push({ insert: after });
          return { ops };
        }
        return delta;
      }],
      ['a', (node: any, delta: any) => {
        const text = (node.textContent || '').trim();
        // If the inner text of an <a> element is a URL, override the link attribute to match the text
        if (/^https?:\/\/[^\s]+/i.test(text)) {
          if (delta && delta.ops) {
            delta.ops.forEach((op: any) => {
              if (op.attributes) {
                op.attributes.link = text;
              }
            });
          }
        }
        return delta;
      }]
    ]
  }
};

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
  const { profile } = useAuth();
  
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
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

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

  const parseScheduledFromObj = (parsed: any): string => {
    // If explicit scheduledDate and scheduledTime are provided
    if (parsed.scheduledDate && parsed.scheduledTime) {
      return `${parsed.scheduledDate}T${parsed.scheduledTime}`;
    }
    if (parsed.scheduledDate && !parsed.scheduledTime) {
      return `${parsed.scheduledDate}T09:00`;
    }
    if (parsed.scheduledFor) {
      return String(parsed.scheduledFor);
    }
    if (parsed.date) {
      return String(parsed.date);
    }
    return "";
  };

  const getScheduledParts = (isoOrStr: string) => {
    if (!isoOrStr) return { date: "", time: "" };
    try {
      const parts = isoOrStr.split("T");
      return {
        date: parts[0] || "",
        time: parts[1] ? parts[1].substring(0, 5) : ""
      };
    } catch {
      return { date: "", time: "" };
    }
  };

  const toggleJsonMode = () => {
    if (!isJsonMode) {
      // Switching into JSON mode: serialize current values into formatted JSON
      const { date, time } = getScheduledParts(scheduledFor);
      const payload = {
        subject: subject || "נושא העדכון",
        message: body || "<p>תוכן העדכון...</p>",
        scheduledDate: date || "",
        scheduledTime: time || ""
      };
      setJsonInput(JSON.stringify(payload, null, 2));
      setIsJsonMode(true);
    } else {
      // Switching back to Form mode: try parsing JSON to populate fields
      if (jsonInput.trim()) {
        try {
          const parsed = JSON.parse(jsonInput);
          if (parsed.subject !== undefined) setSubject(String(parsed.subject));
          const calculatedSchedule = parseScheduledFromObj(parsed);
          setScheduledFor(calculatedSchedule);
          if (parsed.message !== undefined || parsed.body !== undefined) {
            setBody(String(parsed.message || parsed.body || ""));
          }
          setIsJsonMode(false);
        } catch (err: any) {
          toast.error("Invalid JSON syntax: " + err.message);
          return;
        }
      } else {
        setIsJsonMode(false);
      }
    }
  };

  const handleSendUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }

    let finalSubject = subject;
    let finalScheduledFor = scheduledFor;
    let currentBody = body;

    if (isJsonMode) {
      if (!jsonInput.trim()) {
        toast.error("Please enter a JSON payload or switch to normal mode.");
        return;
      }
      try {
        const parsed = JSON.parse(jsonInput);
        if (parsed.subject !== undefined) finalSubject = String(parsed.subject);
        finalScheduledFor = parseScheduledFromObj(parsed);
        if (parsed.message !== undefined || parsed.body !== undefined) {
          currentBody = String(parsed.message || parsed.body || "");
        }
      } catch (err: any) {
        toast.error("Invalid JSON syntax: " + err.message);
        return;
      }
    }

    setSending(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';

      let finalBody = sanitizeAndFixLinks(currentBody);
      if (currentBody.includes("data:image/")) {
        const toastId = toast.loading("Compressing & uploading image...");
        try {
          finalBody = await processAndUploadEmailImages(finalBody, clientId);
          finalBody = sanitizeAndFixLinks(finalBody);
          toast.dismiss(toastId);
        } catch (err) {
          toast.dismiss(toastId);
          console.error("Image processing error:", err);
        }
      }

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ clientId, subject: finalSubject, body: finalBody, scheduledFor: finalScheduledFor }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      
      if (data.simulated) {
        toast.success(`[Simulated] Update saved. Add RESEND_API_KEY to actually send.`);
      } else {
        toast.success(`Update sent successfully!`);
      }

      logActivity({
        userName: profile?.full_name || profile?.email || "Someone",
        clientId: clientId,
        actionType: 'seo_update_sent',
        content: `sent SEO update <b>"${finalSubject}"</b> to <b>${selectedClient?.name || "Client"}</b>`
      });

      setBody("");
      setJsonInput("");
      setIsJsonMode(false);
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
                    id="seoUpdateClient"
                    data-name="seo update client"
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
                    <CommandInput id="seoUpdateClientSearch" data-name="seo update client search" placeholder="Search clients..." className="h-10" />
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
                              className="flex flex-col items-start px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50 [&>svg:last-child]:hidden"
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
                    id="seoUpdateTemplate"
                    data-name="seo update template"
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
                    <CommandInput id="seoUpdateTemplateSearch" data-name="seo update template search" placeholder="Search templates..." className="h-10" />
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
                            className="flex flex-col items-start px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50 [&>svg:last-child]:hidden"
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
          {!isJsonMode ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</Label>
                  <Input id="seoUpdateSubject" data-name="seo update subject" value={subject} onChange={e => setSubject(e.target.value)} className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule Send (Optional)</Label>
                  <DateTimePicker
                    id="seoUpdateSchedule"
                    data-name="seo update schedule"
                    value={scheduledFor} 
                    onChange={setScheduledFor} 
                    className="bg-white" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</Label>
                <div id="seoUpdateMessage" data-name="seo update message" className="bg-white rounded-md border border-input shadow-sm [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-gray-50/50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[200px]">
                  <ReactQuill 
                    theme="snow" 
                    value={body} 
                    onChange={setBody}
                    modules={QUILL_MODULES}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Raw JSON Payload (Subject, Date, HTML Message)
                </Label>
                <span className="text-[11px] text-gray-400">
                  Accepts fields: <code>subject</code>, <code>message</code> (HTML), <code>scheduledDate</code> (YYYY-MM-DD), <code>scheduledTime</code> (HH:mm)
                </span>
              </div>
              <textarea
                id="seoUpdateJsonInput"
                data-name="seo update json input"
                rows={14}
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder={`{\n  "subject": "נושא העדכון",\n  "message": "<p>תוכן העדכון...</p>",\n  "scheduledDate": "2026-11-16",\n  "scheduledTime": "13:35"\n}`}
                className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-md border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                spellCheck={false}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              id="seoUpdateToggleJsonBtn"
              data-name="seo update toggle json"
              variant="outline"
              size="sm"
              onClick={toggleJsonMode}
              className={cn(
                "h-9 px-3 text-xs font-bold gap-1.5 transition-colors border-dashed",
                isJsonMode 
                  ? "bg-slate-900 text-white border-slate-700 hover:bg-slate-800" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-blue-600"
              )}
            >
              {isJsonMode ? (
                <>
                  <LayoutList className="w-4 h-4 text-blue-400" />
                  <span>Switch to Form View</span>
                </>
              ) : (
                <>
                  <Code2 className="w-4 h-4 text-purple-600" />
                  <span>Insert JSON Payload</span>
                </>
              )}
            </Button>

            <Button 
              id="seoUpdateSubmitBtn"
              data-name="seo update submit"
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
